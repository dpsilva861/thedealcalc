import { createServerClient } from "@/lib/supabase";

type TrackableEvent =
  | "docx_downloaded"
  | "pdf_downloaded"
  | "results_viewed"
  | "time_on_results"
  | "resubmitted_different_mode"
  | "shared_results";

/**
 * Track user behavioral events on redline results.
 * Stores download flags and time-on-results on the job record.
 */
export async function trackEvent(
  jobId: string,
  userId: string,
  event: TrackableEvent,
  metadata?: { duration_seconds?: number; new_mode?: string }
): Promise<void> {
  try {
    const supabase = createServerClient();

    switch (event) {
      case "docx_downloaded":
        await supabase
          .from("redline_jobs")
          .update({ docx_downloaded: true })
          .eq("id", jobId);
        break;

      case "pdf_downloaded":
        await supabase
          .from("redline_jobs")
          .update({ pdf_downloaded: true })
          .eq("id", jobId);
        break;

      case "time_on_results":
        if (metadata?.duration_seconds) {
          await supabase
            .from("redline_jobs")
            .update({ time_on_results_seconds: metadata.duration_seconds })
            .eq("id", jobId);
        }
        break;

      case "results_viewed":
      case "resubmitted_different_mode":
      case "shared_results":
        console.log(
          `[behavioral] ${event} | job=${jobId} user=${userId}`,
          metadata || ""
        );
        break;
    }
  } catch (error) {
    console.error("Error tracking behavioral event:", error);
  }
}
