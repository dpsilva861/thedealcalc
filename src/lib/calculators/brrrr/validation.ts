// BRRRR Calculator Validation
// Input validation rules for BRRRR analysis

import { BRRRRInputs } from "./types";

export interface BRRRRValidationRule {
  min?: number;
  max?: number;
  unit: string;
  label: string;
  errorMessage: string;
  warningThreshold?: { value: number; message: string };
}

export interface BRRRRValidationError {
  field: string;
  message: string;
}

export interface BRRRRValidationWarning {
  field: string;
  message: string;
  severity: "low" | "medium" | "high";
}

export interface BRRRRValidationResult {
  isValid: boolean;
  errors: BRRRRValidationError[];
  warnings: BRRRRValidationWarning[];
}

export const BRRRR_VALIDATION_RULES: Record<string, BRRRRValidationRule> = {
  // Acquisition
  purchasePrice: {
    min: 1000,
    max: 100000000,
    unit: "dollars",
    label: "Purchase Price",
    errorMessage: "Purchase price must be between $1,000 and $100,000,000",
  },
  rehabBudget: {
    min: 0,
    max: 10000000,
    unit: "dollars",
    label: "Rehab Budget",
    errorMessage: "Rehab budget must be between $0 and $10,000,000",
  },
  holdingPeriodMonths: {
    min: 1,
    max: 36,
    unit: "months",
    label: "Holding Period",
    errorMessage: "Holding period must be between 1 and 36 months",
    warningThreshold: { value: 12, message: "Holding period over 12 months increases carrying costs significantly" },
  },
  
  // Bridge Financing
  downPaymentPct: {
    min: 0,
    max: 1,
    unit: "decimal",
    label: "Down Payment %",
    errorMessage: "Down payment must be between 0% and 100%",
    warningThreshold: { value: 0.10, message: "Down payment below 10% may be difficult to obtain" },
  },
  bridgeInterestRate: {
    min: 0,
    max: 0.25,
    unit: "decimal",
    label: "Bridge Interest Rate",
    errorMessage: "Interest rate must be between 0% and 25%",
    warningThreshold: { value: 0.15, message: "Interest rate above 15% is very high" },
  },
  pointsPct: {
    min: 0,
    max: 0.10,
    unit: "decimal",
    label: "Points",
    errorMessage: "Points must be between 0% and 10%",
  },
  
  // ARV
  arv: {
    min: 1000,
    max: 100000000,
    unit: "dollars",
    label: "After Repair Value",
    errorMessage: "ARV must be between $1,000 and $100,000,000",
  },
  
  // Refinance
  refiLtvPct: {
    min: 0.50,
    max: 0.85,
    unit: "decimal",
    label: "Refi LTV %",
    errorMessage: "Refi LTV must be between 50% and 85%",
    warningThreshold: { value: 0.80, message: "LTV above 80% may require PMI or have higher rates" },
  },
  refiInterestRate: {
    min: 0,
    max: 0.15,
    unit: "decimal",
    label: "Refi Interest Rate",
    errorMessage: "Refi interest rate must be between 0% and 15%",
  },
  
  // Rental
  monthlyRent: {
    min: 0,
    max: 1000000,
    unit: "dollars",
    label: "Monthly Rent",
    errorMessage: "Monthly rent must be between $0 and $1,000,000",
  },
  vacancyPct: {
    min: 0,
    max: 0.50,
    unit: "decimal",
    label: "Vacancy %",
    errorMessage: "Vacancy must be between 0% and 50%",
    warningThreshold: { value: 0.10, message: "Vacancy above 10% may indicate market concerns" },
  },
};

export function validateBRRRRInputs(inputs: BRRRRInputs): BRRRRValidationResult {
  const errors: BRRRRValidationError[] = [];
  const warnings: BRRRRValidationWarning[] = [];

  // Acquisition validations
  const { acquisition, bridgeFinancing, afterRepairValue, refinance, rentalOperations } = inputs;

  // Purchase Price
  if (acquisition.purchasePrice < 1000 || acquisition.purchasePrice > 100000000) {
    errors.push({ field: "purchasePrice", message: BRRRR_VALIDATION_RULES.purchasePrice.errorMessage });
  }

  // Rehab Budget
  if (acquisition.rehabBudget < 0 || acquisition.rehabBudget > 10000000) {
    errors.push({ field: "rehabBudget", message: BRRRR_VALIDATION_RULES.rehabBudget.errorMessage });
  }

  // Holding Period
  if (acquisition.holdingPeriodMonths < 1 || acquisition.holdingPeriodMonths > 36) {
    errors.push({ field: "holdingPeriodMonths", message: BRRRR_VALIDATION_RULES.holdingPeriodMonths.errorMessage });
  } else if (acquisition.holdingPeriodMonths > 12) {
    warnings.push({ 
      field: "holdingPeriodMonths", 
      message: BRRRR_VALIDATION_RULES.holdingPeriodMonths.warningThreshold!.message,
      severity: "medium",
    });
  }

  // ARV
  if (afterRepairValue.arv < 1000) {
    errors.push({ field: "arv", message: BRRRR_VALIDATION_RULES.arv.errorMessage });
  }

  // ARV vs Purchase + Rehab check
  const allInCost = acquisition.purchasePrice + acquisition.rehabBudget;
  if (afterRepairValue.arv > 0 && allInCost > afterRepairValue.arv) {
    warnings.push({
      field: "arv",
      message: `All-in cost ($${allInCost.toLocaleString()}) exceeds ARV ($${afterRepairValue.arv.toLocaleString()})`,
      severity: "high",
    });
  }

  // Refi LTV
  if (refinance.refiLtvPct < 0.50 || refinance.refiLtvPct > 0.85) {
    errors.push({ field: "refiLtvPct", message: BRRRR_VALIDATION_RULES.refiLtvPct.errorMessage });
  } else if (refinance.refiLtvPct > 0.80) {
    warnings.push({
      field: "refiLtvPct",
      message: BRRRR_VALIDATION_RULES.refiLtvPct.warningThreshold!.message,
      severity: "medium",
    });
  }

  // Vacancy
  if (rentalOperations.vacancyPct < 0 || rentalOperations.vacancyPct > 0.50) {
    errors.push({ field: "vacancyPct", message: BRRRR_VALIDATION_RULES.vacancyPct.errorMessage });
  } else if (rentalOperations.vacancyPct > 0.10) {
    warnings.push({
      field: "vacancyPct",
      message: BRRRR_VALIDATION_RULES.vacancyPct.warningThreshold!.message,
      severity: "low",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
