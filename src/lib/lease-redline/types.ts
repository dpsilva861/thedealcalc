// Lease Redline Agent Types — v3 (chat, financial models, memory)

export type DocumentType =
  | "lease"
  | "loi"
  | "amendment"
  | "addendum"
  | "work_letter"
  | "guaranty"
  | "subordination_estoppel"
  | "restaurant_exhibit";

export type OutputMode = "redline" | "clean" | "summary";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type RevisionDecision = "pending" | "accepted" | "rejected" | "modified";

export interface LeaseRedlineRequest {
  documentText: string;
  documentType: DocumentType;
  outputMode: OutputMode;
  additionalInstructions?: string;
}

export interface LeaseRedlineRevision {
  clauseNumber: number;
  originalLanguage: string;
  redlineMarkup: string;
  cleanReplacement: string;
  reason: string;
  riskLevel?: RiskLevel;
  category?: string;
  confidence?: number;
}

export interface TokenUsage {
  input: number;
  output: number;
}

export interface LeaseRedlineResponse {
  revisions: LeaseRedlineRevision[];
  summary?: string;
  riskFlags: string[];
  definedTerms: string[];
  documentType: DocumentType;
  outputMode: OutputMode;
  rawContent: string;
  tokenUsage?: TokenUsage;
}

export interface RevisionWithDecision extends LeaseRedlineRevision {
  decision: RevisionDecision;
  modifiedText?: string;
}

export interface LeaseRedlineState {
  isLoading: boolean;
  error: string | null;
  response: LeaseRedlineResponse | null;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  lease: "Lease Agreement",
  loi: "Letter of Intent (LOI)",
  amendment: "Amendment",
  addendum: "Addendum",
  work_letter: "Work Letter",
  guaranty: "Guaranty",
  subordination_estoppel: "Subordination / Estoppel",
  restaurant_exhibit: "Restaurant Exhibit",
};

export const DOCUMENT_TYPE_DESCRIPTIONS: Record<DocumentType, string> = {
  lease: "Full commercial lease agreement with all exhibits and schedules",
  loi: "Non-binding letter of intent outlining key deal terms",
  amendment: "Modification to an existing lease agreement",
  addendum: "Additional terms or exhibits to be incorporated into the lease",
  work_letter: "Construction and tenant improvement specifications",
  guaranty: "Personal or corporate guaranty of lease obligations",
  subordination_estoppel: "Subordination, non-disturbance, and attornment agreements",
  restaurant_exhibit: "Food-service-specific lease exhibit with kitchen and ventilation requirements",
};

export const OUTPUT_MODE_LABELS: Record<OutputMode, string> = {
  redline: "Redline Mode",
  clean: "Clean Mode",
  summary: "Summary Mode",
};

export const OUTPUT_MODE_DESCRIPTIONS: Record<OutputMode, string> = {
  redline: "Strike/add markup showing all changes inline with full detail",
  clean: "Final landlord-preferred version only — ready for negotiation",
  summary: "Key business issues, negotiation strategy, and deal risk overview",
};

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  critical: "Critical — Direct NOI impact >5% or unlimited liability",
  high: "High — NOI impact 2-5% or flexibility limitation",
  medium: "Medium — Unfavorable but negotiable terms",
  low: "Low — Minor wording improvements",
};

// ── Chat Types ────────────────────────────────────────────────────────

export type ChatRole = "user" | "assistant";

export type FinancialModelType =
  | "rent_escalation"
  | "ti_amortization"
  | "noi_impact"
  | "effective_rent"
  | "co_tenancy_impact";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
  reasoning?: string[];
  financialModel?: FinancialModelResult;
  suggestions?: string[];
  revisionRef?: number; // clauseNumber reference
}

export interface ChatContext {
  analysisId?: string;
  documentType: DocumentType;
  outputMode: OutputMode;
  revisionsSummary: string; // compact summary of revisions for context
  riskFlags: string[];
  definedTerms: string[];
  decisions: RevisionDecision[];
  conversationHistory: ChatMessage[];
  userPreferences?: UserPreferences;
}

export interface ChatRequest {
  message: string;
  context: ChatContext;
}

export interface ChatResponse {
  message: string;
  reasoning: string[];
  financialModel?: FinancialModelResult;
  suggestions: string[];
  revisionRef?: number;
}

// ── Financial Model Types ─────────────────────────────────────────────

