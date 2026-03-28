import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, returnUrl } = body;

    if (!returnUrl || typeof returnUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "returnUrl is required" },
        { status: 400 }
      );
    }

    const { sessionId, url } = await createCheckoutSession(
      userId || "anonymous",
      returnUrl
    );

    return NextResponse.json({
      success: true,
      data: { sessionId, url },
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
