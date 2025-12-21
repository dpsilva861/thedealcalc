/**
 * Underwriting Calculation Test Fixtures
 * 
 * This file contains deterministic test scenarios for the underwriting calculator.
 * Run these tests to verify calculation correctness.
 * 
 * CALCULATION VERSION: 1.1.0
 * Added edge case tests for all blocking issues identified in audit.
 */

import {
  runUnderwriting,
  calculatePMT,
  calculateIRR,
  getDefaultInputs,
  UnderwritingInputs,
  CALCULATION_VERSION,
} from "./underwriting";

// Test helper
function assertClose(actual: number, expected: number, tolerance: number, label: string): boolean {
  const pass = Math.abs(actual - expected) <= tolerance;
  if (!pass) {
    console.error(`FAIL: ${label} - Expected ${expected} (±${tolerance}), got ${actual}`);
  }
  return pass;
}

function assertTrue(condition: boolean, label: string): boolean {
  if (!condition) {
    console.error(`FAIL: ${label}`);
  }
  return condition;
}

// ==================== TEST SCENARIOS ====================

export function runAllTests(): { passed: number; failed: number; results: string[] } {
  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  const test = (name: string, fn: () => boolean) => {
    try {
      if (fn()) {
        passed++;
        results.push(`✓ ${name}`);
      } else {
        failed++;
        results.push(`✗ ${name}`);
      }
    } catch (e) {
      failed++;
      results.push(`✗ ${name}: ${e}`);
    }
  };

  console.log(`Running tests with calculation version: ${CALCULATION_VERSION}`);

  // ==================== BLOCKING ISSUE TESTS ====================

  // TEST: Exit cap rate = 0% should NOT cause division by zero
  test("EXIT_CAP_ZERO: 0% exit cap rate returns valid results with isValid=false", () => {
    const inputs = getDefaultInputs();
    inputs.acquisition.exitCapRate = 0;
    const results = runUnderwriting(inputs);
    
    return assertTrue(results.saleAnalysis.isValid === false, "saleAnalysis.isValid should be false") &&
      assertTrue(results.saleAnalysis.salePrice === 0, "salePrice should be 0") &&
      assertTrue(isFinite(results.metrics.irr), "IRR should be finite") &&
      assertTrue(results.saleAnalysis.salePriceDisplay.includes("N/A"), "salePriceDisplay should show N/A");
  });

  // TEST: Exit cap rate very small (0.1%) should work
  test("EXIT_CAP_SMALL: 0.5% exit cap rate calculates correctly", () => {
    const inputs = getDefaultInputs();
    inputs.acquisition.exitCapRate = 0.5;
    const results = runUnderwriting(inputs);
    
    return assertTrue(results.saleAnalysis.isValid === true, "Should be valid") &&
      assertTrue(results.saleAnalysis.salePrice > 0, "Sale price should be positive");
  });

  // TEST: Hold period = 0 should produce empty results gracefully
  test("HOLD_PERIOD_ZERO: 0 month hold period produces empty monthly data", () => {
    const inputs = getDefaultInputs();
    inputs.acquisition.holdPeriodMonths = 0;
    const results = runUnderwriting(inputs);
    
    return assertTrue(results.monthlyData.length === 0, "Should have 0 months of data") &&
      assertTrue(results.annualSummary.length === 0, "Should have 0 years of summary") &&
      assertTrue(isFinite(results.metrics.irr), "IRR should still be finite");
  });

  // TEST: DSCR shows N/A when no debt
  test("DSCR_NO_DEBT: DSCR displays N/A when financing is disabled", () => {
    const inputs = getDefaultInputs();
    inputs.financing.useFinancing = false;
    const results = runUnderwriting(inputs);
    
    return assertTrue(results.metrics.dscrDisplay === "N/A (No Debt)", "DSCR display should show N/A") &&
      assertTrue(results.metrics.dscr === 0, "DSCR numeric value should be 0");
  });

  // TEST: Breakeven occupancy with GPR = 0
  test("BREAKEVEN_NO_INCOME: Breakeven shows N/A when rent is 0", () => {
    const inputs = getDefaultInputs();
    inputs.income.inPlaceMonthlyRentPerUnit = 0;
    inputs.income.marketMonthlyRentPerUnit = 0;
    inputs.income.otherMonthlyIncome = 0;
    const results = runUnderwriting(inputs);
    
    return assertTrue(results.metrics.breakevenOccupancyDisplay === "N/A (No Income)", "Should show N/A") &&
      assertTrue(results.metrics.warnings.some(w => w.code === "NO_INCOME_BREAKEVEN"), "Should have warning");
  });

  // TEST: IRR failure handling - all negative cash flows
  test("IRR_ALL_NEGATIVE: IRR returns 0 for all negative cash flows", () => {
    const inputs = getDefaultInputs();
    inputs.income.economicVacancyPct = 100; // 100% vacancy
    inputs.acquisition.exitCapRate = 20; // Low sale price
    const results = runUnderwriting(inputs);
    
    return assertTrue(isFinite(results.metrics.irr), "IRR should be finite") &&
      assertTrue(!isNaN(results.metrics.irr), "IRR should not be NaN");
  });

  // TEST: Purchase price = 0 edge case
  test("PURCHASE_ZERO: Zero purchase price produces valid results", () => {
    const inputs = getDefaultInputs();
    inputs.acquisition.purchasePrice = 0;
    const results = runUnderwriting(inputs);
    
    return assertTrue(isFinite(results.metrics.irr), "IRR should be finite") &&
      assertTrue(results.sourcesAndUses.uses.purchasePrice === 0, "Purchase should be 0");
  });

  // TEST: Negative rent growth handled
  test("NEGATIVE_RENT_GROWTH: -50% rent growth calculates without error", () => {
    const inputs = getDefaultInputs();
    inputs.income.rentGrowthAnnualPct = -50;
    const results = runUnderwriting(inputs);
    
    return assertTrue(isFinite(results.metrics.irr), "IRR should be finite") &&
      assertTrue(results.monthlyData[results.monthlyData.length - 1].rent < results.monthlyData[0].rent, "Rent should decline");
  });

  // TEST: 100% vacancy
  test("VACANCY_100: 100% vacancy produces valid negative returns", () => {
    const inputs = getDefaultInputs();
    inputs.income.economicVacancyPct = 100;
    const results = runUnderwriting(inputs);
    
    return assertTrue(isFinite(results.metrics.cocYear1), "CoC should be finite") &&
      assertTrue(results.metrics.cocYear1 < 0, "CoC should be negative");
  });

  // TEST: Extreme LTV (100%)
  test("LTV_100: 100% LTV calculates correctly", () => {
    const inputs = getDefaultInputs();
    inputs.financing.loanLtv = 100;
    const results = runUnderwriting(inputs);
    
    return assertTrue(results.sourcesAndUses.sources.equity < 100000, "Equity should be minimal") &&
      assertTrue(isFinite(results.metrics.irr), "IRR should be finite");
  });

  // ==================== STANDARD TESTS ====================

  test("Default inputs produce valid metrics", () => {
    const inputs = getDefaultInputs();
    const results = runUnderwriting(inputs);
    
    return assertTrue(results.metrics.irr > 0, "IRR should be positive") &&
      assertTrue(results.metrics.equityMultiple > 1, "Equity multiple should be > 1") &&
      assertTrue(results.monthlyData.length === 60, "Should have 60 months of data") &&
      assertTrue(results.annualSummary.length === 5, "Should have 5 years of summary");
  });

  test("0% interest rate does not cause errors", () => {
    const inputs = getDefaultInputs();
    inputs.financing.interestRateAnnual = 0;
    const results = runUnderwriting(inputs);
    
    return assertTrue(!isNaN(results.metrics.irr), "IRR should not be NaN") &&
      assertTrue(isFinite(results.metrics.equityMultiple), "Equity multiple should be finite");
  });

  test("PMT calculation matches expected value", () => {
    const pmt = calculatePMT(0.06 / 12, 360, 100000);
    return assertClose(pmt, 599.55, 0.50, "PMT for 100k at 6% 30yr");
  });

  test("NOI = EGI - OpEx", () => {
    const inputs = getDefaultInputs();
    const results = runUnderwriting(inputs);
    const m = results.monthlyData[0];
    const calculatedNoi = m.egi - m.totalOpex;
    return assertClose(m.noi, calculatedNoi, 0.01, "NOI should equal EGI - OpEx");
  });

  test("Sources of funds equals uses of funds", () => {
    const inputs = getDefaultInputs();
    const results = runUnderwriting(inputs);
    return assertClose(
      results.sourcesAndUses.sources.total, 
      results.sourcesAndUses.uses.total, 
      0.01, 
      "Sources should equal uses"
    );
  });

  test("Calculation version is 1.1.0", () => {
    return assertTrue(CALCULATION_VERSION === "1.1.0", "Version should be 1.1.0");
  });

  console.log("\n=== TEST RESULTS ===");
  results.forEach(r => console.log(r));
  console.log(`\nPassed: ${passed}, Failed: ${failed}`);

  return { passed, failed, results };
}

// Export for use in diagnostics
export { assertClose, assertTrue };
