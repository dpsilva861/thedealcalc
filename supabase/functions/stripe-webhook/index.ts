import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Security headers for responses
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Content-Type": "application/json",
};

// Startup validation - fail fast if secrets are missing
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!STRIPE_SECRET_KEY) {
  console.error("FATAL: STRIPE_SECRET_KEY is not configured");
}
if (!STRIPE_WEBHOOK_SECRET) {
  console.error("FATAL: STRIPE_WEBHOOK_SECRET is not configured - webhook signature verification will fail");
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("FATAL: Supabase credentials not configured");
}

const stripe = new Stripe(STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

// Allowed plan tiers and calculator IDs for validation
const ALLOWED_PLAN_TIERS = ["free", "basic", "pro"];
const ALLOWED_CALCULATORS = ["residential", "commercial", "multifamily"];
const ALLOWED_SUBSCRIPTION_STATUSES = ["active", "inactive", "past_due", "canceled"];

// Validate and sanitize plan tier
function validatePlanTier(tier: string | undefined): string {
  const normalized = (tier || "basic").toLowerCase().trim();
  return ALLOWED_PLAN_TIERS.includes(normalized) ? normalized : "basic";
}

// Validate and sanitize calculator
function validateCalculator(calc: string | undefined): string {
  const normalized = (calc || "residential").toLowerCase().trim();
  return ALLOWED_CALCULATORS.includes(normalized) ? normalized : "residential";
}

// Validate subscription status
function validateStatus(status: string): string {
  return ALLOWED_SUBSCRIPTION_STATUSES.includes(status) ? status : "inactive";
}

// Redact sensitive data from logging
function safeLog(message: string, data?: Record<string, unknown>) {
  const safeData = data ? { ...data } : {};
  // Never log these fields
  delete safeData.email;
  delete safeData.customer;
  delete safeData.customerId;
  console.log(message, Object.keys(safeData).length > 0 ? JSON.stringify(safeData) : "");
}

// Helper to update billing_private table
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertBilling(
  supabaseAdmin: any,
  userId: string,
  customerId: string,
  subscriptionId: string | null
) {
  await supabaseAdmin
    .from("billing_private")
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
}

// Helper to find user_id by subscription_id in billing_private
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function findUserBySubscriptionId(
  supabaseAdmin: any,
  subscriptionId: string
): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("billing_private")
    .select("user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();
  return (data?.user_id as string) || null;
}

// Helper to find user_id by customer_id in billing_private
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function findUserByCustomerId(
  supabaseAdmin: any,
  customerId: string
): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("billing_private")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return (data?.user_id as string) || null;
}

