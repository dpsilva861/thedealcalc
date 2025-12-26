import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// CORS configuration - restrict to known origins in production
const ALLOWED_ORIGINS = [
  "https://yneaxuokgfqyoomycjam.lovableproject.com",
  "https://thedealcalc.com",
  "http://localhost:5173",
  "http://localhost:3000",
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(o => origin.startsWith(o.replace(/\/$/, "")))
    ? origin
    : ALLOWED_ORIGINS[0];
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Content-Type": "application/json",
  };
}

const STRIPE_API_BASE = "https://api.stripe.com/v1";

// Allowed values for input validation
const ALLOWED_CALCULATORS = ["residential", "brrrr", "commercial", "multifamily"];
const ALLOWED_PLAN_TIERS = ["basic", "pro"];
const MAX_ORIGIN_LENGTH = 200;

// Plan configuration with amounts in cents
const PLAN_CONFIG = {
  basic: {
    amount: 300, // $3.00
    name: "Basic Plan",
    description: "Access to 1 calculator, unlimited scenarios",
  },
  pro: {
    amount: 700, // $7.00
    name: "Pro Plan",
    description: "Access to ALL calculators, unlimited scenarios",
  },
} as const;

function requireEnv(name: string) {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

function getStripeSecret() {
  const raw = requireEnv("STRIPE_SECRET_KEY");
  const sanitized = raw.replace(/\s+/g, "").replace(/[^\x21-\x7E]/g, "");

  if (sanitized !== raw) {
    throw new Error("STRIPE_SECRET_KEY contains invalid characters");
  }

  if (raw.startsWith("pk_")) {
    throw new Error("Invalid key type: use secret key (sk_*), not publishable key");
  }

  if (/[\*•…]/.test(raw)) {
    throw new Error("STRIPE_SECRET_KEY appears to be masked/redacted");
  }

  if (!/^sk_(test|live)_[0-9a-zA-Z_]+$/.test(raw)) {
    throw new Error("Invalid STRIPE_SECRET_KEY format");
  }

  return raw;
}

// Validate and sanitize calculator selection
function validateCalculator(input: unknown): string {
  if (typeof input !== "string") return "residential";
  const normalized = input.toLowerCase().trim().slice(0, 50);
  return ALLOWED_CALCULATORS.includes(normalized) ? normalized : "residential";
}

// Validate plan tier
function validatePlanTier(input: unknown): "basic" | "pro" {
  if (typeof input !== "string") return "basic";
  const normalized = input.toLowerCase().trim();
  return ALLOWED_PLAN_TIERS.includes(normalized) ? normalized as "basic" | "pro" : "basic";
}

// Validate origin URL
function validateOrigin(input: unknown, defaultOrigin: string): string {
  if (typeof input !== "string") return defaultOrigin;
  const trimmed = input.trim().slice(0, MAX_ORIGIN_LENGTH);
  
  // Must be a valid HTTPS URL (or localhost for dev)
  try {
    const url = new URL(trimmed);
    if (url.protocol === "https:" || url.hostname === "localhost") {
      // Check against allowed origins
      if (ALLOWED_ORIGINS.some(o => trimmed.startsWith(o.replace(/\/$/, "")))) {
        return trimmed;
      }
    }
  } catch {
    // Invalid URL
  }
  return defaultOrigin;
}

async function stripeFetch<T>(
  path: string,
  opts: {
    method?: "GET" | "POST";
    form?: Record<string, string>;
    query?: Record<string, string>;
  } = {}
): Promise<T> {
  const secret = getStripeSecret();
  const method = opts.method ?? "GET";

  const url = new URL(`${STRIPE_API_BASE}${path}`);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) url.searchParams.set(k, v);
  }

  const headers: HeadersInit = {
    Authorization: `Bearer ${secret}`,
  };

  let body: BodyInit | undefined;
  if (method === "POST") {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(opts.form ?? {}).toString();
  }

  const res = await fetch(url.toString(), { method, headers, body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (json && (json.error?.message as string)) || `Stripe request failed: ${res.status}`;
    throw new Error(message);
  }
  return json as T;
}

type StripeListResponse<T> = { data: T[] };
type StripeCustomer = { id: string; email: string | null };
type StripeProduct = { id: string; name: string };
type StripePrice = { id: string; unit_amount: number | null; currency: string; recurring?: { interval: string } | null; active?: boolean };
type StripeCheckoutSession = { id: string; url: string | null };

