/**
 * Lease Redline Chat Edge Function
 *
 * Conversational follow-up interface for the lease redline agent.
 * Features:
 * - Multi-turn conversation with full analysis context
 * - Reasoning loop: think → analyze → respond
 * - Financial model detection and parameter extraction
 * - Proactive suggestions based on conversation flow
 * - Memory-aware: references user preferences and past decisions
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ── CORS ────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://yneaxuokgfqyoomycjam.lovableproject.com",
  "https://thedealcalc.com",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8080",
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin =
    origin &&
    ALLOWED_ORIGINS.some((o) => origin.startsWith(o.replace(/\/$/, "")))
      ? origin
      : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

// ── System Prompt ───────────────────────────────────────────────────
function buildChatSystemPrompt(context: {
  documentType: string;
  outputMode: string;
  revisionsSummary: string;
  riskFlags: string[];
  definedTerms: string[];
  decisions: string[];
  userPreferences?: Record<string, unknown>;
}): string {
  const preferencesContext = context.userPreferences
    ? `\nUSER PREFERENCES:\n- Negotiation Style: ${context.userPreferences.negotiationStyle || "not set"}\n- Typical Cap Rate: ${context.userPreferences.typicalCapRate || "not set"}\n- Typical Escalation: ${context.userPreferences.typicalEscalation || "not set"}`
    : "";

  return `You are the Lease Redline Agent's conversational assistant. You have just completed a ${context.documentType} analysis in ${context.outputMode} mode.

You have access to the full analysis context below. Use it to answer the user's questions, provide deeper analysis, and suggest negotiation strategies.

ROLE: Landlord-representative commercial real estate advisor combining institutional asset management, legal expertise, and leasing strategy.

GOVERNING RULE — MAXIMUM IMPACT, MINIMUM REDLINING: When suggesting revisions or discussing clause changes, always advocate for the most surgical approach. Change only the minimum words necessary. Keep original language wherever it already serves the landlord. The most with the least.

ANALYSIS CONTEXT:
- Document Type: ${context.documentType}
- Output Mode: ${context.outputMode}
- Risk Flags: ${context.riskFlags.length > 0 ? context.riskFlags.join("; ") : "None"}
- Defined Terms: ${context.definedTerms.length > 0 ? context.definedTerms.join(", ") : "None identified"}
- User Decisions: ${context.decisions.filter(d => d !== "pending").length > 0 ? context.decisions.map((d, i) => d !== "pending" ? `Revision ${i+1}: ${d}` : null).filter(Boolean).join(", ") : "No decisions made yet"}
${preferencesContext}

REVISIONS SUMMARY:
${context.revisionsSummary}

INSTRUCTIONS:

1. REASONING: For every response, think through the problem step by step. Include your reasoning chain.

2. FINANCIAL MODELS: When the user asks about financial implications, or when you identify an opportunity to quantify impact, include a financialModel in your response with one of these types:
   - "rent_escalation": When discussing rent structure, escalations, option rent
   - "ti_amortization": When discussing TI allowance, early termination repayment
   - "noi_impact": When discussing any clause's impact on NOI or asset value
   - "effective_rent": When discussing overall deal economics, concessions
   - "co_tenancy_impact": When discussing co-tenancy provisions

   For financial models, extract numeric parameters from the document context or ask the user if not available.

3. SUGGESTIONS: Always provide 2-3 follow-up questions or actions the user might want to take next.

4. REFERENCES: When discussing a specific revision, include the clauseNumber in revisionRef.

5. PROACTIVE ANALYSIS: If the user hasn't reviewed critical items, suggest they review them. If you notice patterns in their accept/reject decisions, comment on the strategy.

You must respond with ONLY valid JSON:
{
  "message": "Your detailed response text",
  "reasoning": ["Step 1: reasoning...", "Step 2: reasoning...", "Step 3: conclusion..."],
  "financialModel": null or { "type": "model_type", "inputs": { ... } },
  "suggestions": ["Follow-up suggestion 1", "Follow-up suggestion 2", "Follow-up suggestion 3"],
  "revisionRef": null or clauseNumber
}`;
}

// ── JSON Extraction ─────────────────────────────────────────────────
function extractJSON(raw: string): unknown {
  try { return JSON.parse(raw); } catch { /* continue */ }

  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch { /* continue */ }
  }

  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try { return JSON.parse(raw.slice(firstBrace, lastBrace + 1)); } catch { /* continue */ }
  }

  return null;
}