serve(async (req) => {
  // Rate limiting: basic request size check (10KB max for webhooks)
  const contentLength = parseInt(req.headers.get("content-length") || "0");
  if (contentLength > 10240) {
    return new Response(JSON.stringify({ error: "Payload too large" }), {
      headers: securityHeaders,
      status: 413,
    });
  }

  // Require webhook secret to be configured
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error("CRITICAL: STRIPE_WEBHOOK_SECRET is not configured - rejecting webhook");
    return new Response(JSON.stringify({ error: "Webhook not configured" }), {
      headers: securityHeaders,
      status: 500,
    });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("CRITICAL: Supabase credentials not configured");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      headers: securityHeaders,
      status: 500,
    });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    safeLog("Rejected: Missing stripe-signature header");
    return new Response(JSON.stringify({ error: "Missing signature" }), {
      headers: securityHeaders,
      status: 400,
    });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET);
    safeLog("Webhook verified", { type: event.type, id: event.id });
  } catch (err) {
    safeLog("Webhook signature verification failed");
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      headers: securityHeaders,
      status: 400,
    });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Idempotency check
  const { data: existingEvent } = await supabaseAdmin
    .from("stripe_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();

  if (existingEvent) {
    safeLog("Event already processed (idempotency)", { id: event.id });
    return new Response(JSON.stringify({ received: true, skipped: true }), {
      headers: securityHeaders,
      status: 200,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        
        // CRITICAL: Get user_id from Stripe metadata only - never trust client
        const userId = session.metadata?.user_id || session.client_reference_id;
        
        // Validate inputs
        const planTier = validatePlanTier(session.metadata?.plan_tier);
        const selectedCalculator = validateCalculator(session.metadata?.selected_calculator);

        if (!userId) {
          safeLog("No user_id in session metadata or client_reference_id");
          break;
        }

        // Validate userId format (UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(userId)) {
          safeLog("Invalid user_id format in metadata");
          break;
        }

        safeLog("Activating subscription", { userId: userId.substring(0, 8) + "...", planTier });

        let subscriptionEndDate: string | null = null;
        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            subscriptionEndDate = new Date(subscription.current_period_end * 1000).toISOString();
          } catch (subErr) {
            safeLog("Failed to fetch subscription details");
          }
        }

        // Store Stripe IDs in billing_private
        await upsertBilling(supabaseAdmin, userId, customerId, subscriptionId);

        // Update profiles with subscription info only (no Stripe IDs)
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            subscription_status: validateStatus("active"),
            subscription_end_date: subscriptionEndDate,
            plan_tier: planTier,
            selected_calculator: selectedCalculator,
          })
          .eq("user_id", userId);

        if (error) {
          safeLog("Error updating profile for checkout");
          throw error;
        }
        safeLog("Subscription activated", { userId: userId.substring(0, 8) + "..." });
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;

        const userId = subscription.metadata?.user_id;
        const planTier = validatePlanTier(subscription.metadata?.plan_tier);
        const selectedCalculator = validateCalculator(subscription.metadata?.selected_calculator);
        const customerId = subscription.customer as string;

        if (userId) {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(userId)) {
            safeLog("Invalid user_id format in subscription metadata");
            break;
          }

          const endDate = subscription.current_period_end 
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null;

          // Store Stripe IDs in billing_private
          await upsertBilling(supabaseAdmin, userId, customerId, subscription.id);

          // Update profiles with subscription info only
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({
              subscription_status: validateStatus("active"),
              subscription_end_date: endDate,
              plan_tier: planTier,
              selected_calculator: selectedCalculator,
            })
            .eq("user_id", userId);

          if (error) {
            safeLog("Error updating profile for subscription.created");
          } else {
            safeLog("Subscription created", { userId: userId.substring(0, 8) + "..." });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        let status: string;
        let planTier: string;
        
        switch (subscription.status) {
          case "active":
          case "trialing":
            status = "active";
            planTier = validatePlanTier(subscription.metadata?.plan_tier);
            break;
          case "past_due":
            status = "past_due";
            planTier = validatePlanTier(subscription.metadata?.plan_tier);
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

        // Find user by subscription_id in billing_private
        let userId = await findUserBySubscriptionId(supabaseAdmin, subscription.id);
        
        if (!userId) {
          // Try by customer_id
          const customerId = subscription.customer as string;
          userId = await findUserByCustomerId(supabaseAdmin, customerId);
        }

        if (userId) {
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({
              subscription_status: validateStatus(status),
              subscription_end_date: endDate,
              plan_tier: planTier,
            })
            .eq("user_id", userId);

          if (error) {
            safeLog("Error updating subscription");
            throw error;
          }
        } else {
          safeLog("No user found for subscription update", { subscriptionId: subscription.id });
        }

        safeLog("Subscription updated", { status });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        // Find user by subscription_id in billing_private
        const userId = await findUserBySubscriptionId(supabaseAdmin, subscription.id);

        if (userId) {
          // Update profiles
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({
              subscription_status: validateStatus("canceled"),
              plan_tier: "free",
            })
            .eq("user_id", userId);

          if (error) {
            safeLog("Error canceling subscription");
            throw error;
          }

          // Clear subscription ID in billing_private
          await supabaseAdmin
            .from("billing_private")
            .update({ stripe_subscription_id: null })
            .eq("user_id", userId);

          safeLog("Subscription canceled, user downgraded to free");
        } else {
          safeLog("No user found for subscription deletion");
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        const subscriptionId = invoice.subscription as string;
        if (subscriptionId) {
          const userId = await findUserBySubscriptionId(supabaseAdmin, subscriptionId);
          
          if (userId) {
            const { error } = await supabaseAdmin
              .from("profiles")
              .update({ subscription_status: validateStatus("active") })
              .eq("user_id", userId);

            if (error) {
              safeLog("Error updating after payment success");
            } else {
              safeLog("Subscription reactivated after payment");
            }
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        const subscriptionId = invoice.subscription as string;
        if (subscriptionId) {
          const userId = await findUserBySubscriptionId(supabaseAdmin, subscriptionId);

          if (userId) {
            const { error } = await supabaseAdmin
              .from("profiles")
              .update({ subscription_status: validateStatus("past_due") })
              .eq("user_id", userId);

            if (error) {
              safeLog("Error updating payment status");
              throw error;
            }
            safeLog("Profile updated to past_due status");
          }
        }
        break;
      }

      default:
        safeLog("Unhandled event type", { type: event.type });
    }

    // Mark event as processed (idempotency)
    const { error: insertError } = await supabaseAdmin
      .from("stripe_events")
      .insert({ id: event.id, event_type: event.type });

    if (insertError) {
      safeLog("Failed to record event for idempotency");
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: securityHeaders,
      status: 200,
    });
  } catch (error) {
    safeLog("Webhook processing error");
    return new Response(JSON.stringify({ error: "Processing failed" }), {
      headers: securityHeaders,
      status: 500,
    });
  }
});