// Simple in-memory rate limiting (per user, resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  entry.count++;
  return true;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: corsHeaders,
      status: 405,
    });
  }

  // Request size limit (16KB should be more than enough for checkout request)
  const contentLength = parseInt(req.headers.get("content-length") || "0");
  if (contentLength > 16384) {
    return new Response(JSON.stringify({ error: "Request too large" }), {
      headers: corsHeaders,
      status: 413,
    });
  }

  try {
    // Validate required env vars at request time
    requireEnv("STRIPE_SECRET_KEY");
    requireEnv("SUPABASE_URL");
    requireEnv("SUPABASE_ANON_KEY");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        headers: corsHeaders,
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        headers: corsHeaders,
        status: 401,
      });
    }

    // Rate limiting
    if (!checkRateLimit(user.id)) {
      return new Response(JSON.stringify({ error: "Too many requests. Please wait a minute." }), {
        headers: corsHeaders,
        status: 429,
      });
    }

    console.log("Creating checkout for user:", user.id.substring(0, 8) + "...");

    // Parse and validate request body
    const defaultOrigin = "https://yneaxuokgfqyoomycjam.lovableproject.com";
    let validatedOrigin = defaultOrigin;
    let selectedCalculator = "residential";
    let planTier: "basic" | "pro" = "basic";
    
    try {
      const body = await req.json();
      validatedOrigin = validateOrigin(body?.origin, defaultOrigin);
      selectedCalculator = validateCalculator(body?.selectedCalculator);
      planTier = validatePlanTier(body?.planTier);
    } catch {
      // Use defaults if body parsing fails
    }

    console.log("Validated plan:", planTier, "calculator:", selectedCalculator);

    // Get plan configuration
    const planConfig = PLAN_CONFIG[planTier];

    // Get or create customer
    const customers = await stripeFetch<StripeListResponse<StripeCustomer>>(
      "/customers",
      {
        method: "GET",
        query: {
          email: String(user.email ?? ""),
          limit: "1",
        },
      }
    );

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripeFetch<StripeCustomer>("/customers", {
        method: "POST",
        form: {
          email: String(user.email ?? ""),
          "metadata[supabase_user_id]": user.id,
        },
      });
      customerId = customer.id;
    }

    // Get or create product + price for the selected plan
    const products = await stripeFetch<StripeListResponse<StripeProduct>>(
      "/products",
      {
        method: "GET",
        query: {
          limit: "100",
          active: "true",
        },
      }
    );

    const existingProduct = products.data.find(
      (p) => p.name === planConfig.name
    );

    let priceId: string;

    if (!existingProduct) {
      // Create product
      const product = await stripeFetch<StripeProduct>("/products", {
        method: "POST",
        form: {
          name: planConfig.name,
          description: planConfig.description,
        },
      });

      // Create price
      const price = await stripeFetch<StripePrice>("/prices", {
        method: "POST",
        form: {
          product: product.id,
          unit_amount: String(planConfig.amount),
          currency: "usd",
          "recurring[interval]": "month",
        },
      });

      priceId = price.id;
    } else {
      // Find existing price with matching amount
      const prices = await stripeFetch<StripeListResponse<StripePrice>>(
        "/prices",
        {
          method: "GET",
          query: {
            product: existingProduct.id,
            active: "true",
            limit: "100",
          },
        }
      );

      const matchingPrice = prices.data.find(
        (p) =>
          p.unit_amount === planConfig.amount &&
          p.currency === "usd" &&
          p.recurring?.interval === "month"
      );

      if (matchingPrice?.id) {
        priceId = matchingPrice.id;
      } else {
        // Create new price for existing product
        const price = await stripeFetch<StripePrice>("/prices", {
          method: "POST",
          form: {
            product: existingProduct.id,
            unit_amount: String(planConfig.amount),
            currency: "usd",
            "recurring[interval]": "month",
          },
        });
        priceId = price.id;
      }
    }

    // Create checkout session with validated metadata
    const session = await stripeFetch<StripeCheckoutSession>(
      "/checkout/sessions",
      {
        method: "POST",
        form: {
          customer: customerId,
          mode: "subscription",
          success_url: `${validatedOrigin}/account?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${validatedOrigin}/pricing?checkout=cancel`,
          "line_items[0][price]": priceId,
          "line_items[0][quantity]": "1",
          client_reference_id: user.id,
          "metadata[user_id]": user.id,
          "metadata[plan_tier]": planTier,
          "metadata[selected_calculator]": planTier === "basic" ? selectedCalculator : "",
          "subscription_data[metadata][user_id]": user.id,
          "subscription_data[metadata][plan_tier]": planTier,
          "subscription_data[metadata][selected_calculator]": planTier === "basic" ? selectedCalculator : "",
        },
      }
    );

    console.log("Created checkout session for", planTier, "plan successfully");

    if (!session.url) throw new Error("Stripe did not return a checkout URL");

    return new Response(JSON.stringify({ url: session.url }), {
      headers: corsHeaders,
      status: 200,
    });
  } catch (error) {
    console.error("Checkout error occurred");
    // Return generic error message - don't expose internal details
    return new Response(JSON.stringify({ error: "Failed to create checkout session" }), {
      headers: corsHeaders,
      status: 400,
    });
  }
});
