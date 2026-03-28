import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

/**
 * Create a Stripe Checkout Session for a $2 one-time LOI redline payment.
 */
export async function createCheckoutSession(
  userId: string,
  returnUrl: string
): Promise<{ sessionId: string; url: string }> {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      },
    ],
    success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${returnUrl}?canceled=true`,
    metadata: {
      userId,
    },
  });

  return {
    sessionId: session.id,
    url: session.url!,
  };
}

/**
 * Verify a Stripe payment was completed successfully.
 */
export async function verifyPayment(
  sessionId: string
): Promise<{ paid: boolean; userId: string | null }> {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return {
      paid: session.payment_status === "paid",
      userId: (session.metadata?.userId as string) || null,
    };
  } catch {
    return { paid: false, userId: null };
  }
}

/**
 * Construct a Stripe webhook event from raw body and signature.
 */
export function constructWebhookEvent(
  body: string | Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}
