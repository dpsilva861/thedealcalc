// Lease Redline Agent Types — v4 (deal folders, clause library, versions, collaboration, audit)

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
  jurisdiction?: string;
  templateId?: string;
  dealId?: string;
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
  revisionRef?: number;
}

export interface ChatContext {
  analysisId?: string;
  documentType: DocumentType;
  outputMode: OutputMode;
  revisionsSummary: string;
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
  leaseTerm: number;
  escalationType: "fixed_pct" | "cpi" | "flat" | "stepped";
  escalationRate: number;
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
  interestRate: number;
  leaseTerm: number;
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
  revisionImpact: number;
  impactIsPercentage: boolean;
  capRate: number;
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
  reducedRentPct: number;
  curePeriodMonths: number;
  probabilityOfTrigger: number;
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

// ── Deal Folder Types ─────────────────────────────────────────────────

export interface DealFolder {
  id: string;
  name: string;
  propertyAddress?: string;
  tenantName?: string;
  documents: DealDocument[];
  createdAt: string;
  updatedAt: string;
  jurisdiction?: string;
  notes?: string;
}

export interface DealDocument {
  id: string;
  dealId: string;
  documentType: DocumentType;
  fileName: string;
  analysisId?: string;
  uploadedAt: string;
  status: "pending" | "analyzed" | "reviewed";
}

// ── Version History Types ──────────────────────────────────────────────

export interface AnalysisVersion {
  id: string;
  analysisId: string;
  versionNumber: number;
  revisions: LeaseRedlineRevision[];
  decisions: RevisionDecision[];
  summary?: string;
  riskFlags: string[];
  createdAt: string;
  label?: string;
}

// ── Custom Clause Library Types ────────────────────────────────────────

export interface CustomClause {
  id: string;
  category: string;
  label: string;
  language: string;
  jurisdiction?: string;
  documentTypes: DocumentType[];
  isDefault: boolean;
  /** "manual" = user created, "learned" = auto-extracted from accepted revisions */
  source?: "manual" | "learned";
  /** How many times this clause's language was accepted across analyses */
  acceptanceCount?: number;
  /** The original revision reason that prompted this clause */
  learnedFromReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Collaboration Types ─────────────────────────────────────────────────

export interface Collaborator {
  userId: string;
  email: string;
  role: "owner" | "editor" | "viewer";
  addedAt: string;
}

export interface AnalysisComment {
  id: string;
  analysisId: string;
  revisionIndex?: number;
  userId: string;
  userEmail: string;
  content: string;
  createdAt: string;
  resolvedAt?: string;
}

// ── Audit Trail Types ────────────────────────────────────────────────────

export type AuditAction =
  | "analysis_created"
  | "analysis_viewed"
  | "revision_accepted"
  | "revision_rejected"
  | "revision_modified"
  | "analysis_shared"
  | "analysis_exported"
  | "comment_added"
  | "clause_saved"
  | "template_compared";

export interface AuditEntry {
  id: string;
  analysisId?: string;
  userId: string;
  action: AuditAction;
  details?: Record<string, unknown>;
  createdAt: string;
}

// ── Template Comparison Types ─────────────────────────────────────────

export interface LeaseTemplate {
  id: string;
  name: string;
  documentType: DocumentType;
  jurisdiction?: string;
  clauses: TemplateClause[];
  createdAt: string;
  updatedAt: string;
}

export interface TemplateClause {
  id: string;
  category: string;
  label: string;
  standardLanguage: string;
  order: number;
}

export interface TemplateDeviation {
  templateClauseId: string;
  templateClauseLabel: string;
  category: string;
  standardLanguage: string;
  incomingLanguage: string;
  deviationType: "missing" | "modified" | "added";
  severity: RiskLevel;
  explanation: string;
}

// ── Jurisdiction ──────────────────────────────────────────────────────

export const US_JURISDICTIONS = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California",
  "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
  "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri",
  "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
  "District of Columbia",
] as const;

export type USJurisdiction = typeof US_JURISDICTIONS[number];

// ── Share/Email Types ─────────────────────────────────────────────────

export interface ShareOptions {
  recipientEmail: string;
  includeChat: boolean;
  includeFinancials: boolean;
  message?: string;
  expiresInDays?: number;
}

export interface ShareLink {
  id: string;
  analysisId: string;
  token: string;
  createdBy: string;
  recipientEmail?: string;
  expiresAt: string;
  viewCount: number;
  createdAt: string;
}

// ── Timer & Analytics Types ──────────────────────────────────────────────

export type TimerPhase =
  | "upload"
  | "ai_analysis"
  | "human_review"
  | "export";

export interface TimerPhaseDuration {
  phase: TimerPhase;
  startedAt: number;
  endedAt?: number;
  durationMs?: number;
}

export interface TimerSession {
  id: string;
  analysisId: string;
  documentType: DocumentType;
  phases: TimerPhaseDuration[];
  totalDurationMs?: number;
  revisionCount?: number;
  decisionsPerMinute?: number;
  startedAt: string;
  completedAt?: string;
}

export interface AnalyticsMetrics {
  totalAnalyses: number;
  avgTotalTimeMs: number;
  avgAiTimeMs: number;
  avgHumanReviewTimeMs: number;
  avgDecisionsPerMinute: number;
  estimatedManualTimeMs: number;
  totalTimeSavedMs: number;
  byDocumentType: Record<string, { count: number; avgTimeMs: number }>;
  recentSessions: TimerSession[];
}

// ── Negotiation Round Types ─────────────────────────────────────────────

export type RoundStatus =
  | "drafting"
  | "sent"
  | "awaiting_response"
  | "received"
  | "reviewing"
  | "closed";

export type RoundParty = "us" | "counterparty";

export interface NegotiationRound {
  id: string;
  dealId: string;
  roundNumber: number;
  party: RoundParty;
  status: RoundStatus;
  analysisId?: string;
  documentText?: string;
  revisionsAccepted: number;
  revisionsRejected: number;
  revisionsOpen: number;
  notes?: string;
  receivedAt?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NegotiationSummary {
  dealId: string;
  totalRounds: number;
  currentRound: number;
  currentParty: RoundParty;
  currentStatus: RoundStatus;
  elapsedDays: number;
  avgResponseTimeDays: number;
  concessionsMade: number;
  concessionsReceived: number;
}

// ── Deal Status Extension ────────────────────────────────────────────────

export type DealStatus =
  | "new"
  | "in_review"
  | "redlines_sent"
  | "awaiting_response"
  | "counter_received"
  | "final_review"
  | "executed"
  | "dead";

export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  new: "New",
  in_review: "In Review",
  redlines_sent: "Redlines Sent",
  awaiting_response: "Awaiting Response",
  counter_received: "Counter Received",
  final_review: "Final Review",
  executed: "Executed",
  dead: "Dead Deal",
};

export const DEAL_STATUS_COLORS: Record<DealStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  in_review: "bg-yellow-100 text-yellow-800",
  redlines_sent: "bg-purple-100 text-purple-800",
  awaiting_response: "bg-orange-100 text-orange-800",
  counter_received: "bg-indigo-100 text-indigo-800",
  final_review: "bg-teal-100 text-teal-800",
  executed: "bg-green-100 text-green-800",
  dead: "bg-gray-100 text-gray-500",
};

// ── Cross-Document Consistency Types ─────────────────────────────────────

export interface ConsistencyIssue {
  id: string;
  severity: RiskLevel;
  category: "defined_term" | "date" | "amount" | "party_name" | "address" | "cross_reference";
  description: string;
  documentA: { id: string; fileName: string; excerpt: string };
  documentB: { id: string; fileName: string; excerpt: string };
  suggestion?: string;
}

// ── DOCX Import Types ────────────────────────────────────────────────────

export interface ImportedTrackChange {
  id: string;
  type: "insertion" | "deletion";
  author: string;
  date: string;
  text: string;
  context: string;
  paragraphIndex: number;
}

export interface DocxImportResult {
  plainText: string;
  trackChanges: ImportedTrackChange[];
  authors: string[];
  totalInsertions: number;
  totalDeletions: number;
}
