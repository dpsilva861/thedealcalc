import Anthropic from "@anthropic-ai/sdk";
import { BASE_SYSTEM_PROMPT } from "@/data/base-system-prompt";
import { createServerClient } from "@/lib/supabase";
import type {
  LearnedPattern,
  PromptVersion,
  RedlineResult,
} from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Build a dynamic system prompt by appending high-confidence learned patterns
 * to the base prompt.
 */
export function buildSystemPrompt(learnedPatterns: LearnedPattern[]): string {
  let prompt = BASE_SYSTEM_PROMPT;

  if (learnedPatterns.length > 0) {
    prompt += `\n\n## LEARNED PATTERNS (from analyzing real LOIs)\n`;
    prompt += `The following patterns have been identified from real-world LOI analysis `;
    prompt += `and validated by user feedback. Apply these when relevant:\n\n`;

    for (const pattern of learnedPatterns) {
      prompt += `### ${pattern.pattern_type}: ${pattern.description}\n`;
      prompt += `- Category: ${pattern.category}\n`;
      prompt += `- Confidence: ${(pattern.confidence * 100).toFixed(0)}%\n`;
      if (pattern.acceptance_rate != null) {
        prompt += `- Acceptance rate: ${(pattern.acceptance_rate * 100).toFixed(0)}%\n`;
      }
      if (pattern.recommended_language) {
        prompt += `- Recommended language: "${pattern.recommended_language}"\n`;
      }
      if (pattern.property_types?.length) {
        prompt += `- Applies to: ${pattern.property_types.join(", ")}\n`;
      }
      prompt += `\n`;
    }
  }

  return prompt;
}

/**
 * Fetch active learned patterns from the database.
 * Filters by confidence > 0.7, optionally by property type and deal type.
 */
export async function getActivePatterns(
  propertyType?: string,
  dealType?: string
): Promise<LearnedPattern[]> {
  const supabase = createServerClient();

  let query = supabase
    .from("learned_patterns")
    .select("*")
    .eq("is_active", true)
    .gt("confidence", 0.7)
    .order("confidence", { ascending: false })
    .limit(20);

  // Filter by property type if specified (patterns that apply to this type or have no type restriction)
  if (propertyType) {
    query = query.or(
      `property_types.cs.{${propertyType}},property_types.is.null`
    );
  }

  if (dealType) {
    query = query.or(`deal_types.cs.{${dealType}},deal_types.is.null`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching learned patterns:", error);
    return [];
  }

  return (data as LearnedPattern[]) || [];
}

/**
 * Get the active prompt version. If an A/B test is running,
 * randomly assigns the candidate version based on its allocation percentage.
 */
export async function getActivePromptVersion(): Promise<PromptVersion> {
  const supabase = createServerClient();

  // Check for active A/B test candidate
  const { data: candidate } = await supabase
    .from("prompt_versions")
    .select("*")
    .eq("is_candidate", true)
    .gt("ab_test_allocation", 0)
    .single();

  if (candidate && Math.random() < candidate.ab_test_allocation) {
    return candidate as PromptVersion;
  }

  // Return the active version
  const { data: active, error } = await supabase
    .from("prompt_versions")
    .select("*")
    .eq("is_active", true)
    .single();

  if (error || !active) {
    // Fallback: return a default prompt version
    return {
      id: "default",
      version_number: 0,
      prompt_text: BASE_SYSTEM_PROMPT,
      changelog: null,
      patterns_incorporated: null,
      avg_feedback_score: null,
      total_uses: 0,
      is_active: true,
      is_candidate: false,
      ab_test_allocation: 1.0,
      created_at: new Date().toISOString(),
    };
  }

  return active as PromptVersion;
}

/**
 * Main redline function. Analyzes an LOI and returns structured results.
 */
export async function redlineLOI(
  loiText: string,
  options: {
    perspective: "landlord" | "tenant";
    mode: "aggressive" | "standard" | "lenient";
    propertyType?: string;
    dealType?: string;
  }
): Promise<{ result: RedlineResult; promptVersionId: string; processingTimeMs: number; inputTokens: number; outputTokens: number }> {
  const startTime = Date.now();

  // 1. Fetch active learned patterns
  const learnedPatterns = await getActivePatterns(
    options.propertyType,
    options.dealType
  );

  // 2. Get active prompt version (with A/B test logic)
  const promptVersion = await getActivePromptVersion();

  // 3. Build dynamic system prompt
  const systemPrompt = buildSystemPrompt(learnedPatterns);

  // 4. Increment prompt version usage count
  const supabase = createServerClient();
  if (promptVersion.id !== "default") {
    await supabase
      .from("prompt_versions")
      .update({ total_uses: promptVersion.total_uses + 1 })
      .eq("id", promptVersion.id);
  }

  // 5. Build user message with context
  const modeInstruction =
    options.mode === "aggressive"
      ? "Use AGGRESSIVE redlining mode: flag everything, even minor deviations. Err on the side of over-flagging. Recommend the strongest possible protective language."
      : options.mode === "lenient"
        ? "Use LENIENT redlining mode: only flag critical and major issues. Accept provisions that are within a reasonable range of market standard."
        : "Use STANDARD redlining mode: flag critical, major, and notable minor issues. Balance thoroughness with practicality.";

  const userMessage = `Analyze this LOI from the ${options.perspective.toUpperCase()}'s perspective.
${modeInstruction}
${options.propertyType ? `Property type: ${options.propertyType}` : ""}
${options.dealType ? `Deal type: ${options.dealType}` : ""}

LOI TEXT:
${loiText}`;

  // 6. Call Claude API with retry logic
  let result: RedlineResult;
  let inputTokens = 0;
  let outputTokens = 0;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      });

      inputTokens = response.usage.input_tokens;
      outputTokens = response.usage.output_tokens;

      const textContent = response.content.find((c) => c.type === "text");
      if (!textContent || textContent.type !== "text") {
        throw new Error("No text content in Claude response");
      }

      // Parse JSON - strip any markdown code fences if present
      let jsonText = textContent.text.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }

      result = JSON.parse(jsonText);
      break;
    } catch (parseError) {
      if (attempt === 1) {
        // Second attempt failed - return structured error
        throw new Error(
          `Failed to parse Claude response after 2 attempts: ${parseError instanceof Error ? parseError.message : "Unknown error"}`
        );
      }
      // First attempt failed, retry
      console.warn("First Claude parse attempt failed, retrying...", parseError);
    }
  }

  const processingTimeMs = Date.now() - startTime;

  return {
    result: result!,
    promptVersionId: promptVersion.id,
    processingTimeMs,
    inputTokens,
    outputTokens,
  };
}
