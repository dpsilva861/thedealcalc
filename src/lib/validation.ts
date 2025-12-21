/**
 * Input Validation System for Underwriting Calculator
 * 
 * All validation rules are defined here with:
 * - Allowed ranges
 * - Units specification
 * - UI labels
 * - Error messages
 * - Fallback behavior
 */

import { UnderwritingInputs } from "./underwriting";

export interface ValidationRule {
  min: number;
  max: number;
  unit: "percent" | "decimal" | "currency" | "months" | "years" | "count";
  uiLabel: string;
  errorMessage: string;
  warningThreshold?: { low?: number; high?: number; message: string };
  fallback?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  value: number;
}

export interface ValidationWarning {
  field: string;
  message: string;
  value: number;
  severity: "info" | "caution" | "danger";
}

// ==================== VALIDATION RULES ====================

export const VALIDATION_RULES: Record<string, ValidationRule> = {
  // Acquisition
  purchasePrice: {
    min: 1,
    max: 1_000_000_000,
    unit: "currency",
    uiLabel: "Purchase Price",
    errorMessage: "Purchase price must be between $1 and $1B",
    warningThreshold: { low: 10000, message: "Purchase price seems unusually low" },
  },
  exitCapRate: {
    min: 0.5,
    max: 20,
    unit: "percent",
    uiLabel: "Exit Cap Rate (%)",
    errorMessage: "Exit cap rate must be between 0.5% and 20%",
    warningThreshold: { low: 2, high: 12, message: "Exit cap rate outside typical range (2-12%)" },
    fallback: 5.5,
  },
  holdPeriodMonths: {
    min: 1,
    max: 600,
    unit: "months",
    uiLabel: "Hold Period (months)",
    errorMessage: "Hold period must be between 1 and 600 months (50 years)",
    warningThreshold: { low: 6, message: "Hold period under 6 months may not allow stabilization" },
  },
  saleCostPct: {
    min: 0,
    max: 20,
    unit: "percent",
    uiLabel: "Sale Costs (%)",
    errorMessage: "Sale costs must be between 0% and 20%",
  },

  // Renovation
  renoRentLossPct: {
    min: 0,
    max: 1,
    unit: "decimal",
    uiLabel: "Rent Loss During Renovation (%)",
    errorMessage: "Rent loss must be between 0% (0.0) and 100% (1.0)",
    warningThreshold: { high: 0.75, message: "Rent loss over 75% during renovation is aggressive" },
    fallback: 0.5,
  },
  renoDurationMonths: {
    min: 0,
    max: 60,
    unit: "months",
    uiLabel: "Renovation Duration (months)",
    errorMessage: "Renovation duration must be between 0 and 60 months",
  },
  leaseUpMonthsAfterReno: {
    min: 0,
    max: 36,
    unit: "months",
    uiLabel: "Lease-Up Period (months)",
    errorMessage: "Lease-up period must be between 0 and 36 months",
  },

  // Financing
  loanToValue: {
    min: 0,
    max: 100,
    unit: "percent",
    uiLabel: "Loan-to-Value (%)",
    errorMessage: "LTV must be between 0% and 100%",
    warningThreshold: { high: 85, message: "LTV over 85% is highly leveraged and risky" },
    fallback: 75,
  },
  interestRate: {
    min: 0,
    max: 30,
    unit: "percent",
    uiLabel: "Interest Rate (%)",
    errorMessage: "Interest rate must be between 0% and 30%",
    warningThreshold: { high: 15, message: "Interest rate over 15% is unusually high" },
    fallback: 7,
  },
  amortizationYears: {
    min: 1,
    max: 40,
    unit: "years",
    uiLabel: "Amortization (years)",
    errorMessage: "Amortization must be between 1 and 40 years",
  },
  interestOnlyMonths: {
    min: 0,
    max: 120,
    unit: "months",
    uiLabel: "Interest-Only Period (months)",
    errorMessage: "Interest-only period must be between 0 and 120 months",
  },

  // Income
  unitCount: {
    min: 1,
    max: 10000,
    unit: "count",
    uiLabel: "Unit Count",
    errorMessage: "Unit count must be between 1 and 10,000",
  },
  economicVacancyPct: {
    min: 0,
    max: 100,
    unit: "percent",
    uiLabel: "Economic Vacancy (%)",
    errorMessage: "Vacancy must be between 0% and 100%",
    warningThreshold: { high: 25, message: "Vacancy over 25% may indicate distressed asset" },
  },
  rentGrowthAnnualPct: {
    min: -50,
    max: 50,
    unit: "percent",
    uiLabel: "Annual Rent Growth (%)",
    errorMessage: "Rent growth must be between -50% and 50%",
    warningThreshold: { low: -10, high: 10, message: "Rent growth outside typical range (-10% to 10%)" },
  },
};

