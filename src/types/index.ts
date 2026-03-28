// =============================================
// CORE TYPES
// =============================================

export interface User {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  role: "landlord" | "tenant_rep" | "broker" | "attorney" | "asset_manager" | null;
  credits: number;
  total_redlines: number;
  created_at: string;
}

export interface RedlineJob {
  id: string;
  user_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  input_filename: string;
  input_text: string | null;
  input_token_count: number | null;
  property_type:
    | "retail"
    | "office"
    | "industrial"
    | "mixed-use"
    | "multifamily"
    | "medical"
    | "restaurant"
    | null;
  deal_type:
    | "new_lease"
    | "renewal"
    | "amendment"
    | "sublease"
    | "assignment"
    | "expansion"
    | null;
  redline_mode: "aggressive" | "standard" | "lenient";
  perspective: "landlord" | "tenant";
  prompt_version_id: string | null;
  output_json: RedlineResult | null;
  output_docx_url: string | null;
  output_pdf_url: string | null;
  processing_time_ms: number | null;
  api_cost_cents: number | null;
  stripe_payment_id: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface RedlineResult {
  summary: {
    deal_score: number;
    deal_type: string;
    property_type: string;
    risk_level: "low" | "medium" | "high" | "critical";
    estimated_annual_rent: string | null;
    lease_term: string | null;
    key_concerns: string[];
    missing_provisions: string[];
    strengths: string[];
  };
  redlines: RedlineItem[];
  missing_provisions: MissingProvision[];
  negotiation_strategy: NegotiationStrategy;
  learning_signals: LearningSignals;
}

export interface RedlineItem {
  id: number;
  section: string;
  original_text: string;
  issue: string;
  severity: "critical" | "major" | "minor" | "informational";
  recommendation: string;
  suggested_language: string;
  strategy: string;
  category: string;
  market_benchmark: string;
}

export interface MissingProvision {
  provision: string;
  importance: "critical" | "recommended" | "nice-to-have";
  suggested_language: string;
  rationale: string;
}

export interface NegotiationStrategy {
  opening_position: string;
  concession_priorities: string[];
  hard_lines: string[];
  overall_approach: string;
}

export interface LearningSignals {
  new_clause_variants: string[];
  unusual_provisions: string[];
  market_observations: string[];
}

// =============================================
// SELF-LEARNING TYPES
// =============================================

export interface LearnedPattern {
  id: string;
  pattern_type:
    | "clause_variant"
    | "common_issue"
    | "regional_trend"
    | "property_type_pattern"
    | "deal_type_pattern"
    | "negotiation_language"
    | "missing_provision"
    | "unusual_provision"
    | "market_observation"
    | "user_improved_language";
  category: string | null;
  description: string;
  example_text: string | null;
  recommended_action: string | null;
  recommended_language: string | null;
  frequency: number;
  acceptance_rate: number | null;
  avg_rating: number | null;
  confidence: number;
  property_types: string[] | null;
  deal_types: string[] | null;
  regions: string[] | null;
  source_job_ids: string[] | null;
  is_active: boolean;
  promoted_to_prompt: boolean;
  promoted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromptVersion {
  id: string;
  version_number: number;
  prompt_text: string;
  changelog: string | null;
  patterns_incorporated: string[] | null;
  avg_feedback_score: number | null;
  total_uses: number;
  is_active: boolean;
  is_candidate: boolean;
  ab_test_allocation: number;
  created_at: string;
}

export interface ABTestResult {
  id: string;
  test_name: string;
  control_version_id: string;
  candidate_version_id: string;
  started_at: string;
  ended_at: string | null;
  control_jobs: number;
  candidate_jobs: number;
  control_avg_rating: number | null;
  candidate_avg_rating: number | null;
  control_acceptance_rate: number | null;
  candidate_acceptance_rate: number | null;
  winner: "control" | "candidate" | "inconclusive" | null;
  auto_promoted: boolean;
}

export interface ClauseLibraryEntry {
  id: string;
  clause_type: string;
  original_language: string;
  quality_assessment: "strong" | "acceptable" | "weak" | "dangerous";
  recommended_alternative: string | null;
  perspective: "landlord_favorable" | "tenant_favorable" | "neutral";
  times_seen: number;
  source_job_ids: string[] | null;
  created_at: string;
  updated_at: string;
}

// =============================================
// FEEDBACK TYPES
// =============================================

export interface ItemFeedback {
  id: string;
  job_id: string;
  redline_item_index: number;
  category: string | null;
  severity: "critical" | "major" | "minor" | "informational" | null;
  action: "accepted" | "rejected" | "modified" | "skipped";
  modified_text: string | null;
  created_at: string;
}

export interface JobFeedback {
  id: string;
  job_id: string;
  user_id: string;
  rating: number;
  feedback_text: string | null;
  would_recommend: boolean | null;
  created_at: string;
}

// =============================================
// CONTENT/SEO TYPES
// =============================================

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  meta_description: string | null;
  content: string;
  category: string | null;
  published: boolean;
  created_at: string;
}
