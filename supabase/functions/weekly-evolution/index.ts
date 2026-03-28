// Supabase Edge Function: Weekly Prompt Evolution
// Schedule: Every Sunday at midnight UTC
// Cron: 0 0 * * 0

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SITE_URL = Deno.env.get("SITE_URL") || "https://redlineiq.com";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async () => {
  try {
    const response = await fetch(`${SITE_URL}/api/learning/evolve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": SERVICE_ROLE_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[weekly-evolution] Failed:", data);
      return new Response(JSON.stringify({ error: "Evolution failed", details: data }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("[weekly-evolution] Success:", data);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[weekly-evolution] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
