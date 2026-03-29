import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, userId, rating, feedbackText, wouldRecommend } = body;

    // Validate required fields
    if (!jobId || typeof jobId !== "string") {
      return NextResponse.json(
        { success: false, error: "jobId is required" },
        { status: 400 }
      );
    }

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "rating must be a number between 1 and 5" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Store feedback
    const { data, error } = await supabase
      .from("job_feedback")
      .insert({
        job_id: jobId,
        user_id: userId || null,
        rating,
        feedback_text: feedbackText || null,
        would_recommend: wouldRecommend ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error storing job feedback:", error);
      return NextResponse.json(
        { success: false, error: "Failed to store feedback" },
        { status: 500 }
      );
    }

    // Update prompt version's running average score
    const { data: job } = await supabase
      .from("redline_jobs")
      .select("prompt_version_id")
      .eq("id", jobId)
      .single();

    if (job?.prompt_version_id) {
      const { data: relatedJobs } = await supabase
        .from("redline_jobs")
        .select("id")
        .eq("prompt_version_id", job.prompt_version_id);

      const jobIds = relatedJobs?.map((j: { id: string }) => j.id) || [];

      if (jobIds.length > 0) {
        const { data: allFeedback } = await supabase
          .from("job_feedback")
          .select("rating")
          .in("job_id", jobIds);

        if (allFeedback && allFeedback.length > 0) {
          const avgScore =
            allFeedback.reduce((sum: number, f: { rating: number }) => sum + f.rating, 0) /
            allFeedback.length;

          await supabase
            .from("prompt_versions")
            .update({ avg_feedback_score: avgScore })
            .eq("id", job.prompt_version_id);
        }
      }
    }

    return NextResponse.json({ success: true, data: { id: data.id } });
  } catch (error) {
    console.error("Job feedback error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to process feedback" },
      { status: 500 }
    );
  }
}
