// ============================================================
// Syndication Input Validation
// Validates all inputs before running analysis
// ============================================================

import { SyndicationInputs, SyndicationWarning } from "./types";

export interface ValidationResult {
  isValid: boolean;
  errors: SyndicationWarning[];
  warnings: SyndicationWarning[];
}

/**
 * Validate all syndication inputs
 * Returns errors (blocking) and warnings (non-blocking)
 */
export function validateSyndicationInputs(inputs: SyndicationInputs): ValidationResult {
  const errors: SyndicationWarning[] = [];
  const warnings: SyndicationWarning[] = [];

  // === ACQUISITION VALIDATION ===
  if (inputs.acquisition.purchase_price <= 0) {
    errors.push({
      code: "INVALID_PURCHASE_PRICE",
      message: "Purchase price must be greater than zero",
      severity: "error",
      field: "acquisition.purchase_price",
    });
  }

  if (inputs.acquisition.closing_costs_pct < 0 || inputs.acquisition.closing_costs_pct > 0.2) {
    warnings.push({
      code: "UNUSUAL_CLOSING_COSTS",
      message: "Closing costs percentage seems unusual (typical range: 0-20%)",
      severity: "warning",
      field: "acquisition.closing_costs_pct",
    });
  }

  if (inputs.acquisition.capex_budget_total < 0) {
    errors.push({
      code: "NEGATIVE_CAPEX",
      message: "CapEx budget cannot be negative",
      severity: "error",
      field: "acquisition.capex_budget_total",
    });
  }

  // === DEBT VALIDATION ===
  if (inputs.debt.financing_type !== "none") {
    if (inputs.debt.interest_rate_annual <= 0) {
      errors.push({
        code: "INVALID_INTEREST_RATE",
        message: "Interest rate must be greater than zero",
        severity: "error",
        field: "debt.interest_rate_annual",
      });
    }

    if (inputs.debt.interest_rate_annual > 0.25) {
      warnings.push({
        code: "HIGH_INTEREST_RATE",
        message: "Interest rate above 25% is unusually high",
        severity: "warning",
        field: "debt.interest_rate_annual",
      });
    }

    if (inputs.debt.ltv_or_ltc_pct > 0.95) {
      warnings.push({
        code: "HIGH_LTV",
        message: "LTV above 95% is rarely achievable in commercial lending",
        severity: "warning",
        field: "debt.ltv_or_ltc_pct",
      });
    }

    if (inputs.debt.amort_years <= 0 && inputs.debt.financing_type === "amortizing") {
      errors.push({
        code: "INVALID_AMORT_TERM",
        message: "Amortization term must be greater than zero for amortizing loans",
        severity: "error",
        field: "debt.amort_years",
      });
    }

    if (inputs.debt.loan_term_months <= 0) {
      errors.push({
        code: "INVALID_LOAN_TERM",
        message: "Loan term must be greater than zero",
        severity: "error",
        field: "debt.loan_term_months",
      });
    }
  }

  // === EQUITY VALIDATION ===
  const totalEquityPct = inputs.equity.lp_equity_pct + inputs.equity.gp_equity_pct;
  if (Math.abs(totalEquityPct - 1.0) > 0.01) {
    errors.push({
      code: "EQUITY_SPLIT_INVALID",
      message: `LP + GP equity percentages must equal 100% (currently ${(totalEquityPct * 100).toFixed(1)}%)`,
      severity: "error",
      field: "equity.lp_equity_pct",
    });
  }

  if (inputs.equity.lp_equity_pct < 0 || inputs.equity.gp_equity_pct < 0) {
    errors.push({
      code: "NEGATIVE_EQUITY",
      message: "Equity percentages cannot be negative",
      severity: "error",
      field: "equity.lp_equity_pct",
    });
  }

  // === PROFORMA VALIDATION ===
  if (inputs.proforma.vacancy_rate < 0 || inputs.proforma.vacancy_rate > 1) {
    errors.push({
      code: "INVALID_VACANCY",
      message: "Vacancy rate must be between 0% and 100%",
      severity: "error",
      field: "proforma.vacancy_rate",
    });
  }

  if (inputs.proforma.vacancy_rate < 0.03) {
    warnings.push({
      code: "LOW_VACANCY",
      message: "Vacancy below 3% is aggressive for most markets",
      severity: "warning",
      field: "proforma.vacancy_rate",
    });
  }

  if (inputs.proforma.rent_growth_annual > 0.10) {
    warnings.push({
      code: "HIGH_RENT_GROWTH",
      message: "Rent growth above 10% annually is aggressive",
      severity: "warning",
      field: "proforma.rent_growth_annual",
    });
  }

  if (inputs.proforma.expense_growth_annual < 0) {
    warnings.push({
      code: "NEGATIVE_EXPENSE_GROWTH",
      message: "Expense growth is typically positive (inflation)",
      severity: "warning",
      field: "proforma.expense_growth_annual",
    });
  }

  // === HOLD PERIOD VALIDATION ===
  if (inputs.hold_period_months < 1) {
    errors.push({
      code: "INVALID_HOLD_PERIOD",
      message: "Hold period must be at least 1 month",
      severity: "error",
      field: "hold_period_months",
    });
  }

  if (inputs.hold_period_months > 360) {
    warnings.push({
      code: "LONG_HOLD_PERIOD",
      message: "Hold period exceeds 30 years - projections may be unreliable",
      severity: "warning",
      field: "hold_period_months",
    });
  }

  // === EXIT VALIDATION ===
  if (inputs.exit.sale_month > inputs.hold_period_months) {
    warnings.push({
      code: "SALE_AFTER_HOLD",
      message: "Sale month is after hold period end",
      severity: "warning",
      field: "exit.sale_month",
    });
  }

  if (inputs.exit.exit_mode === "cap_rate" && inputs.exit.exit_cap_rate <= 0) {
    errors.push({
      code: "INVALID_EXIT_CAP",
      message: "Exit cap rate must be greater than zero",
      severity: "error",
      field: "exit.exit_cap_rate",
    });
  }

  if (inputs.exit.sale_cost_pct > 0.10) {
    warnings.push({
      code: "HIGH_SALE_COSTS",
      message: "Sale costs above 10% are unusually high",
      severity: "warning",
      field: "exit.sale_cost_pct",
    });
  }

  // === WATERFALL VALIDATION ===
  if (inputs.waterfall.pref_rate_annual < 0) {
    errors.push({
      code: "NEGATIVE_PREF_RATE",
      message: "Preferred return rate cannot be negative",
      severity: "error",
      field: "waterfall.pref_rate_annual",
    });
  }

  // Validate tier splits
  for (let i = 0; i < inputs.waterfall.tiers.length; i++) {
    const tier = inputs.waterfall.tiers[i];
    const totalSplit = tier.lp_split + tier.gp_split;
    if (Math.abs(totalSplit - 1.0) > 0.01) {
      errors.push({
        code: "TIER_SPLIT_INVALID",
        message: `Tier ${i + 1} splits must equal 100% (currently ${(totalSplit * 100).toFixed(1)}%)`,
        severity: "error",
        field: `waterfall.tiers[${i}]`,
      });
    }
  }

  // Check tier hurdles are ascending
  let prevHurdle = 0;
  for (let i = 0; i < inputs.waterfall.tiers.length; i++) {
    const tier = inputs.waterfall.tiers[i];
    if (tier.tier_type === "equity_multiple" || tier.tier_type === "irr") {
      if (tier.hurdle < prevHurdle && tier.hurdle !== Infinity) {
        warnings.push({
          code: "TIER_HURDLES_NOT_ASCENDING",
          message: `Tier ${i + 1} hurdle should be greater than previous tier`,
          severity: "warning",
          field: `waterfall.tiers[${i}].hurdle`,
        });
      }
      prevHurdle = tier.hurdle;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Normalize tier splits to ensure they sum to 1.0
 */
export function normalizeTierSplits(lpSplit: number, gpSplit: number): { lp: number; gp: number } {
  const total = lpSplit + gpSplit;
  if (total === 0) {
    return { lp: 0.5, gp: 0.5 };
  }
  return {
    lp: lpSplit / total,
    gp: gpSplit / total,
  };
}
