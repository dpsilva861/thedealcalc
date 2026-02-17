// Lease Redline Agent Types

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
  riskLevel?: "low" | "medium" | "high" | "critical";
  category?: string;
}

export interface LeaseRedlineResponse {
  revisions: LeaseRedlineRevision[];
  summary?: string;
  riskFlags: string[];
  documentType: DocumentType;
  outputMode: OutputMode;
  rawContent: string;
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

export const OUTPUT_MODE_LABELS: Record<OutputMode, string> = {
  redline: "Redline Mode",
  clean: "Clean Mode",
  summary: "Summary Mode",
};

export const OUTPUT_MODE_DESCRIPTIONS: Record<OutputMode, string> = {
  redline: "Strike/add markup showing all changes inline",
  clean: "Final landlord-preferred version only",
  summary: "Key business issues and negotiation strategy overview",
};
