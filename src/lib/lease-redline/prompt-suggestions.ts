/**
 * Prompt Suggestion Engine — scans uploaded document text for patterns
 * and generates contextual prompts to help the user specify focus areas.
 *
 * When a user uploads or pastes a lease/LOI/etc., this analyzes the content
 * and suggests targeted instructions like "Focus on TI exposure" or
 * "Flag co-tenancy risks" based on what the document actually contains.
 */

import type { DocumentType } from "./types";

export interface PromptSuggestion {
  id: string;
  label: string;
  instruction: string;
  /** Why this was suggested — shown as a tooltip */
  reason: string;
  /** Category for grouping */
  category: "risk" | "financial" | "operations" | "legal" | "strategy";
  /** Source: "detected" from document scanning, "base" from document type, "learned" from user behavior */
  source?: "detected" | "base" | "learned";
  /** Usage count from learning data */
  usageCount?: number;
  /** Success score from learning data (0-1) */
  successScore?: number;
}

/** Learning context passed into suggestion generation for ranking */
export interface SuggestionLearningContext {
  /** Get success score for a built-in suggestion id */
  getSuccessScore: (id: string) => number;
  /** Get usage count for a built-in suggestion id */
  getUsageCount: (id: string) => number;
  /** Learned suggestions from custom instruction mining */
  learnedSuggestions: {
    id: string;
    label: string;
    instruction: string;
    category: PromptSuggestion["category"];
    usageCount: number;
    successScore: number;
  }[];
}

interface PatternRule {
  /** Regex patterns to match (case-insensitive) */
  patterns: RegExp[];
  /** Minimum number of pattern matches required to trigger this suggestion */
  minMatches?: number;
  /** The suggestion to generate */
  suggestion: Omit<PromptSuggestion, "id">;
  /** Only suggest for these document types (empty = all) */
  documentTypes?: DocumentType[];
}

