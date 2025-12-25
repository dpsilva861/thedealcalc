import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// CORS configuration - restrict to known origins
const ALLOWED_ORIGINS = [
  "https://yneaxuokgfqyoomycjam.lovableproject.com",
  "https://dealcalc.app",
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

// Simple rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60000;

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

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: corsHeaders,
      status: 405,
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY || !STRIPE_SECRET_KEY) {
      throw new Error("Server configuration error");
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        headers: corsHeaders,
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        headers: corsHeaders,
        status: 401,
      });
    }

    // Rate limiting
    if (!checkRateLimit(user.id)) {
      return new Response(JSON.stringify({ error: "Too many requests. Please wait." }), {
        headers: corsHeaders,
        status: 429,
      });
    }

    console.log("Syncing subscription for user:", user.id.substring(0, 8) + "...");

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the user's billing data from private table (service role only)
    const { data: billing, error: billingError } = await supabaseAdmin
      .from("billing_private")
      .select("stripe_customer_id, stripe_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });

    let syncedStatus = "inactive";
    let syncedEndDate: string | null = null;
    let syncedSubscriptionId: string | null = null;
    let syncedCustomerId: string | null = billing?.stripe_customer_id || null;

    // Try to find customer by email if we don't have a customer ID
    if (!syncedCustomerId && user.email) {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });
      if (customers.data.length > 0) {
        syncedCustomerId = customers.data[0].id;
      }
    }

    // If we have a customer, check their subscriptions
    if (syncedCustomerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: syncedCustomerId,
        status: "all",
        limit: 10,
      });

      const activeSubscription = subscriptions.data.find(
        (sub: Stripe.Subscription) => sub.status === "active" || sub.status === "trialing"
      );

      if (activeSubscription) {
        syncedStatus = "active";
        syncedSubscriptionId = activeSubscription.id;
        syncedEndDate = new Date(activeSubscription.current_period_end * 1000).toISOString();
      } else {
        const pastDueSubscription = subscriptions.data.find(
          (sub: Stripe.Subscription) => sub.status === "past_due"
        );
        if (pastDueSubscription) {
          syncedStatus = "past_due";
          syncedSubscriptionId = pastDueSubscription.id;
          syncedEndDate = new Date(pastDueSubscription.current_period_end * 1000).toISOString();
        }
      }
    }

    // Update billing_private with Stripe data (service role has access)
    if (syncedCustomerId) {
      await supabaseAdmin
        .from("billing_private")
        .upsert({
          user_id: user.id,
          stripe_customer_id: syncedCustomerId,
          stripe_subscription_id: syncedSubscriptionId,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
    }

    // Update the profile with subscription status only (no Stripe IDs)
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        subscription_status: syncedStatus,
        subscription_end_date: syncedEndDate,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating profile");
      throw updateError;
    }

    console.log("Subscription sync completed. Status:", syncedStatus);

    return new Response(JSON.stringify({
      success: true,
      status: syncedStatus,
    }), {
      headers: corsHeaders,
      status: 200,
    });
  } catch (error) {
    console.error("Sync error occurred");
    return new Response(JSON.stringify({ error: "Sync failed" }), {
      headers: corsHeaders,
      status: 400,
    });
  }
});