import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim()).filter(Boolean);

    if (!session?.user?.email || !adminEmails.includes(session.user.email)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createServerClient();
    void request.url; // acknowledge request param

    // 1. Total patterns
    const { count: totalPatterns } = await supabase
      .from("learned_patterns")
      .select("id", { count: "exact", head: true });

    // 2. Active patterns (is_active AND confidence > 0.7)
    const { count: activePatterns } = await supabase
      .from("learned_patterns")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .gt("confidence", 0.7);

    // 3. Clause library size
    const { count: clauseLibrarySize } = await supabase
      .from("clause_library")
      .select("id", { count: "exact", head: true });

    // 4. Current prompt version
    const { data: activePrompt } = await supabase
      .from("prompt_versions")
      .select("id, version_number, total_uses, created_at")
      .eq("is_active", true)
      .single();

    // 5. Avg user rating (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentFeedback } = await supabase
      .from("job_feedback")
      .select("rating")
      .gt("created_at", thirtyDaysAgo)
      .not("rating", "is", null);

    let avgRating = 0;
    if (recentFeedback && recentFeedback.length > 0) {
      const sum = recentFeedback.reduce((acc: number, f: { rating: number | null }) => acc + (f.rating || 0), 0);
      avgRating = Math.round((sum / recentFeedback.length) * 10) / 10;
    }

    // 6. Active A/B tests
    const { data: activeTests } = await supabase
      .from("ab_test_results")
      .select("*")
      .is("ended_at", null);

    // 7. Top patterns by confidence (top 20)
    const { data: topPatterns } = await supabase
      .from("learned_patterns")
      .select("id, pattern_type, category, description, confidence, acceptance_rate, frequency, is_active, promoted_to_prompt, created_at")
      .eq("is_active", true)
      .order("confidence", { ascending: false })
      .limit(20);

    // 8. Patterns pending promotion
    const { data: pendingPatterns } = await supabase
      .from("learned_patterns")
      .select("id, pattern_type, category, description, confidence, acceptance_rate, frequency, created_at")
      .eq("is_active", true)
      .eq("promoted_to_prompt", false)
      .gt("confidence", 0.75)
      .gt("frequency", 10)
      .order("confidence", { ascending: false });

    // 9. Low performers (recently pruned)
    const { data: prunedPatterns } = await supabase
      .from("learned_patterns")
      .select("id, pattern_type, category, description, confidence, acceptance_rate, frequency, updated_at")
      .eq("is_active", false)
      .order("updated_at", { ascending: false })
      .limit(10);

    // 10. Recent user modifications (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentModifications } = await supabase
      .from("redline_item_feedback")
      .select("id, category, modified_text, job_id, created_at, redline_item_index")
      .eq("action", "modified")
      .not("modified_text", "is", null)
      .gt("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false })
      .limit(20);

    // For modifications, fetch original recommendations from job output
    const modificationsWithOriginal = [];
    if (recentModifications) {
      for (const mod of recentModifications) {
        let originalRecommendation = "";
        if (mod.job_id && mod.redline_item_index != null) {
          const { data: job } = await supabase
            .from("redline_jobs")
            .select("output_json")
            .eq("id", mod.job_id)
            .single();

          const output = job?.output_json as {
            redlines?: { recommendation?: string }[];
          } | null;
          originalRecommendation = output?.redlines?.[mod.redline_item_index]?.recommendation || "";
        }
        modificationsWithOriginal.push({
          id: mod.id,
          category: mod.category,
          originalRecommendation: originalRecommendation.substring(0, 200),
          modifiedText: (mod.modified_text || "").substring(0, 200),
          createdAt: mod.created_at,
        });
      }
    }

    // 11. Learning activity feed (recent events)
    const { data: recentPatterns } = await supabase
      .from("learned_patterns")
      .select("id, pattern_type, description, is_active, promoted_to_prompt, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(10);

    const { data: recentVersions } = await supabase
      .from("prompt_versions")
      .select("id, version_number, is_active, is_candidate, changelog, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: recentTests } = await supabase
      .from("ab_test_results")
      .select("id, test_name, winner, started_at, ended_at")
      .order("started_at", { ascending: false })
      .limit(5);

    // Build activity feed
    type ActivityItem = { type: string; description: string; timestamp: string };
    const activityFeed: ActivityItem[] = [];

    if (recentPatterns) {
      for (const p of recentPatterns) {
        if (p.promoted_to_prompt) {
          activityFeed.push({
            type: "pattern_promoted",
            description: `Pattern promoted: ${p.description.substring(0, 60)}`,
            timestamp: p.updated_at,
          });
        } else if (!p.is_active) {
          activityFeed.push({
            type: "pattern_pruned",
            description: `Pattern pruned: ${p.description.substring(0, 60)}`,
            timestamp: p.updated_at,
          });
        } else {
          activityFeed.push({
            type: "pattern_discovered",
            description: `New pattern: ${p.description.substring(0, 60)}`,
            timestamp: p.created_at,
          });
        }
      }
    }

    if (recentVersions) {
      for (const v of recentVersions) {
        activityFeed.push({
          type: v.is_active ? "version_promoted" : v.is_candidate ? "version_candidate" : "version_created",
          description: v.is_active
            ? `Prompt v${v.version_number} promoted as active`
            : v.is_candidate
              ? `Prompt v${v.version_number} created as candidate`
              : `Prompt v${v.version_number} created`,
          timestamp: v.created_at,
        });
      }
    }

    if (recentTests) {
      for (const t of recentTests) {
        if (t.ended_at) {
          activityFeed.push({
            type: "test_ended",
            description: `A/B test "${t.test_name}" ended. Winner: ${t.winner || "inconclusive"}`,
            timestamp: t.ended_at,
          });
        } else {
          activityFeed.push({
            type: "test_started",
            description: `A/B test "${t.test_name}" started`,
            timestamp: t.started_at,
          });
        }
      }
    }

    // Sort activity feed by timestamp desc
    activityFeed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalPatterns: totalPatterns || 0,
          activePatterns: activePatterns || 0,
          clauseLibrarySize: clauseLibrarySize || 0,
          currentPromptVersion: activePrompt?.version_number || 0,
          promptVersionUses: activePrompt?.total_uses || 0,
          avgRating,
          ratingCount: recentFeedback?.length || 0,
        },
        activeTests: activeTests || [],
        topPatterns: topPatterns || [],
        pendingPatterns: pendingPatterns || [],
        prunedPatterns: prunedPatterns || [],
        recentModifications: modificationsWithOriginal,
        activityFeed: activityFeed.slice(0, 20),
      },
    });
  } catch (error) {
    console.error("Admin learning API error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load learning data" },
      { status: 500 }
    );
  }
}
