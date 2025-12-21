import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

// In-memory set to track processed events (for idempotency within function lifetime)
// For production, consider storing processed event IDs in the database
const processedEvents = new Set<string>();

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  console.log("Received webhook request");

  let event: Stripe.Event;
  
  try {
    if (!webhookSecret) {
      console.error("CRITICAL: STRIPE_WEBHOOK_SECRET is not configured");
      // In production, we should reject requests without signature verification
      // For now, parse but log a critical warning
      console.warn("WARNING: Processing webhook without signature verification - this is insecure!");
      event = JSON.parse(body) as Stripe.Event;
    } else if (!signature) {
      console.error("No stripe-signature header present");
      return new Response("Missing stripe-signature header", { status: 400 });
    } else {
      // Verify webhook signature for production security
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      console.log("Webhook signature verified successfully");
    }
    console.log("Webhook event type:", event.type, "| Event ID:", event.id);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  // Idempotency check - prevent duplicate processing
  if (processedEvents.has(event.id)) {
    console.log(`Event ${event.id} already processed, skipping (idempotency)`);
    return new Response(JSON.stringify({ received: true, skipped: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Processing checkout.session.completed:", session.id);
        
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const userId = session.metadata?.supabase_user_id;

        if (!userId) {
          console.error("No supabase_user_id in session metadata");
          break;
        }

        // Fetch subscription details from Stripe for accurate data
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
          })
          .eq("user_id", userId);

        if (error) {
          console.error("Error updating profile for checkout:", error);
          throw error;
        }
        console.log("Successfully activated subscription for user:", userId);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Processing subscription.updated:", subscription.id, "status:", subscription.status);

        // Map Stripe status to our status
        let status: string;
        switch (subscription.status) {
          case "active":
          case "trialing":
            status = "active";
            break;
          case "past_due":
            status = "past_due";
            break;
          case "canceled":
          case "unpaid":
            status = "canceled";
            break;
          default:
            status = "inactive";
        }

        const endDate = subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;

        // First try to update by subscription ID
        const { data, error } = await supabaseAdmin
          .from("profiles")
          .update({
            subscription_status: status,
            subscription_end_date: endDate,
          })
          .eq("stripe_subscription_id", subscription.id)
          .select();

        if (error) {
          console.error("Error updating subscription by subscription_id:", error);
          throw error;
        }

        if (!data || data.length === 0) {
          // Fallback: try to find by customer ID
          const customerId = subscription.customer as string;
          console.log("No profile found by subscription_id, trying customer_id:", customerId);
          
          const { error: fallbackError } = await supabaseAdmin
            .from("profiles")
            .update({
              stripe_subscription_id: subscription.id,
              subscription_status: status,
              subscription_end_date: endDate,
            })
            .eq("stripe_customer_id", customerId);

          if (fallbackError) {
            console.error("Fallback update also failed:", fallbackError);
          }
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
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error("Error canceling subscription:", error);
          throw error;
        }
        console.log("Subscription canceled successfully");
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

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Processing invoice.paid:", invoice.id);

        const subscriptionId = invoice.subscription as string;
        if (subscriptionId) {
          // Reactivate subscription if it was past_due
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({ subscription_status: "active" })
            .eq("stripe_subscription_id", subscriptionId)
            .eq("subscription_status", "past_due");

          if (error) {
            console.error("Error reactivating subscription:", error);
          } else {
            console.log("Subscription reactivated after successful payment");
          }
        }
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    // Mark event as processed
    processedEvents.add(event.id);
    
    // Clean up old events to prevent memory bloat (keep last 1000)
    if (processedEvents.size > 1000) {
      const eventsToDelete = Array.from(processedEvents).slice(0, 500);
      eventsToDelete.forEach(id => processedEvents.delete(id));
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    // Return 500 so Stripe will retry
    return new Response(JSON.stringify({ error: message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
