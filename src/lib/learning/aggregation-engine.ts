import { createServerClient } from "@/lib/supabase";

interface AggregationSummary {
  patternsUpdated: number;
  newPatternsFound: number;
  patternsPruned: number;
  bestLanguageExtracted: number;
  regionalTrendsFound: number;
  totalActivePatterns: number;
}

/**
 * Nightly aggregation engine. Recalculates pattern confidence, discovers new
 * patterns, extracts best language from user modifications, identifies regional
 * trends, and prunes low performers.
 */
export async function runNightlyAggregation(): Promise<AggregationSummary> {
  const supabase = createServerClient();
  let patternsUpdated = 0;
  let newPatternsFound = 0;
  let patternsPruned = 0;
  let bestLanguageExtracted = 0;
  let regionalTrendsFound = 0;

  // ========================================================
  // STEP 1: RECALCULATE ACCEPTANCE RATES
  // ========================================================
  const { data: activePatterns } = await supabase
    .from("learned_patterns")
    .select("id, category, frequency")
    .eq("is_active", true);

  if (activePatterns) {
    for (const pattern of activePatterns) {
      const { data: feedback } = await supabase
        .from("redline_item_feedback")
        .select("action")
        .eq("category", pattern.category);

      if (feedback && feedback.length > 0) {
        const total = feedback.length;
        const accepted = feedback.filter(
          (f: { action: string }) => f.action === "accepted"
        ).length;
        const modified = feedback.filter(
          (f: { action: string }) => f.action === "modified"
        ).length;

        const acceptanceRate = (accepted + modified * 0.5) / total;
        const dataWeight = Math.min(total / 50, 1);
        const confidence = 0.5 * (1 - dataWeight) + acceptanceRate * dataWeight;

        await supabase
          .from("learned_patterns")
          .update({
            acceptance_rate: acceptanceRate,
            confidence,
            updated_at: new Date().toISOString(),
          })
          .eq("id", pattern.id);

        patternsUpdated++;
      }
    }
  }

  // ========================================================
  // STEP 2: DISCOVER NEW PATTERNS
  // ========================================================
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: recentJobs } = await supabase
    .from("redline_jobs")
    .select("id, output_json")
    .eq("status", "completed")
    .gt("created_at", oneDayAgo);

  if (recentJobs) {
    const issueGroups = new Map<
      string,
      { category: string; issue: string; count: number; jobIds: string[] }
    >();

    for (const job of recentJobs) {
      const output = job.output_json as {
        redlines?: { category: string; issue: string }[];
      } | null;
      if (!output?.redlines) continue;

      for (const item of output.redlines) {
        const key = `${item.category}:${item.issue.substring(0, 50)}`;
        const existing = issueGroups.get(key);
        if (existing) {
          existing.count++;
          existing.jobIds.push(job.id);
        } else {
          issueGroups.set(key, {
            category: item.category,
            issue: item.issue,
            count: 1,
            jobIds: [job.id],
          });
        }
      }
    }

    for (const group of Array.from(issueGroups.values())) {
      if (group.count < 3) continue;

      const searchKey = group.issue.substring(0, 50).replace(/[%_]/g, "");
      const { data: existing } = await supabase
        .from("learned_patterns")
        .select("id")
        .eq("pattern_type", "common_issue")
        .eq("category", group.category)
        .ilike("description", `%${searchKey}%`)
        .limit(1)
        .single();

      if (!existing) {
        await supabase.from("learned_patterns").insert({
          pattern_type: "common_issue",
          category: group.category,
          description: group.issue,
          frequency: group.count,
          confidence: 0.5,
          source_job_ids: group.jobIds.slice(-100),
        });
        newPatternsFound++;
      }
    }
  }

  // ========================================================
  // STEP 3: EXTRACT BEST LANGUAGE FROM USER MODIFICATIONS
  // ========================================================
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: modifications } = await supabase
    .from("redline_item_feedback")
    .select("category, modified_text, job_id")
    .eq("action", "modified")
    .not("modified_text", "is", null)
    .gt("created_at", sevenDaysAgo);

  if (modifications) {
    const modGroups = new Map<
      string,
      { category: string; text: string; count: number; jobIds: string[] }
    >();

    for (const mod of modifications) {
      if (!mod.modified_text) continue;
      const key = `${mod.category}:${mod.modified_text.substring(0, 80)}`;
      const existing = modGroups.get(key);
      if (existing) {
        existing.count++;
        existing.jobIds.push(mod.job_id);
      } else {
        modGroups.set(key, {
          category: mod.category || "general",
          text: mod.modified_text,
          count: 1,
          jobIds: [mod.job_id],
        });
      }
    }

    for (const group of Array.from(modGroups.values())) {
      if (group.count < 2) continue;

      const searchKey = group.text.substring(0, 80).replace(/[%_]/g, "");
      const { data: existing } = await supabase
        .from("learned_patterns")
        .select("id, frequency")
        .eq("pattern_type", "negotiation_language")
        .eq("category", group.category)
        .ilike("recommended_language", `%${searchKey}%`)
        .limit(1)
        .single();

      if (existing) {
        await supabase
          .from("learned_patterns")
          .update({
            frequency: (existing.frequency || 0) + group.count,
            confidence: 0.8,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("learned_patterns").insert({
          pattern_type: "negotiation_language",
          category: group.category,
          description: `User-validated language for ${group.category}`,
          recommended_language: group.text.substring(0, 1000),
          frequency: group.count,
          confidence: 0.8,
          source_job_ids: group.jobIds.slice(-100),
        });
      }
      bestLanguageExtracted++;
    }
  }

  // ========================================================
  // STEP 4: REGIONAL TRENDS
  // ========================================================
  const { data: patternsWithRegions } = await supabase
    .from("learned_patterns")
    .select("id, regions, property_types")
    .eq("is_active", true)
    .not("regions", "is", null);

  if (patternsWithRegions) {
    const regionCombos = new Map<string, number>();

    for (const p of patternsWithRegions) {
      const regions = p.regions as string[] | null;
      const propTypes = p.property_types as string[] | null;
      if (!regions) continue;

      for (const region of regions) {
        for (const propType of propTypes || ["general"]) {
          const key = `${region}:${propType}`;
          regionCombos.set(key, (regionCombos.get(key) || 0) + 1);
        }
      }
    }

    for (const [combo, count] of Array.from(regionCombos.entries())) {
      if (count < 5) continue;
      const [region, propType] = combo.split(":");

      const searchKey = `Regional trend: ${region} - ${propType}`;
      const { data: existing } = await supabase
        .from("learned_patterns")
        .select("id")
        .eq("pattern_type", "regional_trend")
        .ilike("description", `%${searchKey}%`)
        .limit(1)
        .single();

      if (!existing) {
        await supabase.from("learned_patterns").insert({
          pattern_type: "regional_trend",
          category: "regional",
          description: searchKey,
          frequency: count,
          confidence: 0.6,
          regions: [region],
          property_types: [propType],
        });
        regionalTrendsFound++;
      }
    }
  }

  // ========================================================
  // STEP 5: PRUNE LOW PERFORMERS
  // ========================================================
  const { data: pruned } = await supabase
    .from("learned_patterns")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("is_active", true)
    .gt("frequency", 20)
    .lt("acceptance_rate", 0.2)
    .select("id");

  patternsPruned = pruned?.length || 0;

  // ========================================================
  // STEP 6: LOG RESULTS
  // ========================================================
  const { count: totalActive } = await supabase
    .from("learned_patterns")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  const summary: AggregationSummary = {
    patternsUpdated,
    newPatternsFound,
    patternsPruned,
    bestLanguageExtracted,
    regionalTrendsFound,
    totalActivePatterns: totalActive || 0,
  };

  console.log("[aggregation] Nightly aggregation complete:", summary);

  return summary;
}
