import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    console.log("Syncing subscription for user:", user.id);

    // Get the user's profile
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Profile not found");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    let syncedStatus = "inactive";
    let syncedEndDate: string | null = null;
    let syncedSubscriptionId: string | null = null;
    let syncedCustomerId: string | null = profile.stripe_customer_id;

    // Try to find customer by email if we don't have a customer ID
    if (!syncedCustomerId && user.email) {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });
      if (customers.data.length > 0) {
        syncedCustomerId = customers.data[0].id;
        console.log("Found customer by email:", syncedCustomerId);
      }
    }

    // If we have a customer, check their subscriptions
    if (syncedCustomerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: syncedCustomerId,
        status: "all",
        limit: 10,
      });

      // Find the most recent active or trialing subscription
      const activeSubscription = subscriptions.data.find(
        (sub: Stripe.Subscription) => sub.status === "active" || sub.status === "trialing"
      );

      if (activeSubscription) {
        syncedStatus = "active";
        syncedSubscriptionId = activeSubscription.id;
        syncedEndDate = new Date(activeSubscription.current_period_end * 1000).toISOString();
        console.log("Found active subscription:", syncedSubscriptionId);
      } else {
        // Check for past_due
        const pastDueSubscription = subscriptions.data.find(
          (sub: Stripe.Subscription) => sub.status === "past_due"
        );
        if (pastDueSubscription) {
          syncedStatus = "past_due";
          syncedSubscriptionId = pastDueSubscription.id;
          syncedEndDate = new Date(pastDueSubscription.current_period_end * 1000).toISOString();
          console.log("Found past_due subscription:", syncedSubscriptionId);
        } else {
          console.log("No active subscriptions found");
        }
      }
    } else {
      console.log("No Stripe customer found for this user");
    }

    // Update the profile with synced data
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        stripe_customer_id: syncedCustomerId,
        stripe_subscription_id: syncedSubscriptionId,
        subscription_status: syncedStatus,
        subscription_end_date: syncedEndDate,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      throw updateError;
    }

    console.log("Subscription sync completed. Status:", syncedStatus);

    return new Response(JSON.stringify({
      success: true,
      status: syncedStatus,
      subscription_id: syncedSubscriptionId,
      end_date: syncedEndDate,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Sync error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