const PATTERN_RULES: PatternRule[] = [
  // ── Rent & Financial ──
  {
    patterns: [/\bcam\b/i, /common\s+area\s+maint/i, /operating\s+expense/i, /expense\s+stop/i],
    suggestion: {
      label: "CAM exposure",
      instruction: "Pay close attention to CAM/operating expense provisions. Flag any uncapped CAM, gross-up provisions, capital expense pass-throughs, and management fee percentages. Propose a 5% annual CAM cap.",
      reason: "Document contains CAM/operating expense language",
      category: "financial",
    },
  },
  {
    patterns: [/\bti\b/i, /tenant\s+improvement/i, /build[\s-]?out/i, /construction\s+allowance/i, /improvement\s+allowance/i],
    suggestion: {
      label: "TI allowance",
      instruction: "Focus on tenant improvement provisions. Verify TI disbursement timing, unused TI treatment, landlord approval rights over plans, and whether TI applies to soft costs. Flag any clawback or amortization provisions.",
      reason: "Document references tenant improvements or build-out",
      category: "financial",
    },
  },
  {
    patterns: [/\bescalat/i, /annual\s+increase/i, /rent\s+adjustment/i, /\bcpi\b/i, /consumer\s+price/i],
    suggestion: {
      label: "Rent escalation",
      instruction: "Scrutinize rent escalation provisions. Evaluate whether escalations are fixed percentage, CPI-based, or stepped. For CPI, ensure there is a floor and cap. Flag any compounding methodology that creates above-market growth.",
      reason: "Document contains rent escalation terms",
      category: "financial",
    },
  },
  {
    patterns: [/free\s+rent/i, /rent\s+abatement/i, /rent[\s-]?free/i, /abatement\s+period/i],
    suggestion: {
      label: "Free rent / abatement",
      instruction: "Review rent abatement provisions carefully. Ensure recapture rights if tenant defaults during or after concession period. Verify whether abatement applies to base rent only or also includes additional rent.",
      reason: "Document includes rent abatement or free rent terms",
      category: "financial",
    },
  },
  {
    patterns: [/percentage\s+rent/i, /breakpoint/i, /gross\s+sales/i, /natural\s+breakpoint/i],
    suggestion: {
      label: "Percentage rent",
      instruction: "Analyze percentage rent provisions. Verify breakpoint calculation methodology, excluded sales categories, reporting requirements, and audit rights. Ensure breakpoint adjusts with base rent escalations.",
      reason: "Document contains percentage rent or breakpoint language",
      category: "financial",
    },
  },
  // ── Use & Exclusivity ──
  {
    patterns: [/exclusive\s+use/i, /exclusiv/i, /radius\s+restrict/i, /non[\s-]?compete/i],
    suggestion: {
      label: "Exclusive use",
      instruction: "Flag all exclusive use provisions. Evaluate scope (is it too narrow or too broad?), carve-outs for existing tenants, remedies for violation (rent reduction vs. termination right), and radius restrictions.",
      reason: "Document contains exclusive use or non-compete terms",
      category: "operations",
    },
  },
  {
    patterns: [/co[\s-]?tenancy/i, /co[\s-]?tenant/i, /anchor\s+tenant/i, /occupancy\s+requirement/i],
    suggestion: {
      label: "Co-tenancy risk",
      instruction: "Closely examine co-tenancy provisions. Flag any rent reduction triggers, termination rights tied to anchor tenant occupancy, required occupancy thresholds, and cure periods. Quantify the financial exposure.",
      reason: "Document references co-tenancy or anchor tenant requirements",
      category: "risk",
    },
  },
  {
    patterns: [/permitted\s+use/i, /use\s+clause/i, /restricted\s+use/i, /prohibited\s+use/i],
    suggestion: {
      label: "Use restrictions",
      instruction: "Review use clause restrictions. Ensure the permitted use is broad enough for business operations but doesn't create conflicts with other tenants. Flag any restrictions that could limit future business pivots.",
      reason: "Document contains permitted or restricted use provisions",
      category: "operations",
    },
  },
  // ── Assignment & Subletting ──
  {
    patterns: [/assign/i, /sublet/i, /sublease/i, /transfer\s+rights/i],
    suggestion: {
      label: "Assignment & subletting",
      instruction: "Review assignment and subletting provisions. Evaluate whether landlord consent is required (and standard — not to be unreasonably withheld). Flag recapture rights, profit-sharing on sublease, and whether affiliate transfers are permitted without consent.",
      reason: "Document contains assignment or subletting provisions",
      category: "legal",
    },
  },
  // ── Default & Remedies ──
  {
    patterns: [/\bdefault\b/i, /cure\s+period/i, /notice\s+of\s+default/i, /event\s+of\s+default/i],
    suggestion: {
      label: "Default & remedies",
      instruction: "Analyze default provisions from landlord's perspective. Ensure adequate cure periods (monetary: 5 days, non-monetary: 30 days), proper notice requirements, and that landlord remedies include acceleration and re-entry rights.",
      reason: "Document contains default or cure provisions",
      category: "legal",
    },
  },
  // ── Guaranty ──
  {
    patterns: [/\bguaranty\b/i, /\bguarantor\b/i, /\bguarantee\b/i, /personal\s+liability/i, /burn[\s-]?off/i, /good[\s-]?guy/i],
    suggestion: {
      label: "Guaranty provisions",
      instruction: "Examine guaranty provisions thoroughly. Evaluate guaranty type (full vs. good-guy vs. limited), burn-off conditions, cap amount, whether it covers all lease obligations, and release triggers. Flag any unlimited personal liability.",
      reason: "Document contains guaranty or personal liability terms",
      category: "risk",
    },
  },
  // ── Casualty & Condemnation ──
  {
    patterns: [/casualty/i, /condemnation/i, /eminent\s+domain/i, /damage\s+or\s+destruction/i, /fire\s+or\s+casualty/i],
    suggestion: {
      label: "Casualty & condemnation",
      instruction: "Review casualty and condemnation provisions. Verify landlord's restoration obligations, rent abatement during repairs, termination thresholds (what percentage damage triggers termination right), and condemnation award allocation.",
      reason: "Document addresses casualty, condemnation, or eminent domain",
      category: "risk",
    },
  },
  // ── Insurance ──
  {
    patterns: [/\binsurance\b/i, /liability\s+insurance/i, /indemnif/i, /waiver\s+of\s+subrogation/i],
    suggestion: {
      label: "Insurance & indemnity",
      instruction: "Review insurance requirements and indemnification provisions. Verify minimum coverage amounts are market-standard, mutual waiver of subrogation is included, and indemnification obligations are reciprocal. Flag any unlimited indemnity exposure.",
      reason: "Document contains insurance or indemnification language",
      category: "legal",
    },
  },
  // ── Options ──
  {
    patterns: [/option\s+to\s+renew/i, /renewal\s+option/i, /extension\s+option/i, /option\s+term/i],
    suggestion: {
      label: "Renewal options",
      instruction: "Analyze renewal option provisions. Verify notice periods, fair market rent determination methodology (who appraises?), whether options are personal to original tenant, and any conditions precedent (no default, continuous occupancy).",
      reason: "Document contains renewal or extension option terms",
      category: "strategy",
    },
  },
  {
    patterns: [/right\s+of\s+first/i, /rofo/i, /rofr/i, /expansion\s+option/i, /first\s+refusal/i, /first\s+offer/i],
    suggestion: {
      label: "ROFO/ROFR rights",
      instruction: "Evaluate right of first offer/refusal and expansion provisions. Verify response timeframes, whether the right is personal or transferable, matching conditions, and impact on landlord's ability to lease adjacent space.",
      reason: "Document contains ROFO, ROFR, or expansion option language",
      category: "strategy",
    },
  },
  {
    patterns: [/early\s+terminat/i, /kick[\s-]?out/i, /termination\s+option/i, /break\s+option/i],
    suggestion: {
      label: "Early termination",
      instruction: "Scrutinize early termination and kick-out provisions. Evaluate the penalty amount (unamortized TI + commissions + remaining rent), notice periods, conditions for exercise, and whether landlord has a reciprocal termination right.",
      reason: "Document contains early termination or kick-out provisions",
      category: "risk",
    },
  },
  // ── Maintenance & Repairs ──
  {
    patterns: [/maintenance/i, /repair/i, /capital\s+replacement/i, /structural\s+repair/i, /roof\b/i, /\bhvac\b/i],
    suggestion: {
      label: "Maintenance obligations",
      instruction: "Review maintenance and repair allocation. Ensure structural repairs, roof, and capital replacements are landlord's responsibility. Flag any provisions shifting capital or structural maintenance costs to tenant.",
      reason: "Document addresses maintenance, repairs, or capital items",
      category: "operations",
    },
  },
  // ── Signage ──
  {
    patterns: [/\bsignage\b/i, /\bsign\s+rights/i, /monument\s+sign/i, /pylon\s+sign/i, /building\s+signage/i],
    suggestion: {
      label: "Signage rights",
      instruction: "Review signage provisions. Evaluate sign specifications, approval process, monument/pylon sign rights, building-top signage, and whether signage rights are exclusive or shared. Flag any ambiguity in sign placement.",
      reason: "Document references signage or sign rights",
      category: "operations",
    },
  },
  // ── Parking ──
  {
    patterns: [/\bparking\b/i, /parking\s+ratio/i, /reserved\s+parking/i, /parking\s+spaces/i],
    suggestion: {
      label: "Parking provisions",
      instruction: "Review parking allocation and rights. Verify the ratio per 1,000 SF, reserved vs. unreserved breakdown, whether parking is included in rent or additional, and any rights to adjust parking charges.",
      reason: "Document contains parking provisions",
      category: "operations",
    },
  },
  // ── Subordination / SNDA ──
  {
    patterns: [/subordinat/i, /non[\s-]?disturbance/i, /\bsnda\b/i, /attornment/i, /estoppel/i],
    suggestion: {
      label: "SNDA / subordination",
      instruction: "Review subordination and non-disturbance provisions. Ensure tenant receives adequate non-disturbance protection, the SNDA is required from existing and future lenders, and estoppel timeframes are reasonable (15 business days).",
      reason: "Document addresses subordination, SNDA, or estoppel",
      category: "legal",
    },
  },
  // ── Holdover ──
  {
    patterns: [/holdover/i, /hold[\s-]?over/i, /tenancy\s+at\s+sufferance/i],
    suggestion: {
      label: "Holdover provisions",
      instruction: "Review holdover provisions. Verify the holdover rent premium (should be 150-200% of final rent), whether holdover creates a month-to-month tenancy, and consequential damages provisions for extended holdover beyond a reasonable period.",
      reason: "Document contains holdover or tenancy-at-sufferance language",
      category: "legal",
    },
  },
  // ── LOI-specific ──
  {
    patterns: [/non[\s-]?binding/i, /letter\s+of\s+intent/i, /term\s+sheet/i, /proposal/i],
    suggestion: {
      label: "LOI binding terms",
      instruction: "Identify which LOI provisions are binding vs. non-binding. Ensure confidentiality, exclusivity period, and governing law are binding. Flag any language that could create unintended binding obligations on business terms.",
      reason: "Document appears to be an LOI or term sheet",
      category: "legal",
    },
    documentTypes: ["loi"],
  },
  // ── Restaurant-specific ──
  {
    patterns: [/kitchen/i, /ventilation/i, /exhaust/i, /grease\s+trap/i, /food\s+service/i, /liquor\s+license/i],
    suggestion: {
      label: "Restaurant/food service",
      instruction: "Focus on restaurant-specific provisions: kitchen exhaust and ventilation specifications, grease trap requirements, hours of operation for food prep, liquor license obligations, and outdoor dining/patio rights. Flag any inadequate utility specifications.",
      reason: "Document contains restaurant or food-service-specific terms",
      category: "operations",
    },
    documentTypes: ["lease", "restaurant_exhibit", "work_letter"],
  },
  // ── Hazardous Materials ──
  {
    patterns: [/hazardous/i, /environmental/i, /asbestos/i, /mold/i, /remediat/i],
    suggestion: {
      label: "Environmental risk",
      instruction: "Review environmental and hazardous materials provisions. Ensure landlord warrants the premises are free of pre-existing contamination, tenant's obligations are limited to its own operations, and indemnification is mutual for each party's contamination.",
      reason: "Document contains environmental or hazardous materials language",
      category: "risk",
    },
  },
  // ── Relocation ──
  {
    patterns: [/relocat/i, /landlord.*move/i, /substitute\s+premises/i],
    suggestion: {
      label: "Relocation clause",
      instruction: "Flag any landlord relocation rights. These are typically tenant-unfavorable. If present, ensure the substitute space is comparable in size, location, and finish, and that landlord bears all relocation costs. Consider proposing deletion.",
      reason: "Document may contain a landlord relocation right",
      category: "risk",
    },
  },
  // ── Force Majeure ──
  {
    patterns: [/force\s+majeure/i, /act\s+of\s+god/i, /pandemic/i, /epidemic/i],
    suggestion: {
      label: "Force majeure",
      instruction: "Review force majeure provisions. Ensure rent obligations are NOT excused by force majeure. Verify that construction/delivery delays for force majeure are reasonable (cap at 180 days). Flag any pandemic-specific provisions.",
      reason: "Document contains force majeure or similar provisions",
      category: "legal",
    },
  },
];

