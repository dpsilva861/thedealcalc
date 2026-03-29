import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { createServerClient } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, error: "Job ID is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: job, error } = await supabase
      .from("redline_jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: job });
  } catch (error) {
    console.error("Results API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load results" },
      { status: 500 }
    );
  }
}