// ==================== VALIDATION FUNCTIONS ====================

export function validateField(
  fieldName: string,
  value: number,
  rule?: ValidationRule
): { error?: string; warning?: ValidationWarning } {
  const r = rule || VALIDATION_RULES[fieldName];
  if (!r) return {};

  // Check if value is a valid number
  if (value === null || value === undefined || !isFinite(value)) {
    return { error: `${r.uiLabel} must be a valid number` };
  }

  // Range validation
  if (value < r.min || value > r.max) {
    return { error: r.errorMessage };
  }

  // Warning thresholds
  if (r.warningThreshold) {
    if (r.warningThreshold.low !== undefined && value < r.warningThreshold.low) {
      return {
        warning: {
          field: fieldName,
          message: r.warningThreshold.message,
          value,
          severity: "caution",
        },
      };
    }
    if (r.warningThreshold.high !== undefined && value > r.warningThreshold.high) {
      return {
        warning: {
          field: fieldName,
          message: r.warningThreshold.message,
          value,
          severity: "danger",
        },
      };
    }
  }

  return {};
}

export function validateInputs(inputs: UnderwritingInputs): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Acquisition validations
  const purchaseValidation = validateField("purchasePrice", inputs.acquisition.purchasePrice);
  if (purchaseValidation.error) {
    errors.push({ field: "purchasePrice", message: purchaseValidation.error, value: inputs.acquisition.purchasePrice });
  }
  if (purchaseValidation.warning) warnings.push(purchaseValidation.warning);

  const exitCapValidation = validateField("exitCapRate", inputs.acquisition.exitCapRate);
  if (exitCapValidation.error) {
    errors.push({ field: "exitCapRate", message: exitCapValidation.error, value: inputs.acquisition.exitCapRate });
  }
  if (exitCapValidation.warning) warnings.push(exitCapValidation.warning);

  const holdValidation = validateField("holdPeriodMonths", inputs.acquisition.holdPeriodMonths);
  if (holdValidation.error) {
    errors.push({ field: "holdPeriodMonths", message: holdValidation.error, value: inputs.acquisition.holdPeriodMonths });
  }
  if (holdValidation.warning) warnings.push(holdValidation.warning);

  // Renovation validations
  const renoLossValidation = validateField("renoRentLossPct", inputs.renovation.renoRentLossPct);
  if (renoLossValidation.error) {
    errors.push({ field: "renoRentLossPct", message: renoLossValidation.error, value: inputs.renovation.renoRentLossPct });
  }
  if (renoLossValidation.warning) warnings.push(renoLossValidation.warning);

  // Financing validations (only if using financing)
  if (inputs.financing.useFinancing) {
    if (inputs.financing.useLtv) {
      const ltvValidation = validateField("loanToValue", inputs.financing.loanLtv);
      if (ltvValidation.error) {
        errors.push({ field: "loanToValue", message: ltvValidation.error, value: inputs.financing.loanLtv });
      }
      if (ltvValidation.warning) warnings.push(ltvValidation.warning);
    }

    const rateValidation = validateField("interestRate", inputs.financing.interestRateAnnual);
    if (rateValidation.error) {
      errors.push({ field: "interestRate", message: rateValidation.error, value: inputs.financing.interestRateAnnual });
    }
    if (rateValidation.warning) warnings.push(rateValidation.warning);
  }

  // Income validations
  const unitValidation = validateField("unitCount", inputs.income.unitCount);
  if (unitValidation.error) {
    errors.push({ field: "unitCount", message: unitValidation.error, value: inputs.income.unitCount });
  }

  const vacancyValidation = validateField("economicVacancyPct", inputs.income.economicVacancyPct);
  if (vacancyValidation.error) {
    errors.push({ field: "economicVacancyPct", message: vacancyValidation.error, value: inputs.income.economicVacancyPct });
  }
  if (vacancyValidation.warning) warnings.push(vacancyValidation.warning);

  const growthValidation = validateField("rentGrowthAnnualPct", inputs.income.rentGrowthAnnualPct);
  if (growthValidation.error) {
    errors.push({ field: "rentGrowthAnnualPct", message: growthValidation.error, value: inputs.income.rentGrowthAnnualPct });
  }
  if (growthValidation.warning) warnings.push(growthValidation.warning);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ==================== OUTPUT VALIDATION ====================