/**
 * Scan document text and document type to generate contextual prompt suggestions.
 * When learning context is provided, suggestions are ranked by a blend of
 * document relevance (pattern matches) and historical success scores.
 */
export function generatePromptSuggestions(
  documentText: string,
  documentType: DocumentType,
  learning?: SuggestionLearningContext
): PromptSuggestion[] {
  if (!documentText || documentText.length < 100) return [];

  // Lowercase the text once for efficient matching
  const text = documentText.toLowerCase();
  const results: (PromptSuggestion & { score: number })[] = [];

  for (const rule of PATTERN_RULES) {
    // Skip if this rule is document-type-specific and doesn't match
    if (
      rule.documentTypes &&
      rule.documentTypes.length > 0 &&
      !rule.documentTypes.includes(documentType)
    ) {
      continue;
    }

    // Count how many patterns match
    let matchCount = 0;
    for (const pattern of rule.patterns) {
      const matches = text.match(new RegExp(pattern.source, "gi"));
      if (matches) matchCount += matches.length;
    }

    const minRequired = rule.minMatches ?? 1;
    if (matchCount >= minRequired) {
      const id = rule.suggestion.label.toLowerCase().replace(/[^a-z0-9]/g, "_");

      // Blend relevance score with learning data
      let score = matchCount;
      let usageCount: number | undefined;
      let successScore: number | undefined;

      if (learning) {
        const success = learning.getSuccessScore(id);
        const usage = learning.getUsageCount(id);
        usageCount = usage;
        successScore = success;
        // Boost score by success history: up to 2x for proven suggestions
        score = matchCount * (1 + success);
        // Small boost for frequently used suggestions even without success data yet
        if (usage > 0 && success === 0) {
          score += usage * 0.5;
        }
      }

      results.push({
        id,
        ...rule.suggestion,
        source: "detected",
        usageCount,
        successScore,
        score,
      });
    }
  }

  // Sort by blended score descending — most relevant + proven first
  results.sort((a, b) => b.score - a.score);

  // Return top 8 suggestions to avoid overwhelming the UI
  return results.slice(0, 8).map(({ score: _score, ...rest }) => rest);
}

