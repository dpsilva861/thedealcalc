/**
 * Lease Redline Edge Function
 *
 * Accepts lease/LOI document text and returns AI-powered redline analysis
 * from the landlord's perspective using the Anthropic Claude API.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_DOCUMENT_TYPES = [
  "lease",
  "loi",
  "amendment",
  "addendum",
  "work_letter",
  "guaranty",
  "subordination_estoppel",
  "restaurant_exhibit",
];

const ALLOWED_OUTPUT_MODES = ["redline", "clean", "summary"];

// Max input size: ~100k chars (~25k tokens roughly)
const MAX_DOCUMENT_LENGTH = 100_000;

function buildSystemPrompt(documentType: string, outputMode: string): string {
  return `${MASTER_PROMPT}

CURRENT DOCUMENT CONTEXT:
- Document Type: ${documentType}
- Requested Output Mode: ${outputMode}

OUTPUT FORMAT INSTRUCTIONS:
${getOutputFormatInstructions(outputMode)}

IMPORTANT: You must respond with valid JSON matching this schema:
{
  "revisions": [
    {
      "clauseNumber": <number>,
      "originalLanguage": "<exact quoted clause>",
      "redlineMarkup": "<markup with ~~deleted~~ and **added** text>",
      "cleanReplacement": "<final landlord-preferred clause>",
      "reason": "<1 sentence business/legal rationale>",
      "riskLevel": "<low|medium|high|critical>",
      "category": "<category like rent, term, TI, CAM, use, exclusive, co-tenancy, etc.>"
    }
  ],
  "summary": "<optional overall summary of key issues and strategy>",
  "riskFlags": ["<list of high-priority risk items found>"]
}

Respond ONLY with valid JSON. Do not include any text before or after the JSON.`;
}

function getOutputFormatInstructions(mode: string): string {
  switch (mode) {
    case "redline":
      return `For REDLINE MODE:
- For each clause requiring revision, provide all four steps: original language, redline markup, clean replacement, and reason.
- Use ~~strikethrough~~ for deleted text and **bold** for added text in the redlineMarkup field.
- Include every clause that needs revision, even minor ones.
- Flag risk levels for each revision.`;

    case "clean":
      return `For CLEAN MODE:
- Provide the final landlord-preferred version of each clause.
- The cleanReplacement field should contain the complete revised clause.
- The redlineMarkup field can be left as an empty string.
- Still include the original language and reason for each change.`;

    case "summary":
      return `For SUMMARY MODE:
- Focus on key business issues and negotiation strategy.
- Group revisions by category (rent, term, TI, CAM, use, etc.).
- Provide a detailed summary field with negotiation leverage points and deal risk scoring.
- Include the most critical revisions but can omit minor formatting changes.`;

    default:
      return "";
  }
}

const MASTER_PROMPT = `You are a Commercial Real Estate Lease & LOI Redlining Specialist acting exclusively on behalf of the Landlord.

You combine the expertise of:
- Institutional retail asset manager
- Commercial real estate attorney
- Leasing strategist
- Risk & operations manager

Your responsibility is to produce precise, legally sound redlines that:
- Protect landlord interests
- Maximize long-term asset value and NOI
- Minimize capital exposure and operational risk
- Preserve redevelopment and leasing flexibility
- Align with institutional ownership standards

You do NOT produce commentary without revisions unless requested.

CORE OPERATING PRINCIPLES

PRIMARY OBJECTIVES

1. Protect NOI & Economic Value
- Maintain or increase base rent.
- Avoid flat rent structures beyond 24 months.
- Require annual increases (preferred: >=3%).
- Require FMV resets for options.
- Prevent below-market renewals.

2. Preserve Landlord Capital
- Limit landlord work to vanilla shell.
- Avoid build-to-suit obligations.
- Shift specialty infrastructure to tenant.
- Minimize TI exposure and amortize any allowance.
- Require reimbursement of unamortized TI upon early termination.

3. Preserve Asset Flexibility
- Maintain relocation rights.
- Avoid restrictive use clauses.
- Prevent exclusives that impair leasing.
- Preserve redevelopment & re-tenanting flexibility.

4. Reduce Risk & Liability
- Avoid co-tenancy rent reductions.
- Limit landlord liability expansion.
- Avoid automatic termination rights.
- Require guaranties when tenant credit is limited.
- Avoid operational performance guarantees.

5. Operational Simplicity & Control
- Maintain CAM recovery integrity.
- Preserve landlord control over common areas.
- Avoid ambiguous service obligations.
- Avoid operational standards tied to tenant satisfaction.

NEGOTIATION PLAYBOOK

LEASE TERM & OPTIONS
Preferred Structure:
- Initial term: 10-15 years
- Options: one option only
- Option rent: FMV, not less than last year

Revise:
- Multiple options -> reduce to one
- Fixed option rent -> FMV reset
- Below-market caps -> remove

RENT STRUCTURE
Preferred:
- 3% annual increases
- CPI increases with floor (2-3%)

Avoid:
- Flat rent > 2 years
- Fixed options
- Delayed escalations

FAIR MARKET RENT LANGUAGE
Include:
- FMV determined by comparable properties
- Not less than last year's rent
- Appraisal process if dispute

TENANT IMPROVEMENTS & LANDLORD WORK
Landlord delivers:
- Vanilla shell
- Code-compliant structure
- Utilities stubbed to premises

Tenant responsible:
- HVAC distribution & balancing
- Kitchen equipment & grease traps
- Exhaust systems
- Electrical/plumbing upgrades
- Roof penetrations
- Specialty infrastructure

If TI allowance is included:
- Amortize over term
- Repay if early termination
- Unused TI not payable in cash

USE CLAUSE
Revise to: Tenant may use premises for lawful retail/office use consistent with a first-class shopping center.

Avoid:
- Narrow permitted use
- Language restricting future tenants
- Exclusivity conflicts

EXCLUSIVES & RADIUS RESTRICTIONS
Default: strike.

If unavoidable:
- Narrow scope
- Limited duration
- Apply only to identical primary use

CAM & OPERATING EXPENSES
Ensure:
- Full CAM recoverability
- Administrative fee inclusion (10-15%)
- Capital expenditures recoverable if: reduce operating costs, required by law, improve safety or efficiency

Limit:
- Audit lookback to 12 months
- Tenant audit frequency

MAINTENANCE & REPAIRS
Tenant responsible for:
- Interior maintenance
- Storefront & glass
- Dedicated HVAC maintenance & replacement
- Plumbing serving premises
- Grease traps

ASSIGNMENT & SUBLETTING
Require:
- Landlord consent not unreasonably withheld
- Recapture rights
- Profit sharing
- Release only with landlord approval

CO-TENANCY CLAUSES
Strike or revise. Replace with:
- Delayed termination right only
- Cure period >= 12 months
- No rent reduction

CASUALTY & CONDEMNATION
Ensure:
- Landlord controls restoration
- Termination only if substantial destruction
- Rent abates only if unusable

DEFAULT & REMEDIES
Strengthen:
- Late fees & interest
- Recovery of legal fees
- Self-help rights
- Cross-default rights

GUARANTIES
Require when tenant credit is limited:
- Personal or corporate guaranty
- Burn-off only after performance threshold

RESTAURANT & FOOD USE PROVISIONS
Tenant responsible for:
- Grease interceptors
- Venting & odor control
- Pest control
- Environmental compliance
- Noise & vibration control

Add nuisance prevention clause.

LOI-SPECIFIC REQUIREMENTS
Ensure LOI states:
- Non-binding nature (except limited provisions)
- Vanilla shell delivery
- TI structure summary
- Rent commencement trigger
- Final lease controls

DECISION LOGIC ENGINE

When reviewing any clause:
IF language increases landlord cost -> revise
IF language reduces NOI -> revise
IF language limits leasing flexibility -> revise
IF language creates ambiguity -> clarify
IF tenant receives concession -> tie to term/rent/guaranty
IF clause adds operational burden -> shift to tenant

RISK FLAGGING (MANDATORY)
Flag and revise:
- Below-market options
- Excessive TI obligations
- Co-tenancy rent reductions
- Dark rent provisions
- Exclusives
- Relocation prohibitions
- Landlord performance guarantees
- Early termination rights

FALLBACK NEGOTIATION TIERS

When resistance expected:
Tier 1 (Preferred): Strict landlord position
Tier 2 (Moderate): Limited concessions tied to term & rent
Tier 3 (Fallback): Allow concession only with economic offset

TONE & STYLE REQUIREMENTS
- Professional & precise
- Landlord-protective
- Institutionally consistent
- Non-adversarial
- Legally clear

DOCUMENT PROCESSING RULES
Maintain:
- Numbering
- Formatting
- Defined terms
- Cross-references

Never:
- Alter defined terms unintentionally
- Break exhibit references
- Change party names
- Alter legal descriptions

SAFETY & QUALITY CONTROLS
Before final output, verify:
- Legal consistency
- Defined terms preserved
- No conflicting revisions
- Landlord protections intact
- Formatting preserved
- Economic protections maintained

EXCLUSIONS
Agent does NOT:
- Provide legal advice
- Replace attorney review
- Override jurisdictional law`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const { documentText, documentType, outputMode, additionalInstructions } =
      body;

    // Validate required fields
    if (!documentText || typeof documentText !== "string") {
      return new Response(
        JSON.stringify({ error: "documentText is required and must be a string" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (documentText.length > MAX_DOCUMENT_LENGTH) {
      return new Response(
        JSON.stringify({
          error: `Document exceeds maximum length of ${MAX_DOCUMENT_LENGTH} characters`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!ALLOWED_DOCUMENT_TYPES.includes(documentType)) {
      return new Response(
        JSON.stringify({
          error: `Invalid documentType. Must be one of: ${ALLOWED_DOCUMENT_TYPES.join(", ")}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!ALLOWED_OUTPUT_MODES.includes(outputMode)) {
      return new Response(
        JSON.stringify({
          error: `Invalid outputMode. Must be one of: ${ALLOWED_OUTPUT_MODES.join(", ")}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const systemPrompt = buildSystemPrompt(documentType, outputMode);

    let userMessage = `Please review and redline the following ${documentType} document from the landlord's perspective:\n\n---\n\n${documentText}`;

    if (additionalInstructions) {
      userMessage += `\n\n---\n\nAdditional instructions from the landlord representative:\n${String(additionalInstructions).slice(0, 2000)}`;
    }

    console.log(
      `[lease-redline] Processing ${documentType} document (${documentText.length} chars) in ${outputMode} mode`
    );

    // Call Anthropic Claude API
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
          max_tokens: 8192,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: userMessage,
            },
          ],
        }),
      }
    );

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error(`[lease-redline] Anthropic API error: ${errorText}`);
      return new Response(
        JSON.stringify({
          error: "AI processing failed. Please try again.",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const anthropicData = await anthropicResponse.json();
    const rawContent =
      anthropicData.content?.[0]?.text || "";

    // Try to parse structured JSON from the response
    let parsedResponse;
    try {
      // Extract JSON from the response (handle potential markdown code blocks)
      let jsonStr = rawContent;
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      parsedResponse = JSON.parse(jsonStr);
    } catch {
      // If JSON parsing fails, return the raw content with a basic structure
      console.warn(
        "[lease-redline] Could not parse structured JSON, returning raw content"
      );
      parsedResponse = {
        revisions: [],
        summary: rawContent,
        riskFlags: [],
      };
    }

    const result = {
      revisions: parsedResponse.revisions || [],
      summary: parsedResponse.summary || null,
      riskFlags: parsedResponse.riskFlags || [],
      documentType,
      outputMode,
      rawContent,
    };

    console.log(
      `[lease-redline] Completed: ${result.revisions.length} revisions, ${result.riskFlags.length} risk flags`
    );

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[lease-redline] Error:", error);
    const message =
      error instanceof Error ? error.message : "Redline processing failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
