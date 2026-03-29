import { createServerClient } from "@/lib/supabase";
import { buildSystemPrompt } from "@/lib/redline-engine";
import type { LearnedPattern } from "@/types";

interface EvolutionResult {
  action:
    | "new_candidate_created"
    | "candidate_promoted"
    | "candidate_killed"
    | "test_continuing"
    | "no_action";
  details: string;
  newVersionId?: string;
  patternsPromoted?: number;
}

/**
 * Weekly prompt evolution engine. Finds high-confidence patterns, creates
 * candidate prompt versions, manages A/B tests, and promotes winners.
 */
export async function runWeeklyPromptEvolution(): Promise<EvolutionResult> {
  const supabase = createServerClient();

  // ========================================================
  // STEP 5 (CHECK FIRST): Evaluate existing A/B tests
  // ========================================================
  const { data: activeTests } = await supabase
    .from("ab_test_results")
    .select("*")
    .is("ended_at", null);

  if (activeTests && activeTests.length > 0) {
    for (const test of activeTests) {
      if ((test.candidate_jobs || 0) < 50) {
        return {
          action: "test_continuing",
          details: `A/B test "${test.test_name}" has ${test.candidate_jobs}/50 candidate jobs. Continuing.`,
        };
      }

      const controlAvg = test.control_avg_rating || 0;
      const candidateAvg = test.candidate_avg_rating || 0;

      if (candidateAvg > controlAvg + 0.2) {
        // PROMOTE candidate
        const { data: candidateVersion } = await supabase
          .from("prompt_versions")
          .select("id, patterns_incorporated")
          .eq("id", test.candidate_version_id)
          .single();

        if (candidateVersion) {
          await supabase
            .from("prompt_versions")
            .update({ is_active: false, is_candidate: false, ab_test_allocation: 0 })
            .neq("id", candidateVersion.id);

          await supabase
            .from("prompt_versions")
            .update({
              is_active: true,
              is_candidate: false,
              ab_test_allocation: 1.0,
            })
            .eq("id", candidateVersion.id);

          const patternIds = (candidateVersion.patterns_incorporated || []) as string[];
          if (patternIds.length > 0) {
            await supabase
              .from("learned_patterns")
              .update({
                promoted_to_prompt: true,
                promoted_at: new Date().toISOString(),
              })
              .in("id", patternIds);
          }

          await supabase
            .from("ab_test_results")
            .update({
              ended_at: new Date().toISOString(),
              winner: "candidate",
              auto_promoted: true,
              candidate_avg_rating: candidateAvg,
              control_avg_rating: controlAvg,
            })
            .eq("id", test.id);

          return {
            action: "candidate_promoted",
            details: `Candidate outperformed control (${candidateAvg.toFixed(2)} vs ${controlAvg.toFixed(2)}). Promoted as new active version.`,
            newVersionId: candidateVersion.id,
            patternsPromoted: patternIds.length,
          };
        }
      } else if (candidateAvg < controlAvg - 0.1) {
        // KILL candidate
        await supabase
          .from("prompt_versions")
          .update({ is_candidate: false, ab_test_allocation: 0 })
          .eq("id", test.candidate_version_id);

        await supabase
          .from("ab_test_results")
          .update({
            ended_at: new Date().toISOString(),
            winner: "control",
            auto_promoted: false,
            candidate_avg_rating: candidateAvg,
            control_avg_rating: controlAvg,
          })
          .eq("id", test.id);

        return {
          action: "candidate_killed",
          details: `Candidate underperformed control (${candidateAvg.toFixed(2)} vs ${controlAvg.toFixed(2)}). Killed candidate.`,
        };
      } else {
        return {
          action: "test_continuing",
          details: `A/B test inconclusive (candidate: ${candidateAvg.toFixed(2)}, control: ${controlAvg.toFixed(2)}). Continuing.`,
        };
      }
    }
  }

  // ========================================================
  // STEP 1: Find patterns ready for promotion
  // ========================================================
  const { data: readyPatterns } = await supabase
    .from("learned_patterns")
    .select("*")
    .eq("is_active", true)
    .eq("promoted_to_prompt", false)
    .gt("confidence", 0.75)
    .gt("frequency", 10)
    .order("confidence", { ascending: false })
    .limit(10);

  if (!readyPatterns || readyPatterns.length === 0) {
    return {
      action: "no_action",
      details: "No patterns ready for promotion (need confidence > 0.75, frequency > 10).",
    };
  }

  // ========================================================
  // STEP 2: Build candidate prompt with new patterns
  // ========================================================
  const candidatePrompt = buildSystemPrompt(readyPatterns as LearnedPattern[]);

  // ========================================================
  // STEP 3: Create new candidate prompt version
  // ========================================================
  const { data: currentActive } = await supabase
    .from("prompt_versions")
    .select("id, version_number")
    .eq("is_active", true)
    .single();

  const newVersionNumber = (currentActive?.version_number || 0) + 1;

  const { data: newVersion, error: insertError } = await supabase
    .from("prompt_versions")
    .insert({
      version_number: newVersionNumber,
      prompt_text: candidatePrompt,
      changelog: `Auto-generated candidate with ${readyPatterns.length} new patterns: ${readyPatterns.map((p) => p.description.substring(0, 40)).join("; ")}`,
      patterns_incorporated: readyPatterns.map((p) => p.id),
      is_active: false,
      is_candidate: true,
      ab_test_allocation: 0.2,
    })
    .select()
    .single();

  if (insertError || !newVersion) {
    console.error("Error creating candidate version:", insertError);
    return {
      action: "no_action",
      details: `Failed to create candidate version: ${insertError?.message}`,
    };
  }

  // ========================================================
  // STEP 4: Create A/B test record
  // ========================================================
  await supabase.from("ab_test_results").insert({
    test_name: `v${currentActive?.version_number || 1}_vs_v${newVersionNumber}`,
    control_version_id: currentActive?.id || null,
    candidate_version_id: newVersion.id,
    control_jobs: 0,
    candidate_jobs: 0,
  });

  console.log(
    `[evolution] Created candidate v${newVersionNumber} with ${readyPatterns.length} patterns. A/B test started (20% allocation).`
  );

  return {
    action: "new_candidate_created",
    details: `Created candidate v${newVersionNumber} with ${readyPatterns.length} patterns. A/B test started with 20% allocation.`,
    newVersionId: newVersion.id,
    patternsPromoted: readyPatterns.length,
  };
}
