import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STRIPE_API_BASE = "https://api.stripe.com/v1";

function requireEnv(name: string) {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function getStripeSecret() {
  const raw = requireEnv("STRIPE_SECRET_KEY");
  const sanitized = raw.replace(/\s+/g, "").replace(/[^\x21-\x7E]/g, "");

  // Fail fast if the key was pasted with hidden whitespace / special characters.
  if (sanitized !== raw) {
    console.warn("STRIPE_SECRET_KEY contains whitespace/non-ASCII characters.");
    throw new Error(
      "STRIPE_SECRET_KEY looks corrupted (contains whitespace or special characters). Re-copy the Secret key from Stripe Dashboard → Developers → API keys and update it in the backend."
    );
  }

  // Expected formats: sk_test_... or sk_live_...
  if (!/^sk_(test|live)_[0-9a-zA-Z_]+$/.test(raw)) {
    throw new Error(
      "Invalid STRIPE_SECRET_KEY format. Re-copy the Secret key (sk_test_... or sk_live_...) from Stripe Dashboard → Developers → API keys and update it in the backend."
    );
  }

  return raw;
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
    const message =
      (json && (json.error?.message as string)) ||
      `Stripe request failed: ${res.status}`;
    throw new Error(message);
  }
  return json as T;
}

type StripeListResponse<T> = { data: T[] };

type StripeCustomer = { id: string; email: string | null };
type StripeProduct = { id: string; name: string };
type StripePrice = { id: string; unit_amount: number | null; currency: string; recurring?: { interval: string } | null; active?: boolean };
type StripeCheckoutSession = { id: string; url: string | null };

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error:", userError);
      throw new Error("User not authenticated");
    }

    console.log("Creating checkout for user:", user.id, user.email);

    // Determine origin for redirects
    let origin = "https://yneaxuokgfqyoomycjam.lovableproject.com";
    try {
      const body = await req.json();
      if (body?.origin) origin = String(body.origin);
    } catch {
      // ignore
    }

    // 1) Get or create customer
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
      console.log("Found existing customer:", customerId);
    } else {
      const customer = await stripeFetch<StripeCustomer>("/customers", {
        method: "POST",
        form: {
          email: String(user.email ?? ""),
          "metadata[supabase_user_id]": user.id,
        },
      });
      customerId = customer.id;
      console.log("Created new customer:", customerId);
    }

    // 2) Get or create product + price
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
      (p) => p.name === "Pro Subscription"
    );

    let priceId: string;

    if (!existingProduct) {
      console.log("Creating new product and price");

      const product = await stripeFetch<StripeProduct>("/products", {
        method: "POST",
        form: {
          name: "Pro Subscription",
          description: "Unlimited deal analyses",
        },
      });

      const price = await stripeFetch<StripePrice>("/prices", {
        method: "POST",
        form: {
          product: product.id,
          unit_amount: "300",
          currency: "usd",
          "recurring[interval]": "month",
        },
      });

      priceId = price.id;
    } else {
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
          p.unit_amount === 300 &&
          p.currency === "usd" &&
          p.recurring?.interval === "month"
      );

      if (matchingPrice?.id) {
        priceId = matchingPrice.id;
      } else {
        console.log("No $3/month price found; creating a new $3/month price");
        const price = await stripeFetch<StripePrice>("/prices", {
          method: "POST",
          form: {
            product: existingProduct.id,
            unit_amount: "300",
            currency: "usd",
            "recurring[interval]": "month",
          },
        });
        priceId = price.id;
      }
    }

    console.log("Using price ID:", priceId);

    // 3) Create checkout session
    const session = await stripeFetch<StripeCheckoutSession>(
      "/checkout/sessions",
      {
        method: "POST",
        form: {
          customer: customerId,
          mode: "subscription",
          success_url: `${origin}/account?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/pricing`,
          "line_items[0][price]": priceId,
          "line_items[0][quantity]": "1",
          "metadata[supabase_user_id]": user.id,
        },
      }
    );

    console.log("Created checkout session:", session.id);

    if (!session.url) throw new Error("Stripe did not return a checkout URL");

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