export interface OutputWarning {
  metric: string;
  value: number | string;
  message: string;
  severity: "info" | "caution" | "danger";
}

export function validateOutputs(metrics: {
  irr: number;
  cocYear1: number;
  equityMultiple: number;
  dscr: number;
  breakevenOccupancy: number;
  salePrice?: number;
  purchasePrice?: number;
}): OutputWarning[] {
  const warnings: OutputWarning[] = [];

  // IRR extreme values
  if (metrics.irr > 100) {
    warnings.push({
      metric: "IRR",
      value: metrics.irr,
      message: `IRR of ${metrics.irr.toFixed(1)}% is unusually high. Verify inputs.`,
      severity: "caution",
    });
  }
  if (metrics.irr < -50) {
    warnings.push({
      metric: "IRR",
      value: metrics.irr,
      message: "Deeply negative IRR indicates severe loss.",
      severity: "danger",
    });
  }
  if (!isFinite(metrics.irr)) {
    warnings.push({
      metric: "IRR",
      value: "N/A",
      message: "IRR could not be calculated. Check inputs.",
      severity: "danger",
    });
  }

  // Sale price vs purchase price
  if (metrics.salePrice && metrics.purchasePrice) {
    const ratio = metrics.salePrice / metrics.purchasePrice;
    if (ratio > 5) {
      warnings.push({
        metric: "Sale Price",
        value: ratio,
        message: `Sale price is ${ratio.toFixed(1)}x purchase price. Verify exit cap rate.`,
        severity: "caution",
      });
    }
    if (ratio < 0.5) {
      warnings.push({
        metric: "Sale Price",
        value: ratio,
        message: "Sale price is less than half of purchase price.",
        severity: "danger",
      });
    }
  }

  // DSCR
  if (metrics.dscr > 0 && metrics.dscr < 1.0) {
    warnings.push({
      metric: "DSCR",
      value: metrics.dscr,
      message: "DSCR below 1.0 means NOI does not cover debt service.",
      severity: "danger",
    });
  }

  // Equity Multiple
  if (metrics.equityMultiple < 1) {
    warnings.push({
      metric: "Equity Multiple",
      value: metrics.equityMultiple,
      message: "Equity multiple below 1.0x indicates loss of principal.",
      severity: "danger",
    });
  }
  if (metrics.equityMultiple > 10) {
    warnings.push({
      metric: "Equity Multiple",
      value: metrics.equityMultiple,
      message: "Equity multiple over 10x is exceptional. Verify inputs.",
      severity: "caution",
    });
  }

  // Breakeven Occupancy
  if (metrics.breakevenOccupancy > 100) {
    warnings.push({
      metric: "Breakeven Occupancy",
      value: metrics.breakevenOccupancy,
      message: "Breakeven occupancy exceeds 100%. Property cannot break even.",
      severity: "danger",
    });
  }

  return warnings;
}

// ==================== SAFE VALUE FORMATTERS ====================

/**
 * Format a metric value, returning "N/A" for invalid values
 */
export function safeFormatPercent(value: number, decimals: number = 2): string {
  if (!isFinite(value) || isNaN(value)) return "N/A";
  return `${value.toFixed(decimals)}%`;
}

export function safeFormatCurrency(value: number): string {
  if (!isFinite(value) || isNaN(value)) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function safeFormatMultiple(value: number): string {
  if (!isFinite(value) || isNaN(value)) return "N/A";
  return `${value.toFixed(2)}x`;
}

export function safeFormatDSCR(value: number, hasDebt: boolean): string {
  if (!hasDebt) return "N/A (No Debt)";
  if (!isFinite(value) || isNaN(value)) return "N/A";
  return value.toFixed(2);
}
