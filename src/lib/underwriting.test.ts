/**
 * Underwriting Calculation Test Fixtures
 * 
 * This file contains deterministic test scenarios for the underwriting calculator.
 * Run these tests to verify calculation correctness.
 * 
 * To run: These are assertion-based tests that can be verified manually or integrated
 * into a test runner like Vitest or Jest.
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

  // TEST 1: Default inputs produce valid results
  test("Default inputs produce valid metrics", () => {
    const inputs = getDefaultInputs();
    const results = runUnderwriting(inputs);
    
    return assertTrue(results.metrics.irr > 0, "IRR should be positive") &&
      assertTrue(results.metrics.equityMultiple > 1, "Equity multiple should be > 1") &&
      assertTrue(results.monthlyData.length === 60, "Should have 60 months of data") &&
      assertTrue(results.annualSummary.length === 5, "Should have 5 years of summary");
  });

  // TEST 2: 0% interest rate edge case
  test("0% interest rate does not cause errors", () => {
    const inputs = getDefaultInputs();
    inputs.financing.interestRateAnnual = 0;
    const results = runUnderwriting(inputs);
    
    return assertTrue(!isNaN(results.metrics.irr), "IRR should not be NaN") &&
      assertTrue(isFinite(results.metrics.equityMultiple), "Equity multiple should be finite");
  });

  // TEST 3: 100% down payment (no financing)
  test("100% down payment (no financing)", () => {
    const inputs = getDefaultInputs();
    inputs.financing.useFinancing = false;
    const results = runUnderwriting(inputs);
    
    // With no debt, DSCR should be 0 (no debt service)
    return assertTrue(results.metrics.dscr === 0, "DSCR should be 0 with no debt") &&
      assertTrue(results.sourcesAndUses.sources.loanAmount === 0, "Loan should be 0") &&
      assertTrue(results.metrics.totalEquityInvested > 0, "Equity invested should be positive");
  });

  // TEST 4: High vacancy (90%)
  test("High vacancy (90%) produces low/negative returns", () => {
    const inputs = getDefaultInputs();
    inputs.income.economicVacancyPct = 90;
    const results = runUnderwriting(inputs);
    
    // High vacancy should hurt returns significantly
    return assertTrue(results.metrics.cocYear1 < 0, "Year 1 CoC should be negative with 90% vacancy");
  });

  // TEST 5: Negative rent growth
  test("Negative rent growth handled correctly", () => {
    const inputs = getDefaultInputs();
    inputs.income.rentGrowthAnnualPct = -5; // 5% annual decline
    const results = runUnderwriting(inputs);
    
    // Later months should have lower rent than earlier months
    const firstMonthRent = results.monthlyData[0].rent;
    const lastMonthRent = results.monthlyData[results.monthlyData.length - 1].rent;
    
    return assertTrue(lastMonthRent < firstMonthRent, "Rent should decline with negative growth");
  });

  // TEST 6: Year 1 sale (12 month hold)
  test("Short hold period (12 months)", () => {
    const inputs = getDefaultInputs();
    inputs.acquisition.holdPeriodMonths = 12;
    const results = runUnderwriting(inputs);
    
    return assertTrue(results.monthlyData.length === 12, "Should have 12 months") &&
      assertTrue(results.annualSummary.length === 1, "Should have 1 year summary");
  });

  // TEST 7: PMT calculation verification
  test("PMT calculation matches expected value", () => {
    // $100,000 loan at 6% for 30 years = ~$599.55/month
    const pmt = calculatePMT(0.06 / 12, 360, 100000);
    return assertClose(pmt, 599.55, 0.50, "PMT for 100k at 6% 30yr");
  });

  // TEST 8: IRR edge cases
  test("IRR returns 0 for no positive cash flows", () => {
    const cashFlows = [-1000, -100, -100, -100];
    const irr = calculateIRR(cashFlows);
    return assertTrue(irr === 0, "IRR should be 0 when all cash flows are negative");
  });

  test("IRR returns 0 for positive initial investment", () => {
    const cashFlows = [1000, 100, 100];
    const irr = calculateIRR(cashFlows);
    return assertTrue(irr === 0, "IRR should be 0 when initial flow is positive");
  });

  // TEST 9: NOI calculation consistency
  test("NOI = EGI - OpEx", () => {
    const inputs = getDefaultInputs();
    const results = runUnderwriting(inputs);
    
    // Check first month
    const m = results.monthlyData[0];
    const calculatedNoi = m.egi - m.totalOpex;
    
    return assertClose(m.noi, calculatedNoi, 0.01, "NOI should equal EGI - OpEx");
  });

  // TEST 10: Sources = Uses
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

  // TEST 11: CoC calculation verification
  test("Cash-on-Cash = Annual Cash Flow / Equity Invested", () => {
    const inputs = getDefaultInputs();
    inputs.renovation.renoDurationMonths = 0; // No reno period for cleaner calc
    inputs.renovation.leaseUpMonthsAfterReno = 0;
    const results = runUnderwriting(inputs);
    
    const year1Summary = results.annualSummary[0];
    const expectedCoc = (year1Summary.cashFlow / results.metrics.totalEquityInvested) * 100;
    
    return assertClose(year1Summary.coc, expectedCoc, 0.01, "CoC calculation");
  });

  // TEST 12: Sensitivity tables exist and have correct structure
  test("Sensitivity tables have correct structure", () => {
    const inputs = getDefaultInputs();
    const results = runUnderwriting(inputs);
    
    return assertTrue(results.sensitivityTables.rent.length === 5, "Rent sensitivity should have 5 rows") &&
      assertTrue(results.sensitivityTables.exitCap.length === 5, "Exit cap sensitivity should have 5 rows") &&
      assertTrue(results.sensitivityTables.renoBudget.length === 4, "Reno budget sensitivity should have 4 rows") &&
      assertTrue(results.sensitivityTables.rent[2].label === "Base", "Base case should be in middle");
  });

  // TEST 13: Loan balance decreases over time (amortizing loan)
  test("Loan balance decreases for amortizing loan", () => {
    const inputs = getDefaultInputs();
    inputs.financing.interestOnlyMonths = 0; // Start amortizing immediately
    const results = runUnderwriting(inputs);
    
    const firstBalance = results.monthlyData[0].loanBalance;
    const lastBalance = results.monthlyData[results.monthlyData.length - 1].loanBalance;
    
    return assertTrue(lastBalance < firstBalance, "Loan balance should decrease");
  });

  // TEST 14: Interest-only period has no principal payment
  test("Interest-only period has zero principal payment", () => {
    const inputs = getDefaultInputs();
    inputs.financing.interestOnlyMonths = 12;
    const results = runUnderwriting(inputs);
    
    // Check month 6 (should be IO)
    const ioMonth = results.monthlyData[5];
    
    return assertTrue(ioMonth.principalPayment === 0, "Principal should be 0 during IO period");
  });

  // TEST 15: Large property test (100 units)
  test("Large property (100 units) calculates correctly", () => {
    const inputs = getDefaultInputs();
    inputs.income.unitCount = 100;
    inputs.acquisition.purchasePrice = 10000000;
    const results = runUnderwriting(inputs);
    
    return assertTrue(results.monthlyData[0].gpr > 100000, "GPR should be substantial for 100 units") &&
      assertTrue(!isNaN(results.metrics.irr), "IRR should not be NaN");
  });

  console.log("\n=== TEST RESULTS ===");
  results.forEach(r => console.log(r));
  console.log(`\nPassed: ${passed}, Failed: ${failed}`);

  return { passed, failed, results };
}

// Export for use in diagnostics
export { assertClose, assertTrue };
