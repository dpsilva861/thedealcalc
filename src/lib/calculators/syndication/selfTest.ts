// ============================================================
// Syndication Self-Test Module
// Validates calculation engine with real function calls
// ============================================================

import {
  SyndicationInputs,
  DEFAULT_SYNDICATION_INPUTS,
} from "./types";
import { runSyndicationAnalysis } from "./index";
import { validateSyndicationInputs } from "./validation";
import { calculateAmortizingPayment } from "./debt";

export interface SelfTestCheck {
  name: string;
  pass: boolean;
  expected?: number;
  actual?: number;
  note?: string;
}

const approx = (a: number, b: number, tol = 0.01) => Math.abs(a - b) <= tol;

/**
 * Run comprehensive self-tests on the syndication engine
 */
export function runSyndicationSelfTest(inputs?: SyndicationInputs): SelfTestCheck[] {
  const checks: SelfTestCheck[] = [];

  // Test 1: Default inputs pass validation
  try {
    const validation = validateSyndicationInputs(DEFAULT_SYNDICATION_INPUTS);
    checks.push({
      name: "Default inputs pass validation",
      pass: validation.isValid,
      note: validation.isValid ? "No errors" : validation.errors.map(e => e.message).join("; "),
    });
  } catch (e: any) {
    checks.push({ name: "Default inputs pass validation", pass: false, note: e?.message });
  }

  // Test 2: Engine runs without throwing
  let results: ReturnType<typeof runSyndicationAnalysis> | null = null;
  const testInputs = inputs || DEFAULT_SYNDICATION_INPUTS;
  try {
    results = runSyndicationAnalysis(testInputs);
    checks.push({
      name: "Engine runs without error",
      pass: true,
      note: `Generated ${results.cash_flows.length} periods`,
    });
  } catch (e: any) {
    checks.push({ name: "Engine runs without error", pass: false, note: e?.message });
    return checks; // Can't continue without results
  }

  const { sources_and_uses: su, cash_flows: cfs, waterfall_allocations: wa, waterfall_summary: ws, metrics } = results;

  // Test 3: Sources = Uses balance
  checks.push({
    name: "Sources = Uses balance",
    pass: approx(su.total_sources, su.total_uses),
    expected: su.total_uses,
    actual: su.total_sources,
  });

  // Test 4: Debt payment calculation (if amortizing)
  if (testInputs.debt.financing_type !== "none" && cfs.length > 1) {
    const debtService = cfs[1].debt_service;
    checks.push({
      name: "Debt service is positive",
      pass: debtService > 0,
      actual: debtService,
      note: "First operating period should have debt payment",
    });
  } else {
    checks.push({
      name: "Debt service check (no debt)",
      pass: true,
      note: "Skipped - no debt configured",
    });
  }

  // Test 5: Loan balance monotonically decreasing during amortization
  if (testInputs.debt.financing_type === "amortizing" && cfs.length > 12) {
    const balances = cfs.slice(1, 13).map((cf) => cf.loan_balance_ending);
    let monotonic = true;
    for (let i = 1; i < balances.length; i++) {
      if (balances[i] > balances[i - 1] + 0.01) monotonic = false;
    }
    checks.push({
      name: "Loan balance decreases (amortizing)",
      pass: monotonic,
      note: monotonic ? "Balance decreases as expected" : "Balance increased unexpectedly",
    });
  } else {
    checks.push({
      name: "Loan balance check",
      pass: true,
      note: "Skipped (not fully amortizing or short term)",
    });
  }

  // Test 6: NOI = EGI - OpEx - PM Fee
  if (cfs.length > 1) {
    const p = cfs[1];
    const expectedNOI = p.effective_gross_income - p.operating_expenses - p.property_management_fee;
    checks.push({
      name: "NOI = EGI - OpEx - PM Fee",
      pass: approx(p.noi, expectedNOI),
      expected: expectedNOI,
      actual: p.noi,
    });
  }

  // Test 7: ROC never exceeds unreturned capital
  let rocViolation = false;
  for (let i = 1; i < wa.length; i++) {
    const a = wa[i];
    const prevAlloc = wa[i - 1];
    if (a.roc_lp > prevAlloc.lp_unreturned_capital + 0.01) {
      rocViolation = true;
      break;
    }
  }
  checks.push({
    name: "LP ROC ≤ unreturned capital",
    pass: !rocViolation,
    note: rocViolation ? "ROC exceeded unreturned capital" : "ROC correctly capped",
  });

  // Test 8: Pref accrual formula
  if (wa.length > 1) {
    const a = wa[1];
    const prevUnreturned = wa[0].lp_unreturned_capital;
    const monthlyRate = testInputs.waterfall.pref_rate_annual / 12;
    const expectedAccrual = prevUnreturned * monthlyRate;
    checks.push({
      name: "Pref accrual = capital × monthly rate",
      pass: approx(a.pref_accrual_lp, expectedAccrual, 10),
      expected: expectedAccrual,
      actual: a.pref_accrual_lp,
    });
  }

  // Test 9: Cash conservation
  const totalCashAvailable = cfs.reduce((sum, cf) => sum + cf.cash_available_for_distribution, 0);
  const totalDistributed = ws.lp_total_distributions + ws.gp_total_distributions;
  checks.push({
    name: "Cash conservation (dist ≈ available)",
    pass: approx(totalCashAvailable, totalDistributed, 100),
    expected: totalCashAvailable,
    actual: totalDistributed,
  });

  // Test 10: LP Equity Multiple calculation
  const calculatedEM = ws.lp_total_contributions > 0
    ? ws.lp_total_distributions / ws.lp_total_contributions
    : 0;
  checks.push({
    name: "LP EM = distributions / contributions",
    pass: approx(ws.lp_equity_multiple, calculatedEM, 0.001),
    expected: calculatedEM,
    actual: ws.lp_equity_multiple,
  });

  // Test 11: Tier splits sum to 100%
  let tierSplitValid = true;
  for (const tier of testInputs.waterfall.tiers) {
    if (Math.abs(tier.lp_split + tier.gp_split - 1.0) > 0.01) {
      tierSplitValid = false;
      break;
    }
  }
  checks.push({
    name: "All tier splits sum to 100%",
    pass: tierSplitValid,
    note: tierSplitValid ? "All tiers valid" : "Some tiers have invalid splits",
  });

  // Test 12: Metrics are finite
  checks.push({
    name: "Metrics are finite",
    pass:
      isFinite(metrics.levered_irr_lp) &&
      isFinite(metrics.equity_multiple_lp) &&
      metrics.equity_multiple_lp >= 0,
    note: `IRR: ${(metrics.levered_irr_lp * 100).toFixed(2)}%, EM: ${metrics.equity_multiple_lp.toFixed(2)}x`,
  });

  // Test 13: No negative distributions
  let hasNegativeDist = false;
  for (const a of wa) {
    if (a.total_distributed_lp < 0 || a.total_distributed_gp < 0) {
      hasNegativeDist = true;
      break;
    }
  }
  checks.push({
    name: "No negative distributions",
    pass: !hasNegativeDist,
    note: hasNegativeDist ? "Found negative distribution" : "All distributions ≥ 0",
  });

  // Test 14: Amortizing payment formula verification
  const testPayment = calculateAmortizingPayment(100000, 0.06, 360);
  const expectedPayment = 599.55; // Standard 30-year at 6%
  checks.push({
    name: "Amortizing payment formula",
    pass: approx(testPayment, expectedPayment, 1),
    expected: expectedPayment,
    actual: testPayment,
  });

  return checks;
}

