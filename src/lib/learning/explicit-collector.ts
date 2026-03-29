import { createServerClient } from "@/lib/supabase";

/**
 * Process a user's modified recommendation. When users edit suggested language,
 * this is high-value signal because a human chose specific wording.
 */
export async function processModifiedRecommendation(
  jobId: string,
  itemIndex: number,
  category: string,
  originalRecommendation: string,
  userModifiedText: string
): Promise<void> {
  try {
    const supabase = createServerClient();

    // Check if similar modifications have been made before (fuzzy match on first 80 chars)
    const searchKey = userModifiedText.substring(0, 80).replace(/[%_]/g, "");
    const { data: similar } = await supabase
      .from("learned_patterns")
      .select("id, frequency, confidence, source_job_ids")
      .eq("pattern_type", "user_improved_language")
      .eq("category", category)
      .ilike("recommended_language", `%${searchKey}%`)
      .limit(1)
      .single();

    if (similar) {
      // Similar modification exists. Boost confidence based on frequency.
      const newFrequency = (similar.frequency || 1) + 1;
      // If 2+ users wrote similar modifications, confidence goes to 0.8
      const newConfidence = newFrequency >= 2 ? 0.8 : 0.6;
      const updatedJobIds = [...(similar.source_job_ids || []), jobId].slice(-100);

      await supabase
        .from("learned_patterns")
        .update({
          frequency: newFrequency,
          confidence: Math.max(similar.confidence || 0, newConfidence),
          source_job_ids: updatedJobIds,
          updated_at: new Date().toISOString(),
        })
        .eq("id", similar.id);
    } else {
      // New user-preferred language. Start with confidence 0.6 (higher than auto-detected).
      await supabase.from("learned_patterns").insert({
        pattern_type: "user_improved_language",
        category,
        description: `User-preferred language for ${category}`,
        example_text: originalRecommendation.substring(0, 500),
        recommended_language: userModifiedText.substring(0, 1000),
        frequency: 1,
        confidence: 0.6,
        source_job_ids: [jobId],
      });
    }
  } catch (error) {
    console.error("Error processing modified recommendation:", error);
  }
}
