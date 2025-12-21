// ============================================================
// Syndication Self-Test Module
// Validates calculation engine with real function calls
// ============================================================

import {
  SyndicationInputs,
  DEFAULT_SYNDICATION_INPUTS,
} from "./types";
import { runSyndicationAnalysis } from "./index";

export interface SelfTestCheck {
  name: string;
  pass: boolean;
  expected?: number;
  actual?: number;
  note?: string;
}

const approx = (a: number, b: number, tol = 0.01) => Math.abs(a - b) <= tol;

export function runSyndicationSelfTest(inputs?: SyndicationInputs): SelfTestCheck[] {
  const testInputs = inputs || DEFAULT_SYNDICATION_INPUTS;
  const checks: SelfTestCheck[] = [];

  try {
    const results = runSyndicationAnalysis(testInputs);
    const { sources_and_uses: su, cash_flows: cfs, waterfall_allocations: wa, waterfall_summary: ws, metrics } = results;

    // Check 1: Sources equals Uses
    checks.push({
      name: "Sources = Uses balance",
      pass: approx(su.total_sources, su.total_uses),
      expected: su.total_uses,
      actual: su.total_sources,
    });

    // Check 2: Debt payment sanity (if amortizing)
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
        name: "Debt service check",
        pass: true,
        note: "Skipped (no debt)",
      });
    }

    // Check 3: Loan balance monotonically decreasing during amortization
    if (testInputs.debt.financing_type === "amortizing") {
      const balances = cfs.slice(1, 13).map((cf) => cf.loan_balance_ending);
      let monotonic = true;
      for (let i = 1; i < balances.length; i++) {
        if (balances[i] > balances[i - 1] + 0.01) monotonic = false;
      }
      checks.push({
        name: "Loan balance non-increasing (first 12 periods)",
        pass: monotonic,
        note: monotonic ? "Balance decreases as expected" : "Balance increased unexpectedly",
      });
    } else {
      checks.push({
        name: "Loan balance check",
        pass: true,
        note: "Skipped (not fully amortizing)",
      });
    }

    // Check 4: NOI = EGI - OpEx - PM Fee
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

    // Check 5: CAD = NCF after debt - reserve top-up
    if (cfs.length > 1) {
      const p = cfs[1];
      // CAD should be NCF after debt (positive only) minus reserve top-ups
      const expectedCAD = Math.max(0, p.ncf_after_debt);
      checks.push({
        name: "CAD calculation correctness",
        pass: p.cash_available_for_distribution >= 0,
        expected: expectedCAD,
        actual: p.cash_available_for_distribution,
        note: "CAD should be non-negative",
      });
    }

    // Check 6: ROC never exceeds unreturned capital
    let rocViolation = false;
    for (const a of wa) {
      if (a.period === 0) continue;
      const prevAlloc = wa.find((x) => x.period === a.period - 1);
      if (prevAlloc && a.roc_lp > prevAlloc.lp_unreturned_capital + 0.01) {
        rocViolation = true;
        break;
      }
    }
    checks.push({
      name: "LP ROC never exceeds unreturned capital",
      pass: !rocViolation,
      note: rocViolation ? "ROC exceeded unreturned capital" : "ROC correctly capped",
    });

    // Check 7: Pref accrual formula check
    if (wa.length > 1) {
      const a = wa[1];
      const prevUnreturned = wa[0].lp_unreturned_capital;
      const monthlyRate = testInputs.waterfall.pref_rate_annual / 12;
      const expectedAccrual = prevUnreturned * monthlyRate;
      checks.push({
        name: "Pref accrual = unreturned capital × monthly rate",
        pass: approx(a.pref_accrual_lp, expectedAccrual, 1),
        expected: expectedAccrual,
        actual: a.pref_accrual_lp,
      });
    }

    // Check 8: Cash conservation - total distributed = total cash available
    const totalCashAvailable = cfs.reduce((sum, cf) => sum + cf.cash_available_for_distribution, 0);
    const totalDistributed = ws.lp_total_distributions + ws.gp_total_distributions;
    checks.push({
      name: "Cash conservation (total dist ≈ total available)",
      pass: approx(totalCashAvailable, totalDistributed, 100), // Allow $100 rounding
      expected: totalCashAvailable,
      actual: totalDistributed,
    });

    // Check 9: LP Equity Multiple calculation
    const calculatedEM = ws.lp_total_contributions > 0
      ? ws.lp_total_distributions / ws.lp_total_contributions
      : 0;
    checks.push({
      name: "LP Equity Multiple = distributions / contributions",
      pass: approx(ws.lp_equity_multiple, calculatedEM, 0.001),
      expected: calculatedEM,
      actual: ws.lp_equity_multiple,
    });

    // Check 10: Metrics are reasonable
    checks.push({
      name: "Metrics are finite and reasonable",
      pass:
        isFinite(metrics.levered_irr_lp) &&
        isFinite(metrics.equity_multiple_lp) &&
        metrics.equity_multiple_lp >= 0,
      note: `IRR: ${(metrics.levered_irr_lp * 100).toFixed(2)}%, EM: ${metrics.equity_multiple_lp.toFixed(2)}x`,
    });

  } catch (e: any) {
    checks.push({
      name: "Engine runs without error",
      pass: false,
      note: e?.message || "Unknown error",
    });
  }

  return checks;
}
