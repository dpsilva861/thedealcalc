import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, itemIndex, action, modifiedText } = body;

    // Validate required fields
    if (!jobId || typeof jobId !== "string") {
      return NextResponse.json(
        { success: false, error: "jobId is required" },
        { status: 400 }
      );
    }

    if (typeof itemIndex !== "number" || itemIndex < 0) {
      return NextResponse.json(
        { success: false, error: "itemIndex must be a non-negative number" },
        { status: 400 }
      );
    }

    if (!action || !["accepted", "rejected", "modified", "skipped"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "action must be 'accepted', 'rejected', 'modified', or 'skipped'" },
        { status: 400 }
      );
    }

    if (action === "modified" && (!modifiedText || typeof modifiedText !== "string")) {
      return NextResponse.json(
        { success: false, error: "modifiedText is required when action is 'modified'" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Fetch the job to get the redline item's category and severity
    const { data: job } = await supabase
      .from("redline_jobs")
      .select("output_json")
      .eq("id", jobId)
      .single();

    const outputJson = job?.output_json as { redlines?: { category?: string; severity?: string }[] } | null;
    const redlineItem = outputJson?.redlines?.[itemIndex];

    const { data, error } = await supabase
      .from("redline_item_feedback")
      .insert({
        job_id: jobId,
        redline_item_index: itemIndex,
        category: redlineItem?.category || null,
        severity: redlineItem?.severity || null,
        action,
        modified_text: modifiedText || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error storing item feedback:", error);
      return NextResponse.json(
        { success: false, error: "Failed to store feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: { id: data.id } });
  } catch (error) {
    console.error("Item feedback error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to process feedback" },
      { status: 500 }
    );
  }
}
