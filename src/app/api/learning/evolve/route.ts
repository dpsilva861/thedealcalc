import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { runWeeklyPromptEvolution } from "@/lib/learning/prompt-evolution";

function isAdminAuthorized(request: NextRequest): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) || [];
  const authHeader = request.headers.get("x-admin-email");
  const secretHeader = request.headers.get("x-admin-secret");

  if (secretHeader && secretHeader === process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return true;
  }

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

    const result = await runWeeklyPromptEvolution();

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Evolution error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Evolution failed",
      },
      { status: 500 }
    );
  }
}
