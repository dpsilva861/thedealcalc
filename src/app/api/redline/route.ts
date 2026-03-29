export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { redlineLOI } from "@/lib/redline-engine";
import { generateRedlinedDocx, generatePdfSummary } from "@/lib/output-generator";
import { verifyPayment } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase";
import { collectImplicitSignals } from "@/lib/learning/implicit-collector";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, perspective, mode, propertyType, dealType, sessionId, filename } = body;

    // Validate required fields
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { success: false, error: "LOI text is required" },
        { status: 400 }
      );
    }

    if (!perspective || !["landlord", "tenant"].includes(perspective)) {
      return NextResponse.json(
        { success: false, error: "Perspective must be 'landlord' or 'tenant'" },
        { status: 400 }
      );
    }

    if (!mode || !["aggressive", "standard", "lenient"].includes(mode)) {
      return NextResponse.json(
        { success: false, error: "Mode must be 'aggressive', 'standard', or 'lenient'" },
        { status: 400 }
      );
    }

    // Verify Stripe payment
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Payment session ID is required" },
        { status: 400 }
      );
    }

    const payment = await verifyPayment(sessionId);
    if (!payment.paid) {
      return NextResponse.json(
        { success: false, error: "Payment has not been completed" },
        { status: 402 }
      );
    }

    const supabase = createServerClient();

    // Create job record
    const { data: job, error: jobError } = await supabase
      .from("redline_jobs")
      .insert({
        user_id: payment.userId,
        status: "processing",
        input_filename: filename || "uploaded-loi",
        input_text: text,
        input_token_count: Math.ceil(text.length / 4), // rough estimate
        property_type: propertyType || null,
        deal_type: dealType || null,
        redline_mode: mode,
        perspective,
        stripe_payment_id: sessionId,
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error("Error creating job:", jobError);
      return NextResponse.json(
        { success: false, error: "Failed to create redline job" },
        { status: 500 }
      );
    }

    try {
      // Run the redline analysis
      const { result, promptVersionId, processingTimeMs, inputTokens, outputTokens } =
        await redlineLOI(text, {
          perspective,
          mode,
          propertyType,
          dealType,
        });

      // Generate output files
      const [docxBuffer, pdfBuffer] = await Promise.all([
        generateRedlinedDocx(result, text),
        generatePdfSummary(result),
      ]);

      // Store DOCX and PDF in Supabase storage (encode as base64 data URLs for MVP)
      const docxBase64 = docxBuffer.toString("base64");
      const pdfBase64 = pdfBuffer.toString("base64");

      // Calculate API cost (approximate: Sonnet input ~$3/M, output ~$15/M)
      const apiCostCents = Math.ceil(
        (inputTokens * 3 + outputTokens * 15) / 10000
      );

      // Update job with results
      await supabase
        .from("redline_jobs")
        .update({
          status: "completed",
          output_json: result,
          output_docx_url: `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${docxBase64}`,
          output_pdf_url: `data:text/html;base64,${pdfBase64}`,
          processing_time_ms: processingTimeMs,
          api_cost_cents: apiCostCents,
          prompt_version_id: promptVersionId !== "default" ? promptVersionId : null,
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      // Update user stats
      if (payment.userId) {
        const { data: currentUser } = await supabase
          .from("users")
          .select("total_redlines")
          .eq("id", payment.userId)
          .single();

        if (currentUser) {
          await supabase
            .from("users")
            .update({ total_redlines: (currentUser.total_redlines || 0) + 1 })
            .eq("id", payment.userId);
        }
      }

      // Collect implicit learning signals (non-blocking)
      collectImplicitSignals(job.id, result).catch((err) =>
        console.error("Error collecting implicit signals:", err)
      );

      return NextResponse.json({
        success: true,
        data: {
          jobId: job.id,
          result,
          docxUrl: `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${docxBase64}`,
          pdfUrl: `data:text/html;base64,${pdfBase64}`,
          processingTimeMs,
        },
      });
    } catch (analysisError) {
      // Update job as failed
      await supabase
        .from("redline_jobs")
        .update({ status: "failed" })
        .eq("id", job.id);

      throw analysisError;
    }
  } catch (error) {
    console.error("Redline API error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Redline analysis failed" },
      { status: 500 }
    );
  }
}
