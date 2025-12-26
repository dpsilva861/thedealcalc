import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// CORS configuration - restrict to known origins
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

// Startup validation
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!STRIPE_SECRET_KEY) {
  console.error("FATAL: STRIPE_SECRET_KEY is not configured");
}

const stripe = new Stripe(STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

// Allowed values for validation
const ALLOWED_PLAN_TIERS = ["free", "basic", "pro"];
const ALLOWED_CALCULATORS = ["residential", "commercial", "multifamily"];

function validatePlanTier(tier: string | undefined): string {
  const normalized = (tier || "basic").toLowerCase().trim();
  return ALLOWED_PLAN_TIERS.includes(normalized) ? normalized : "basic";
}

function validateCalculator(calc: string | undefined): string {
  const normalized = (calc || "residential").toLowerCase().trim();
  return ALLOWED_CALCULATORS.includes(normalized) ? normalized : "residential";
}

// Validate session_id format (Stripe checkout session IDs start with cs_)
function validateSessionId(sessionId: unknown): string | null {
  if (typeof sessionId !== "string") return null;
  const trimmed = sessionId.trim();
  if (trimmed.length < 10 || trimmed.length > 200) return null;
  if (!trimmed.startsWith("cs_")) return null;
  // Only allow alphanumeric and underscore
  if (!/^cs_[a-zA-Z0-9_]+$/.test(trimmed)) return null;
  return trimmed;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: corsHeaders,
      status: 405,
    });
  }

  // Request size limit
  const contentLength = parseInt(req.headers.get("content-length") || "0");
  if (contentLength > 4096) {
    return new Response(JSON.stringify({ error: "Request too large" }), {
      headers: corsHeaders,
      status: 413,
    });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Server configuration error");
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

    const body = await req.json();
    const sessionId = validateSessionId(body?.session_id);
    
    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Invalid session_id format" }), {
        headers: corsHeaders,
        status: 400,
      });
    }

    console.log("Verifying checkout session for user:", user.id.substring(0, 8) + "...");

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    // CRITICAL: Verify this session belongs to the current user
    const sessionUserId = session.metadata?.user_id || session.client_reference_id;
    if (sessionUserId !== user.id) {
      console.error("Session user mismatch - potential security issue");
      return new Response(JSON.stringify({ error: "Session does not belong to this user" }), {
        headers: corsHeaders,
        status: 403,
      });
    }

    // Check payment status
    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Payment not completed" }), {
        headers: corsHeaders,
        status: 400,
      });
    }

    // Extract subscription details
    const subscription = session.subscription as Stripe.Subscription | null;
    if (!subscription) {
      return new Response(JSON.stringify({ error: "No subscription found" }), {
        headers: corsHeaders,
        status: 400,
      });
    }

    const planTier = validatePlanTier(session.metadata?.plan_tier);
    const selectedCalculator = validateCalculator(session.metadata?.selected_calculator);
    const subscriptionEndDate = subscription.current_period_end 
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;

    console.log("Updating profile with validated plan_tier:", planTier);

    // Store Stripe IDs in billing_private (service role only access)
    await supabaseAdmin
      .from("billing_private")
      .upsert({
        user_id: user.id,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscription.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    // Update the user's profile with subscription info (no Stripe IDs)
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        subscription_status: "active",
        subscription_end_date: subscriptionEndDate,
        plan_tier: planTier,
        selected_calculator: selectedCalculator,
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating profile");
      throw updateError;
    }

    // Fetch updated profile (safe fields only - no Stripe data)
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id, plan_tier, selected_calculator, subscription_status, analyses_used, free_analyses_limit")
      .eq("user_id", user.id)
      .single();

    console.log("Checkout verified successfully");

    return new Response(
      JSON.stringify({
        success: true,
        plan_tier: planTier,
        selected_calculator: selectedCalculator,
        profile,
      }),
      {
        headers: corsHeaders,
        status: 200,
      }
    );
  } catch (error) {
    console.error("Verify checkout error occurred");
    return new Response(JSON.stringify({ error: "Verification failed" }), {
      headers: corsHeaders,
      status: 400,
    });
  }
});