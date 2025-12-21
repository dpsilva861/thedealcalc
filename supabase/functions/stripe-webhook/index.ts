import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  console.log("Received webhook request");

  let event: Stripe.Event;
  
  try {
    if (!webhookSecret) {
      console.error("CRITICAL: STRIPE_WEBHOOK_SECRET is not configured");
      console.warn("WARNING: Processing webhook without signature verification!");
      event = JSON.parse(body) as Stripe.Event;
    } else if (!signature) {
      console.error("No stripe-signature header present");
      return new Response("Missing stripe-signature header", { status: 400 });
    } else {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      console.log("Webhook signature verified successfully");
    }
    console.log("Webhook event type:", event.type, "| Event ID:", event.id);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Idempotency check - check database for processed events
  const { data: existingEvent } = await supabaseAdmin
    .from("stripe_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();

  if (existingEvent) {
    console.log(`Event ${event.id} already processed, skipping (idempotency)`);
    return new Response(JSON.stringify({ received: true, skipped: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Processing checkout.session.completed:", session.id);
        
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        
        // Get user_id from metadata or client_reference_id
        const userId = session.metadata?.user_id || session.client_reference_id;
        const planTier = session.metadata?.plan_tier || "basic";
        const selectedCalculator = session.metadata?.selected_calculator || "residential";

        if (!userId) {
          console.error("No user_id in session metadata or client_reference_id");
          break;
        }

        console.log("Activating subscription for user:", userId, "calculator:", selectedCalculator);

        // Fetch subscription details for accurate end date
        let subscriptionEndDate: string | null = null;
        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            subscriptionEndDate = new Date(subscription.current_period_end * 1000).toISOString();
          } catch (subErr) {
            console.error("Failed to fetch subscription details:", subErr);
          }
        }

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: "active",
            subscription_end_date: subscriptionEndDate,
            plan_tier: planTier,
            selected_calculator: selectedCalculator,
          })
          .eq("user_id", userId);

        if (error) {
          console.error("Error updating profile for checkout:", error);
          throw error;
        }
        console.log("Successfully activated Basic subscription for user:", userId);
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Processing subscription.created:", subscription.id);

        const userId = subscription.metadata?.user_id;
        const planTier = subscription.metadata?.plan_tier || "basic";
        const selectedCalculator = subscription.metadata?.selected_calculator || "residential";
        const customerId = subscription.customer as string;

        if (userId) {
          const endDate = subscription.current_period_end 
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null;

          const { error } = await supabaseAdmin
            .from("profiles")
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscription.id,
              subscription_status: "active",
              subscription_end_date: endDate,
              plan_tier: planTier,
              selected_calculator: selectedCalculator,
            })
            .eq("user_id", userId);

          if (error) {
            console.error("Error updating profile for subscription.created:", error);
          } else {
            console.log("Subscription created for user:", userId);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Processing subscription.updated:", subscription.id, "status:", subscription.status);

        let status: string;
        let planTier: string;
        
        switch (subscription.status) {
          case "active":
          case "trialing":
            status = "active";
            planTier = subscription.metadata?.plan_tier || "basic";
            break;
          case "past_due":
            status = "past_due";
            planTier = subscription.metadata?.plan_tier || "basic";
            break;
          case "canceled":
          case "unpaid":
            status = "canceled";
            planTier = "free";
            break;
          default:
            status = "inactive";
            planTier = "free";
        }

        const endDate = subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;

        // First try by subscription ID
        const { data, error } = await supabaseAdmin
          .from("profiles")
          .update({
            subscription_status: status,
            subscription_end_date: endDate,
            plan_tier: planTier,
          })
          .eq("stripe_subscription_id", subscription.id)
          .select();

        if (error) {
          console.error("Error updating subscription:", error);
          throw error;
        }

        if (!data || data.length === 0) {
          // Fallback: try by customer ID
          const customerId = subscription.customer as string;
          console.log("No profile by subscription_id, trying customer_id:", customerId);
          
          await supabaseAdmin
            .from("profiles")
            .update({
              stripe_subscription_id: subscription.id,
              subscription_status: status,
              subscription_end_date: endDate,
              plan_tier: planTier,
            })
            .eq("stripe_customer_id", customerId);
        }

        console.log("Subscription updated successfully");
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Processing subscription.deleted:", subscription.id);

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            subscription_status: "canceled",
            stripe_subscription_id: null,
            plan_tier: "free",
            // Keep selected_calculator for re-subscription
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error("Error canceling subscription:", error);
          throw error;
        }
        console.log("Subscription canceled, user downgraded to free");
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Processing invoice.payment_succeeded:", invoice.id);

        const subscriptionId = invoice.subscription as string;
        if (subscriptionId) {
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({ subscription_status: "active" })
            .eq("stripe_subscription_id", subscriptionId);

          if (error) {
            console.error("Error updating after payment success:", error);
          } else {
            console.log("Subscription reactivated after payment");
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Processing invoice.payment_failed:", invoice.id);

        const subscriptionId = invoice.subscription as string;
        if (subscriptionId) {
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({ subscription_status: "past_due" })
            .eq("stripe_subscription_id", subscriptionId);

          if (error) {
            console.error("Error updating payment status:", error);
            throw error;
          }
          console.log("Profile updated to past_due status");
        }
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    // Mark event as processed (idempotency)
    const { error: insertError } = await supabaseAdmin
      .from("stripe_events")
      .insert({ id: event.id, event_type: event.type });

    if (insertError) {
      console.warn("Failed to record event for idempotency:", insertError);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
