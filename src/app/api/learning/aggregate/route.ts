import { NextRequest, NextResponse } from "next/server";
import { runNightlyAggregation } from "@/lib/learning/aggregation-engine";

function isAdminAuthorized(request: NextRequest): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) || [];
  const authHeader = request.headers.get("x-admin-email");
  const secretHeader = request.headers.get("x-admin-secret");

  // Allow access via shared secret (for cron jobs / edge functions)
  if (secretHeader && secretHeader === process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return true;
  }

  // Allow access via admin email
  if (authHeader && adminEmails.includes(authHeader)) {
    return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdminAuthorized(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const summary = await runNightlyAggregation();

    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    console.error("Aggregation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Aggregation failed",
      },
      { status: 500 }
    );
  }
}