/**
 * Convert learned suggestions from the learning hook into PromptSuggestion format.
 * These are user's custom instructions that have been promoted to suggestions.
 */
export function getLearnedPromptSuggestions(
  learning?: SuggestionLearningContext
): PromptSuggestion[] {
  if (!learning || learning.learnedSuggestions.length === 0) return [];

  return learning.learnedSuggestions
    .sort((a, b) => b.successScore - a.successScore)
    .slice(0, 4)
    .map((s) => ({
      id: s.id,
      label: s.label,
      instruction: s.instruction,
      reason: `Learned from your past instructions (used ${s.usageCount}x, ${Math.round(s.successScore * 100)}% success)`,
      category: s.category,
      source: "learned" as const,
      usageCount: s.usageCount,
      successScore: s.successScore,
    }));
}

/**
 * Get always-available base prompts for a document type
 * (shown even when no specific patterns are detected).
 * When learning context is provided, base prompts also get success scores.
 */
export function getBasePrompts(
  documentType: DocumentType,
  learning?: SuggestionLearningContext
): PromptSuggestion[] {
  const base: PromptSuggestion[] = [];

  switch (documentType) {
    case "lease":
      base.push(
        {
          id: "landlord_favorable",
          label: "Maximize landlord position",
          instruction: "Analyze from an aggressive landlord perspective. Propose the strongest possible landlord-favorable revisions for every clause. Prioritize protecting NOI and limiting tenant flexibility.",
          reason: "General landlord-favorable analysis",
          category: "strategy",
          source: "base",
        },
        {
          id: "balanced_review",
          label: "Balanced review",
          instruction: "Provide a balanced analysis identifying risks on both sides. Flag provisions that are outside market norms in either direction. Suggest language that would be acceptable to both parties.",
          reason: "Market-balanced analysis",
          category: "strategy",
          source: "base",
        }
      );
      break;
    case "loi":
      base.push({
        id: "loi_key_terms",
        label: "Key term gaps",
        instruction: "Identify any key deal terms that are missing from this LOI that should be addressed before lease drafting. Flag vague or ambiguous business terms that could lead to disputes during lease negotiation.",
        reason: "LOI completeness check",
        category: "strategy",
        source: "base",
      });
      break;
    case "amendment":
      base.push({
        id: "amendment_consistency",
        label: "Consistency with original",
        instruction: "Flag any provisions in this amendment that may conflict with or create ambiguity when read together with a standard lease. Pay special attention to defined terms and cross-references.",
        reason: "Amendment consistency check",
        category: "legal",
        source: "base",
      });
      break;
    case "guaranty":
      base.push({
        id: "guaranty_scope",
        label: "Guaranty scope & limits",
        instruction: "Carefully evaluate the scope of the guaranty. Is it full, limited, or good-guy? Analyze burn-off provisions, cap amounts, and whether the guaranty survives assignment. Propose the strongest enforceable guaranty structure.",
        reason: "Guaranty-specific analysis",
        category: "risk",
        source: "base",
      });
      break;
    case "work_letter":
      base.push({
        id: "work_letter_scope",
        label: "Scope & cost allocation",
        instruction: "Focus on the allocation of construction costs, scope of landlord vs. tenant work, approval timelines, change order procedures, and contractor requirements. Flag any provisions that shift construction risk to landlord.",
        reason: "Work letter-specific analysis",
        category: "financial",
        source: "base",
      });
      break;
    default:
      break;
  }

  // Enrich base prompts with learning data if available
  if (learning) {
    for (const prompt of base) {
      prompt.usageCount = learning.getUsageCount(prompt.id);
      prompt.successScore = learning.getSuccessScore(prompt.id);
    }
  }

  return base;
}
