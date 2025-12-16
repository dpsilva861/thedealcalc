import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { zip_code, city, state } = await req.json();

    if (!zip_code) {
      return new Response(
        JSON.stringify({ error: "zip_code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Tracking ZIP code: ${zip_code}, city: ${city}, state: ${state}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Upsert zip code - increment count if exists, insert if new
    const { error } = await supabase
      .from("zip_codes")
      .upsert(
        {
          zip_code,
          city: city || null,
          state: state || null,
          analysis_count: 1,
        },
        {
          onConflict: "zip_code",
          ignoreDuplicates: false,
        }
      );

    if (error) {
      // If upsert failed due to conflict, try updating the count
      console.log("Upsert failed, trying to increment:", error.message);
      
      const { error: updateError } = await supabase
        .rpc("increment_zip_count", { p_zip_code: zip_code });
      
      if (updateError) {
        console.error("Failed to increment zip count:", updateError);
        // Don't fail the request - this is just analytics
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error tracking ZIP:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
