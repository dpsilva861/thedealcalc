import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    "Content-Type": "application/json",
  };
}

// Input validation
function validateZipCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  // US ZIP code: 5 digits
  if (!/^\d{5}$/.test(trimmed)) return null;
  return trimmed;
}

function validateCityState(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim().slice(0, 100);
  // Only allow alphanumeric, spaces, hyphens, periods
  if (!/^[a-zA-Z0-9\s\-\.]*$/.test(trimmed)) return null;
  return trimmed || null;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: corsHeaders }
    );
  }

  // Request size limit
  const contentLength = parseInt(req.headers.get("content-length") || "0");
  if (contentLength > 1024) {
    return new Response(
      JSON.stringify({ error: "Request too large" }),
      { status: 413, headers: corsHeaders }
    );
  }

  try {
    const body = await req.json();
    
    const zipCode = validateZipCode(body?.zip_code);
    if (!zipCode) {
      return new Response(
        JSON.stringify({ error: "Invalid zip_code format" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const city = validateCityState(body?.city);
    const state = validateCityState(body?.state);

    console.log("Tracking ZIP code:", zipCode);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Server configuration error");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Upsert zip code - increment count if exists, insert if new
    const { error } = await supabase
      .from("zip_codes")
      .upsert(
        {
          zip_code: zipCode,
          city: city,
          state: state,
          analysis_count: 1,
        },
        {
          onConflict: "zip_code",
          ignoreDuplicates: false,
        }
      );

    if (error) {
      // If upsert failed, try incrementing
      const { error: updateError } = await supabase
        .rpc("increment_zip_count", { p_zip_code: zipCode });
      
      if (updateError) {
        // Don't fail the request - this is just analytics
        console.error("Failed to track zip code");
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("Error tracking ZIP");
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
