import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    const { session_id } = await req.json();
    if (!session_id) {
      throw new Error("No session_id provided");
    }

    console.log("Verifying checkout session:", session_id, "for user:", user.id);

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["subscription"],
    });

    console.log("Session status:", session.payment_status, "client_reference_id:", session.client_reference_id);

    // Verify this session belongs to the current user
    const sessionUserId = session.metadata?.user_id || session.client_reference_id;
    if (sessionUserId !== user.id) {
      console.error("Session user mismatch:", sessionUserId, "vs", user.id);
      throw new Error("Session does not belong to this user");
    }

    // Check payment status
    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    // Extract subscription details
    const subscription = session.subscription as Stripe.Subscription | null;
    if (!subscription) {
      throw new Error("No subscription found");
    }

    const planTier = session.metadata?.plan_tier || "basic";
    const selectedCalculator = session.metadata?.selected_calculator || "residential";
    const subscriptionEndDate = subscription.current_period_end 
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;

    console.log("Updating profile with plan_tier:", planTier, "calculator:", selectedCalculator);

    // Update the user's profile with subscription info
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscription.id,
        subscription_status: "active",
        subscription_end_date: subscriptionEndDate,
        plan_tier: planTier,
        selected_calculator: selectedCalculator,
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      throw updateError;
    }

    // Fetch updated profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    console.log("Checkout verified successfully for user:", user.id);

    return new Response(
      JSON.stringify({
        success: true,
        plan_tier: planTier,
        selected_calculator: selectedCalculator,
        profile,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Verify checkout error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});