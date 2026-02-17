// Lease Redline Agent Types — v2

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
