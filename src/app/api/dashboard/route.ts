import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Get user record
    const { data: user } = await supabase
      .from("users")
      .select("id, name, email, total_redlines")
      .eq("email", session.user.email)
      .single();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Parse query params for pagination and filters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = 10;
    const offset = (page - 1) * limit;
    const propertyType = url.searchParams.get("propertyType") || null;
    const dealType = url.searchParams.get("dealType") || null;

    // Build jobs query
    let jobsQuery = supabase
      .from("redline_jobs")
      .select("id, status, input_filename, property_type, deal_type, redline_mode, perspective, output_json, output_docx_url, output_pdf_url, processing_time_ms, created_at, completed_at", { count: "exact" })
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (propertyType) {
      jobsQuery = jobsQuery.eq("property_type", propertyType);
    }
    if (dealType) {
      jobsQuery = jobsQuery.eq("deal_type", dealType);
    }

    const { data: jobs, count: totalJobs } = await jobsQuery
      .range(offset, offset + limit - 1);

    // Calculate stats from all completed jobs (not just current page)
    let statsQuery = supabase
      .from("redline_jobs")
      .select("output_json")
      .eq("user_id", user.id)
      .eq("status", "completed");

    const { data: allJobs } = await statsQuery;

    let totalDealScore = 0;
    let dealScoreCount = 0;
    const categoryCounts: Record<string, number> = {};

    if (allJobs) {
      for (const job of allJobs) {
        const output = job.output_json as {
          summary?: { deal_score?: number };
          redlines?: { category?: string }[];
        } | null;

        if (output?.summary?.deal_score) {
          totalDealScore += output.summary.deal_score;
          dealScoreCount++;
        }

        if (output?.redlines) {
          for (const item of output.redlines) {
            if (item.category) {
              categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
            }
          }
        }
      }
    }

    const avgDealScore = dealScoreCount > 0 ? totalDealScore / dealScoreCount : 0;
    let mostCommonCategory = "N/A";
    let maxCount = 0;
    for (const [cat, count] of Object.entries(categoryCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonCategory = cat;
      }
    }

    // Strip large fields from jobs for the list view
    const jobsList = (jobs || []).map((job) => {
      const output = job.output_json as {
        summary?: { deal_score?: number; risk_level?: string };
      } | null;

      return {
        id: job.id,
        status: job.status,
        input_filename: job.input_filename,
        property_type: job.property_type,
        deal_type: job.deal_type,
        redline_mode: job.redline_mode,
        perspective: job.perspective,
        deal_score: output?.summary?.deal_score || null,
        risk_level: output?.summary?.risk_level || null,
        has_docx: !!job.output_docx_url,
        has_pdf: !!job.output_pdf_url,
        processing_time_ms: job.processing_time_ms,
        created_at: job.created_at,
        completed_at: job.completed_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        user: { name: user.name, email: user.email },
        stats: {
          totalRedlines: user.total_redlines || allJobs?.length || 0,
          avgDealScore: Math.round(avgDealScore * 10) / 10,
          mostCommonCategory,
        },
        jobs: jobsList,
        pagination: {
          page,
          limit,
          total: totalJobs || 0,
          totalPages: Math.ceil((totalJobs || 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