/**
 * Run edge case tests
 */
export function runEdgeCaseTests(): SelfTestCheck[] {
  const checks: SelfTestCheck[] = [];

  // Test: No leverage case
  try {
    const noDebtInputs = {
      ...DEFAULT_SYNDICATION_INPUTS,
      debt: {
        ...DEFAULT_SYNDICATION_INPUTS.debt,
        financing_type: "none" as const,
      },
    };
    const results = runSyndicationAnalysis(noDebtInputs);
    const allDebtServiceZero = results.cash_flows.every(cf => cf.debt_service === 0);
    checks.push({
      name: "No leverage: debt service = 0",
      pass: allDebtServiceZero,
      note: allDebtServiceZero ? "All periods have zero debt service" : "Some periods have non-zero debt service",
    });
  } catch (e: any) {
    checks.push({ name: "No leverage case", pass: false, note: e?.message });
  }

  // Test: Very short hold (1 month)
  try {
    const shortHoldInputs = {
      ...DEFAULT_SYNDICATION_INPUTS,
      hold_period_months: 1,
      exit: {
        ...DEFAULT_SYNDICATION_INPUTS.exit,
        sale_month: 1,
      },
    };
    const results = runSyndicationAnalysis(shortHoldInputs);
    checks.push({
      name: "Short hold (1 month) runs",
      pass: results.cash_flows.length === 2, // Period 0 + Period 1
      actual: results.cash_flows.length,
      expected: 2,
    });
  } catch (e: any) {
    checks.push({ name: "Short hold case", pass: false, note: e?.message });
  }

  return checks;
}

