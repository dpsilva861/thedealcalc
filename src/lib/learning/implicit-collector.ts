import { createServerClient } from "@/lib/supabase";
import type { RedlineResult } from "@/types";

/**
 * Collect implicit learning signals from every processed LOI.
 * This runs automatically after each redline analysis completes.
 * Data is stored in learned_patterns and clause_library for the
 * nightly aggregation engine to process.
 */
export async function collectImplicitSignals(
  jobId: string,
  result: RedlineResult
): Promise<void> {
  const supabase = createServerClient();

  // 1. Extract clause variants into clause_library
  for (const redline of result.redlines) {
    const qualityAssessment =
      redline.severity === "critical"
        ? "dangerous"
        : redline.severity === "major"
          ? "weak"
          : redline.severity === "minor"
            ? "acceptable"
            : "strong";

    // Insert clause variant into library
    await supabase.from("clause_library").insert({
      clause_type: redline.category,
      original_language: redline.original_text.substring(0, 1000),
      quality_assessment: qualityAssessment,
      recommended_alternative: redline.suggested_language.substring(0, 1000),
      perspective: "neutral",
      source_job_ids: [jobId],
    });
  }

  // 2. Track issue frequency as learned patterns
  for (const redline of result.redlines) {
    // Check if a similar pattern already exists
    const { data: existing } = await supabase
      .from("learned_patterns")
      .select("id, frequency, source_job_ids")
      .eq("pattern_type", "common_issue")
      .eq("category", redline.category)
      .ilike("description", `%${redline.issue.substring(0, 50)}%`)
      .limit(1)
      .single();

    if (existing) {
      // Increment frequency
      const updatedJobIds = [...(existing.source_job_ids || []), jobId];
      await supabase
        .from("learned_patterns")
        .update({
          frequency: (existing.frequency || 0) + 1,
          source_job_ids: updatedJobIds.slice(-100), // Keep last 100 job IDs
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      // Create new pattern
      await supabase.from("learned_patterns").insert({
        pattern_type: "common_issue",
        category: redline.category,
        description: redline.issue,
        example_text: redline.original_text.substring(0, 500),
        recommended_action: redline.recommendation,
        recommended_language: redline.suggested_language.substring(0, 500),
        frequency: 1,
        confidence: 0.5,
        property_types: result.summary.property_type ? [result.summary.property_type] : null,
        deal_types: result.summary.deal_type ? [result.summary.deal_type] : null,
        source_job_ids: [jobId],
      });
    }
  }

  // 3. Track missing provisions
  for (const missing of result.missing_provisions) {
    const { data: existing } = await supabase
      .from("learned_patterns")
      .select("id, frequency")
      .eq("pattern_type", "missing_provision")
      .ilike("description", `%${missing.provision}%`)
      .limit(1)
      .single();

    if (existing) {
      await supabase
        .from("learned_patterns")
        .update({
          frequency: (existing.frequency || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("learned_patterns").insert({
        pattern_type: "missing_provision",
        category: missing.provision,
        description: `${missing.provision} missing from ${result.summary.property_type || "unknown"} ${result.summary.deal_type || "LOI"}`,
        recommended_language: missing.suggested_language.substring(0, 500),
        frequency: 1,
        confidence: 0.5,
        property_types: result.summary.property_type ? [result.summary.property_type] : null,
        deal_types: result.summary.deal_type ? [result.summary.deal_type] : null,
        source_job_ids: [jobId],
      });
    }
  }

  // 4. Store learning signals from Claude
  if (result.learning_signals) {
    for (const variant of result.learning_signals.new_clause_variants || []) {
      await supabase.from("learned_patterns").insert({
        pattern_type: "clause_variant",
        category: "general",
        description: variant,
        frequency: 1,
        confidence: 0.5,
        source_job_ids: [jobId],
      });
    }

    for (const unusual of result.learning_signals.unusual_provisions || []) {
      await supabase.from("learned_patterns").insert({
        pattern_type: "unusual_provision",
        category: "general",
        description: unusual,
        frequency: 1,
        confidence: 0.5,
        source_job_ids: [jobId],
      });
    }

    for (const observation of result.learning_signals.market_observations || []) {
      await supabase.from("learned_patterns").insert({
        pattern_type: "market_observation",
        category: "general",
        description: observation,
        frequency: 1,
        confidence: 0.5,
        source_job_ids: [jobId],
      });
    }
  }
}
