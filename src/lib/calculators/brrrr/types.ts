// BRRRR Calculator Types
// Input and output types for BRRRR analysis

import { CalculatorWarning } from "../types";

export interface BRRRRAcquisition {
  purchasePrice: number;
  closingCosts: number;
  closingCostsIsPercent: boolean;
  rehabBudget: number;
  monthlyHoldingCosts: number;
  holdingPeriodMonths: number;
}

export interface BRRRRBridgeFinancing {
  downPaymentPct: number; // 0-1 decimal
  interestRate: number; // 0-1 decimal
  loanTermMonths: number;
  isInterestOnly: boolean;
  pointsPct: number; // 0-1 decimal
}

export interface BRRRRAfterRepairValue {
  arv: number;
}

export interface BRRRRRefinance {
  refiLtvPct: number; // 0-1 decimal
  refiInterestRate: number; // 0-1 decimal
  refiTermYears: number;
  refiClosingCosts: number;
  refiClosingCostsIsPercent: boolean;
  rollClosingCostsIntoLoan: boolean;
}

export interface BRRRRRentalOperations {
  monthlyRent: number;
  vacancyPct: number; // 0-1 decimal
  propertyManagementPct: number; // 0-1 decimal
  maintenancePct: number; // 0-1 decimal
  expenseBase: "gross_rent" | "egi"; // which base to calculate % expenses from
  insuranceMonthly: number;
  propertyTaxesMonthly: number;
  utilitiesMonthly: number;
  hoaMonthly: number;
  otherMonthly: number;
}

export interface BRRRRInputs {
  acquisition: BRRRRAcquisition;
  bridgeFinancing: BRRRRBridgeFinancing;
  afterRepairValue: BRRRRAfterRepairValue;
  refinance: BRRRRRefinance;
  rentalOperations: BRRRRRentalOperations;
}

export interface BRRRRHoldingPhaseResults {
  bridgeLoanAmount: number;
  monthlyBridgePayment: number;
  totalBridgePayments: number;
  totalHoldingCosts: number;
  totalRehabCost: number;
  closingCostsAmount: number;
  pointsAmount: number;
  totalCashIn: number;
}

export interface BRRRRRefinanceResults {
  maxRefiLoan: number;
  refiClosingCostsAmount: number;
  netRefiProceeds: number;
  cashOut: number;
  remainingCashInDeal: number;
  newMonthlyPayment: number;
}

export interface BRRRRRentalResults {
  grossMonthlyRent: number;
  effectiveGrossIncome: number;
  monthlyExpenses: number;
  monthlyNOI: number;
  annualNOI: number;
  monthlyDebtService: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
}

export interface BRRRRMetrics {
  cashOnCashReturn: number; // decimal
  dscr: number;
  capRate: number; // based on ARV
  totalROI: number;
  equityCreated: number;
  equityMultiple: number;
}

export interface BRRRRRiskFlag {
  code: string;
  message: string;
  severity: "warning" | "error";
}

export interface BRRRRSensitivityCell {
  rent: number;
  arv: number;
  monthlyCashFlow: number;
  cashOnCash: number;
  remainingCashIn: number;
}

export interface BRRRRSensitivityTable {
  rentVariations: number[]; // -10%, 0%, +10%
  arvVariations: number[]; // -5%, 0%, +5%
  cells: BRRRRSensitivityCell[][]; // [rent][arv]
}

export interface BRRRRResults {
  holdingPhase: BRRRRHoldingPhaseResults;
  refinance: BRRRRRefinanceResults;
  rental: BRRRRRentalResults;
  metrics: BRRRRMetrics;
  riskFlags: BRRRRRiskFlag[];
  sensitivity: BRRRRSensitivityTable;
  warnings: CalculatorWarning[];
}

// Preset definition
export interface BRRRRPreset {
  id: string;
  name: string;
  description: string;
  inputs: BRRRRInputs;
}
