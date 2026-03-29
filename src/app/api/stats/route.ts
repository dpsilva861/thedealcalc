import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { createServerClient } from "@/lib/supabase";

// Cache stats for 5 minutes
let cachedStats: { data: Record<string, unknown>; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET() {
  try {
    // Return cached stats if still valid
    if (cachedStats && Date.now() - cachedStats.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({ success: true, data: cachedStats.data });
    }

    const supabase = createServerClient();

    // Get total completed redlines
    const { count: totalRedlines } = await supabase
      .from("redline_jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed");

    // Get total issues found across all jobs
    const { data: jobs } = await supabase
      .from("redline_jobs")
      .select("output_json")
      .eq("status", "completed")
      .not("output_json", "is", null);

    let totalIssuesFound = 0;
    let totalDealScore = 0;
    let scoredJobs = 0;

    if (jobs) {
      for (const job of jobs) {
        const output = job.output_json as { redlines?: unknown[]; summary?: { deal_score?: number } } | null;
        if (output?.redlines) {
          totalIssuesFound += output.redlines.length;
        }
        if (output?.summary?.deal_score) {
          totalDealScore += output.summary.deal_score;
          scoredJobs++;
        }
      }
    }

    const avgDealScore = scoredJobs > 0 ? Math.round((totalDealScore / scoredJobs) * 10) / 10 : 0;

    // Get total learned patterns
    const { count: totalPatterns } = await supabase
      .from("learned_patterns")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    const stats = {
      totalRedlines: totalRedlines || 0,
      totalIssuesFound,
      avgDealScore,
      totalPatterns: totalPatterns || 0,
    };

    // Cache the result
    cachedStats = { data: stats, timestamp: Date.now() };

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
