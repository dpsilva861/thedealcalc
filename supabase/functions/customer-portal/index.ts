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

// Validate origin URL
function validateOrigin(input: unknown, defaultOrigin: string): string {
  if (typeof input !== "string") return defaultOrigin;
  const trimmed = input.trim().slice(0, 200);
  
  try {
    const url = new URL(trimmed);
    if (url.protocol === "https:" || url.hostname === "localhost") {
      if (ALLOWED_ORIGINS.some(o => trimmed.startsWith(o.replace(/\/$/, "")))) {
        return trimmed;
      }
    }
  } catch {
    // Invalid URL
  }
  return defaultOrigin;
}

serve(async (req) => {
  const reqOrigin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(reqOrigin);

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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !STRIPE_SECRET_KEY) {
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

    console.log("Creating portal session for user:", user.id.substring(0, 8) + "...");

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });

    // Find customer by email - CRITICAL: Use authenticated user's email only
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ error: "No subscription found" }), {
        headers: corsHeaders,
        status: 404,
      });
    }

    // Parse body for origin
    const defaultOrigin = "https://yneaxuokgfqyoomycjam.lovableproject.com";
    let validatedOrigin = defaultOrigin;
    
    try {
      const body = await req.json();
      validatedOrigin = validateOrigin(body?.origin, defaultOrigin);
    } catch {
      // Use default
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${validatedOrigin}/account`,
    });

    console.log("Created portal session successfully");

    return new Response(JSON.stringify({ url: session.url }), {
      headers: corsHeaders,
      status: 200,
    });
  } catch (error) {
    console.error("Portal error occurred");
    return new Response(JSON.stringify({ error: "Failed to create portal session" }), {
      headers: corsHeaders,
      status: 400,
    });
  }
});
