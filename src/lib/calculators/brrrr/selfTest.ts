// BRRRR Self-Test Module
// Validates calculation correctness using Preset A

import { getBRRRRPresetById } from "./presets";
import { runBRRRRAnalysis } from "./calculations";
import { BRRRRInputs } from "./types";

export interface SelfTestCheck {
  name: string;
  expected: number;
  actual: number;
  tolerance: number;
  pass: boolean;
  message?: string;
}

export interface SelfTestResult {
  pass: boolean;
  checks: SelfTestCheck[];
  presetUsed: string;
}

/**
 * Check if a value is within tolerance of expected
 */
function withinTolerance(actual: number, expected: number, tolerance: number): boolean {
  if (expected === 0) return Math.abs(actual) <= tolerance;
  const diff = Math.abs(actual - expected);
  return diff <= tolerance || diff / Math.abs(expected) <= tolerance;
}

/**
 * Run BRRRR self-test using Preset A (Typical)
 */
export function runBrrrrSelfTest(): SelfTestResult {
  const checks: SelfTestCheck[] = [];
  
  // Load Preset A (Typical BRRRR)
  const preset = getBRRRRPresetById("typical");
  
  if (!preset) {
    checks.push({
      name: "Preset Loading",
      expected: 1,
      actual: 0,
      tolerance: 0,
      pass: false,
      message: "Could not load Preset A (typical)",
    });
    return { pass: false, checks, presetUsed: "N/A" };
  }

  const inputs: BRRRRInputs = preset.inputs;

  // Validate required inputs exist
  if (!inputs.afterRepairValue?.arv || inputs.afterRepairValue.arv === 0) {
    checks.push({
      name: "ARV Input",
      expected: 1,
      actual: 0,
      tolerance: 0,
      pass: false,
      message: "Missing or zero ARV input",
    });
    return { pass: false, checks, presetUsed: preset.id };
  }

  // Run the calculation
  const results = runBRRRRAnalysis(inputs);

  // === CHECK 1: Refi Loan Amount ===
  // refiLoanAmount ≈ arv * refiLtv
  const expectedRefiLoan = inputs.afterRepairValue.arv * inputs.refinance.refiLtvPct;
  const actualRefiLoan = results.refinance.maxRefiLoan;
  const refiLoanPass = withinTolerance(actualRefiLoan, expectedRefiLoan, 0.01);
  
  checks.push({
    name: "Refi Loan Amount",
    expected: expectedRefiLoan,
    actual: actualRefiLoan,
    tolerance: 0.01,
    pass: refiLoanPass,
    message: refiLoanPass 
      ? `ARV (${inputs.afterRepairValue.arv}) × LTV (${inputs.refinance.refiLtvPct}) = ${expectedRefiLoan}`
      : `Expected ${expectedRefiLoan}, got ${actualRefiLoan}`,
  });

  // === CHECK 2: Holding Total ===
  // holdingTotal ≈ monthlyHoldingCosts * holdingMonths
  const expectedHoldingTotal = inputs.acquisition.monthlyHoldingCosts * inputs.acquisition.holdingPeriodMonths;
  const actualHoldingTotal = results.holdingPhase.totalHoldingCosts;
  const holdingPass = withinTolerance(actualHoldingTotal, expectedHoldingTotal, 0.50);
  
  checks.push({
    name: "Holding Total",
    expected: expectedHoldingTotal,
    actual: actualHoldingTotal,
    tolerance: 0.50,
    pass: holdingPass,
    message: holdingPass
      ? `Monthly (${inputs.acquisition.monthlyHoldingCosts}) × Months (${inputs.acquisition.holdingPeriodMonths}) = ${expectedHoldingTotal}`
      : `Expected ${expectedHoldingTotal}, got ${actualHoldingTotal}`,
  });

  // === CHECK 3: Effective Gross Income ===
  // egi ≈ monthlyRent * (1 - vacancyRate)
  const expectedEGI = inputs.rentalOperations.monthlyRent * (1 - inputs.rentalOperations.vacancyPct);
  const actualEGI = results.rental.effectiveGrossIncome;
  const egiPass = withinTolerance(actualEGI, expectedEGI, 0.01);
  
  checks.push({
    name: "Effective Gross Income",
    expected: expectedEGI,
    actual: actualEGI,
    tolerance: 0.01,
    pass: egiPass,
    message: egiPass
      ? `Rent (${inputs.rentalOperations.monthlyRent}) × (1 - Vacancy ${inputs.rentalOperations.vacancyPct}) = ${expectedEGI}`
      : `Expected ${expectedEGI}, got ${actualEGI}`,
  });

  // === CHECK 4: Bridge Loan Amount ===
  // bridgeLoan = purchasePrice * (1 - downPaymentPct)
  const expectedBridgeLoan = inputs.acquisition.purchasePrice * (1 - inputs.bridgeFinancing.downPaymentPct);
  const actualBridgeLoan = results.holdingPhase.bridgeLoanAmount;
  const bridgePass = withinTolerance(actualBridgeLoan, expectedBridgeLoan, 0.01);
  
  checks.push({
    name: "Bridge Loan Amount",
    expected: expectedBridgeLoan,
    actual: actualBridgeLoan,
    tolerance: 0.01,
    pass: bridgePass,
    message: bridgePass
      ? `Purchase (${inputs.acquisition.purchasePrice}) × (1 - DP ${inputs.bridgeFinancing.downPaymentPct}) = ${expectedBridgeLoan}`
      : `Expected ${expectedBridgeLoan}, got ${actualBridgeLoan}`,
  });

  // === CHECK 5: Points Amount ===
  // points = bridgeLoan * pointsPct
  const expectedPoints = expectedBridgeLoan * inputs.bridgeFinancing.pointsPct;
  const actualPoints = results.holdingPhase.pointsAmount;
  const pointsPass = withinTolerance(actualPoints, expectedPoints, 0.01);
  
  checks.push({
    name: "Points Amount",
    expected: expectedPoints,
    actual: actualPoints,
    tolerance: 0.01,
    pass: pointsPass,
    message: pointsPass
      ? `Bridge (${expectedBridgeLoan}) × Points (${inputs.bridgeFinancing.pointsPct}) = ${expectedPoints}`
      : `Expected ${expectedPoints}, got ${actualPoints}`,
  });

  // Overall pass/fail
  const allPass = checks.every((c) => c.pass);

  return {
    pass: allPass,
    checks,
    presetUsed: preset.id,
  };
}

/**
 * Check if dev mode is enabled (non-production or ?dev=1)
 */
export function isDevModeEnabled(): boolean {
  if (typeof window === "undefined") return false;
  
  // Check for dev query param
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("dev") === "1") return true;
  
  // Check for non-production environment
  if (import.meta.env.MODE !== "production") return true;
  
  return false;
}