// ── Request Handler ─────────────────────────────────────────────────
serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: "Service configuration error." }),
        { status: 500, headers: cors }
      );
    }

    const body = await req.json();
    const { message, context } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: cors }
      );
    }

    if (!context || !context.documentType) {
      return new Response(
        JSON.stringify({ error: "Analysis context is required" }),
        { status: 400, headers: cors }
      );
    }

    // Build conversation history for the API
    const messages: { role: string; content: string }[] = [];

    // Include prior conversation (last 20 messages max to stay within context)
    const history = Array.isArray(context.conversationHistory)
      ? context.conversationHistory.slice(-20)
      : [];

    for (const msg of history) {
      messages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.role === "assistant" && msg.reasoning
          ? JSON.stringify({
              message: msg.content,
              reasoning: msg.reasoning,
              financialModel: msg.financialModel || null,
              suggestions: msg.suggestions || [],
              revisionRef: msg.revisionRef || null,
            })
          : msg.content,
      });
    }

    // Add current user message
    messages.push({ role: "user", content: message.trim().slice(0, 4000) });

    const systemPrompt = buildChatSystemPrompt({
      documentType: context.documentType,
      outputMode: context.outputMode || "redline",
      revisionsSummary: context.revisionsSummary || "No revisions available",
      riskFlags: context.riskFlags || [],
      definedTerms: context.definedTerms || [],
      decisions: context.decisions || [],
      userPreferences: context.userPreferences || undefined,
    });

    console.log(`[lease-redline-chat] Processing message (${message.length} chars) with ${history.length} history messages`);

    const anthropicResponse = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          temperature: 0.2,
          system: systemPrompt,
          messages,
        }),
      }
    );

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error(`[lease-redline-chat] API error (${anthropicResponse.status}): ${errorText.slice(0, 200)}`);

      if (anthropicResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Service is temporarily busy. Please try again in a moment." }),
          { status: 429, headers: cors }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI processing failed. Please try again." }),
        { status: 502, headers: cors }
      );
    }

    const anthropicData = await anthropicResponse.json();
    const rawContent = anthropicData.content?.[0]?.text || "";

    if (!rawContent) {
      return new Response(
        JSON.stringify({ error: "AI returned an empty response." }),
        { status: 502, headers: cors }
      );
    }

    // Parse response
    const parsed = extractJSON(rawContent);

    let result;
    if (parsed && typeof parsed === "object" && "message" in (parsed as Record<string, unknown>)) {
      const p = parsed as Record<string, unknown>;
      result = {
        message: typeof p.message === "string" ? p.message : rawContent,
        reasoning: Array.isArray(p.reasoning) ? p.reasoning : [],
        financialModel: p.financialModel || null,
        suggestions: Array.isArray(p.suggestions) ? p.suggestions : [],
        revisionRef: typeof p.revisionRef === "number" ? p.revisionRef : null,
      };
    } else {
      // Fallback: treat entire response as message
      result = {
        message: rawContent,
        reasoning: [],
        financialModel: null,
        suggestions: [],
        revisionRef: null,
      };
    }

    console.log(
      `[lease-redline-chat] Response: ${result.message.length} chars, ${result.reasoning.length} reasoning steps, model: ${result.financialModel ? "yes" : "no"}`
    );

    return new Response(JSON.stringify(result), { headers: cors });
  } catch (error) {
    console.error("[lease-redline-chat] Error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500, headers: getCorsHeaders(null) }
    );
  }
});