export interface RentEscalationInputs {
  baseRentPSF: number;
  squareFeet: number;
  leaseTerm: number; // years
  escalationType: "fixed_pct" | "cpi" | "flat" | "stepped";
  escalationRate: number; // e.g., 0.03 for 3%
  cpiFloor?: number;
  cpiCap?: number;
  freeRentMonths?: number;
}

export interface RentEscalationResult {
  yearlySchedule: { year: number; annualRent: number; rentPSF: number }[];
  totalRent: number;
  effectiveRentPSF: number;
  avgAnnualRent: number;
}

export interface TIAmortizationInputs {
  tiAmount: number;
  interestRate: number; // e.g., 0.08 for 8%
  leaseTerm: number; // years
  earlyTerminationYear?: number;
}

export interface TIAmortizationResult {
  monthlyPayment: number;
  totalCost: number;
  totalInterest: number;
  amortizationSchedule: { year: number; balance: number; yearlyPayment: number; principalPaid: number; interestPaid: number }[];
  unamortizedAtTermination?: number;
}

export interface NOIImpactInputs {
  currentNOI: number;
  revisionImpact: number; // dollar amount or percentage
  impactIsPercentage: boolean;
  capRate: number; // e.g., 0.065 for 6.5%
}

export interface NOIImpactResult {
  originalNOI: number;
  revisedNOI: number;
  noiChange: number;
  noiChangePct: number;
  originalValue: number;
  revisedValue: number;
  valueChange: number;
}

export interface EffectiveRentInputs {
  baseRentPSF: number;
  squareFeet: number;
  leaseTerm: number;
  escalationRate: number;
  freeRentMonths: number;
  tiAllowancePSF: number;
  landlordWorkCost?: number;
  leasingCommissionPct?: number;
}

export interface EffectiveRentResult {
  grossRentTotal: number;
  totalConcessions: number;
  netEffectiveRentTotal: number;
  netEffectiveRentPSF: number;
  netEffectiveRentMonthly: number;
  landlordCostPerYear: number;
}

export interface CoTenancyImpactInputs {
  baseAnnualRent: number;
  reducedRentPct: number; // e.g., 0.50 for 50% of base
  curePeriodMonths: number;
  probabilityOfTrigger: number; // 0-1
  leaseTerm: number;
}

export interface CoTenancyImpactResult {
  maxAnnualLoss: number;
  expectedAnnualLoss: number;
  maxLossOverTerm: number;
  expectedLossOverTerm: number;
  noiImpactPct: number;
}

export type FinancialModelInputs =
  | { type: "rent_escalation"; inputs: RentEscalationInputs }
  | { type: "ti_amortization"; inputs: TIAmortizationInputs }
  | { type: "noi_impact"; inputs: NOIImpactInputs }
  | { type: "effective_rent"; inputs: EffectiveRentInputs }
  | { type: "co_tenancy_impact"; inputs: CoTenancyImpactInputs };

export type FinancialModelResult =
  | { type: "rent_escalation"; inputs: RentEscalationInputs; results: RentEscalationResult }
  | { type: "ti_amortization"; inputs: TIAmortizationInputs; results: TIAmortizationResult }
  | { type: "noi_impact"; inputs: NOIImpactInputs; results: NOIImpactResult }
  | { type: "effective_rent"; inputs: EffectiveRentInputs; results: EffectiveRentResult }
  | { type: "co_tenancy_impact"; inputs: CoTenancyImpactInputs; results: CoTenancyImpactResult };

export const FINANCIAL_MODEL_LABELS: Record<FinancialModelType, string> = {
  rent_escalation: "Rent Escalation Schedule",
  ti_amortization: "TI Amortization Schedule",
  noi_impact: "NOI & Value Impact",
  effective_rent: "Net Effective Rent",
  co_tenancy_impact: "Co-Tenancy Impact",
};

// ── Memory / Preferences Types ────────────────────────────────────────

export interface UserPreferences {
  negotiationStyle?: "aggressive" | "moderate" | "conservative";
  typicalCapRate?: number;
  typicalEscalation?: number;
  preferredDocTypes?: DocumentType[];
  commonInstructions?: string;
  lastUsed?: number;
}

export interface SavedAnalysis {
  id: string;
  title: string;
  documentType: DocumentType;
  outputMode: OutputMode;
  revisionsCount: number;
  criticalCount: number;
  chatMessageCount: number;
  createdAt: string;
}
