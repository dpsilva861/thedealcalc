import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { constructWebhookEvent } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { success: false, error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const event = constructWebhookEvent(body, signature);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as {
          id: string;
          metadata?: { userId?: string };
          payment_status: string;
        };

        if (session.payment_status === "paid" && session.metadata?.userId) {
          const supabase = createServerClient();

          // Credit the user's account
          const { data: user } = await supabase
            .from("users")
            .select("credits")
            .eq("id", session.metadata.userId)
            .single();

          if (user) {
            await supabase
              .from("users")
              .update({ credits: (user.credits || 0) + 1 })
              .eq("id", session.metadata.userId);
          }
        }
        break;
      }

      default:
        // Unhandled event type - log but don't error
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return NextResponse.json({ success: true, data: { received: true } });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Webhook processing failed" },
      { status: 400 }
    );
  }
}
