/**
 * NPV Calculator - Core Calculation Engine
 * 
 * Implements Net Present Value calculations with support for:
 * - Multiple period frequencies (annual, monthly, quarterly)
 * - Beginning vs. end of period timing
 * - Single recurring and custom cash flow modes
 * - Growth rate escalation
 */

import {
  NPVInputs,
  NPVResults,
  PeriodBreakdown,
  NPVWarning,
  PeriodFrequency,
} from './types';

/**
 * Get periods per year based on frequency
 */
function getPeriodsPerYear(frequency: PeriodFrequency): number {
  switch (frequency) {
    case 'annual': return 1;
    case 'monthly': return 12;
    case 'quarterly': return 4;
  }
}

/**
 * Convert annual rate to periodic rate using effective rate formula
 * r_periodic = (1 + r_annual)^(1/m) - 1
 */
function annualToPeriodicRate(annualRate: number, periodsPerYear: number): number {
  if (annualRate === 0) return 0;
  return Math.pow(1 + annualRate, 1 / periodsPerYear) - 1;
}

/**
 * Generate cash flows for single recurring mode with optional growth
 */
function generateRecurringCashFlows(
  initialInvestment: number,
  periodicCashFlow: number,
  numberOfPeriods: number,
  growthRate: number
): number[] {
  const cashFlows: number[] = [initialInvestment];
  
  for (let t = 1; t <= numberOfPeriods; t++) {
    // CFt = CF_base * (1 + g)^(t-1)
    const cf = periodicCashFlow * Math.pow(1 + growthRate, t - 1);
    cashFlows.push(cf);
  }
  
  return cashFlows;
}

/**
 * Validate NPV inputs and generate warnings
 */
function validateInputs(inputs: NPVInputs): NPVWarning[] {
  const warnings: NPVWarning[] = [];
  
  // Check discount rate
  if (inputs.discountRateAnnual < 0) {
    warnings.push({
      code: 'NEGATIVE_DISCOUNT_RATE',
      message: 'Discount rate is negative. This is unusual but will be calculated.',
      severity: 'warning',
    });
  }
  
  if (inputs.discountRateAnnual > 0.5) {
    warnings.push({
      code: 'HIGH_DISCOUNT_RATE',
      message: 'Discount rate exceeds 50%. Verify this is intentional.',
      severity: 'warning',
    });
  }
  
  if (inputs.discountRateAnnual === 0) {
    warnings.push({
      code: 'ZERO_DISCOUNT_RATE',
      message: 'Discount rate is 0%. NPV equals sum of cash flows.',
      severity: 'info',
    });
  }
  
  // Check number of periods
  if (inputs.cashFlowMode === 'single_recurring') {
    if (inputs.numberOfPeriods < 1) {
      warnings.push({
        code: 'INVALID_PERIODS',
        message: 'Number of periods must be at least 1.',
        severity: 'error',
      });
    }
    
    if (!Number.isInteger(inputs.numberOfPeriods)) {
      warnings.push({
        code: 'NON_INTEGER_PERIODS',
        message: 'Number of periods should be a whole number.',
        severity: 'warning',
      });
    }
  }
  
  // Check custom cash flows
  if (inputs.cashFlowMode === 'custom_series') {
    if (inputs.customCashFlows.length < 1) {
      warnings.push({
        code: 'NO_CASH_FLOWS',
        message: 'At least one cash flow (CF0) is required.',
        severity: 'error',
      });
    }
    
    const hasNaN = inputs.customCashFlows.some(cf => !isFinite(cf));
    if (hasNaN) {
      warnings.push({
        code: 'INVALID_CASH_FLOW',
        message: 'One or more cash flows are not valid numbers.',
        severity: 'error',
      });
    }
  }
  
  // Check growth rate
  if (Math.abs(inputs.growthRatePeriod) > 0.5) {
    warnings.push({
      code: 'HIGH_GROWTH_RATE',
      message: 'Growth rate exceeds 50% per period. Verify this is intentional.',
      severity: 'warning',
    });
  }
  
  return warnings;
}

/**
 * Calculate NPV with full breakdown
 * 
 * Math Spec:
 * - End-of-period: NPV = CF0 + Σ_{t=1..N} CFt / (1 + r)^t
 * - Beginning-of-period: NPV = CF0 + Σ_{t=1..N} CFt / (1 + r)^(t-1)
 */
export function calculateNPV(inputs: NPVInputs): NPVResults {
  const warnings = validateInputs(inputs);
  
  // Check for blocking errors
  const hasError = warnings.some(w => w.severity === 'error');
  if (hasError) {
    return {
      npv: NaN,
      pvOfInflows: 0,
      pvOfOutflows: 0,
      periodBreakdowns: [],
      periodicDiscountRate: 0,
      totalCashFlows: 0,
      numberOfPeriods: 0,
      warnings,
    };
  }
  
  // Get cash flows based on mode
  const cashFlows: number[] = inputs.cashFlowMode === 'custom_series'
    ? [...inputs.customCashFlows]
    : generateRecurringCashFlows(
        inputs.initialInvestment,
        inputs.periodicCashFlow,
        Math.floor(inputs.numberOfPeriods),
        inputs.growthRatePeriod
      );
  
  // Calculate periodic discount rate
  const periodsPerYear = getPeriodsPerYear(inputs.periodFrequency);
  const periodicRate = annualToPeriodicRate(inputs.discountRateAnnual, periodsPerYear);
  
  // Calculate NPV with breakdown
  const periodBreakdowns: PeriodBreakdown[] = [];
  let npv = 0;
  let pvOfInflows = 0;
  let pvOfOutflows = 0;
  let cumulativePV = 0;
  
  const isBeginningOfPeriod = inputs.timingConvention === 'beginning_of_period';
  
  for (let t = 0; t < cashFlows.length; t++) {
    const cf = cashFlows[t];
    
    // Calculate discount factor based on timing convention
    // End-of-period: DF = 1 / (1 + r)^t
    // Beginning-of-period: DF = 1 / (1 + r)^(t-1) for t >= 1, else 1
    let discountFactor: number;
    if (t === 0) {
      discountFactor = 1; // CF0 is always at t=0
    } else if (periodicRate === 0) {
      discountFactor = 1; // No discounting when rate is 0
    } else if (isBeginningOfPeriod) {
      discountFactor = 1 / Math.pow(1 + periodicRate, t - 1);
    } else {
      discountFactor = 1 / Math.pow(1 + periodicRate, t);
    }
    
    const pv = cf * discountFactor;
    cumulativePV += pv;
    npv += pv;
    
    // Track inflows vs outflows
    if (pv > 0) {
      pvOfInflows += pv;
    } else {
      pvOfOutflows += Math.abs(pv);
    }
    
    periodBreakdowns.push({
      period: t,
      cashFlow: cf,
      discountFactor,
      presentValue: pv,
      cumulativePV,
    });
  }
  
  // Guard against NaN/Infinity
  if (!isFinite(npv)) {
    warnings.push({
      code: 'CALCULATION_ERROR',
      message: 'NPV calculation resulted in an invalid number.',
      severity: 'error',
    });
    npv = NaN;
  }
  
  return {
    npv,
    pvOfInflows,
    pvOfOutflows,
    periodBreakdowns,
    periodicDiscountRate: periodicRate,
    totalCashFlows: cashFlows.reduce((sum, cf) => sum + cf, 0),
    numberOfPeriods: cashFlows.length - 1,
    warnings,
  };
}

/**
 * Development-only self-test function
 * Runs basic validation checks on the NPV calculation engine
 */
export function runNPVSelfTest(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let allPassed = true;
  
  const check = (name: string, condition: boolean) => {
    if (condition) {
      results.push(`✓ ${name}`);
    } else {
      results.push(`✗ ${name}`);
      allPassed = false;
    }
  };
  
  // Test 1: Simple NPV with no discounting
  const test1: NPVInputs = {
    ...DEFAULT_NPV_INPUTS,
    discountRateAnnual: 0,
    initialInvestment: -100,
    periodicCashFlow: 50,
    numberOfPeriods: 3,
    growthRatePeriod: 0,
  };
  const result1 = calculateNPV(test1);
  check('Zero discount rate: NPV = sum of CFs', Math.abs(result1.npv - 50) < 0.01);
  
  // Test 2: Standard NPV calculation
  const test2: NPVInputs = {
    ...DEFAULT_NPV_INPUTS,
    discountRateAnnual: 0.10,
    periodFrequency: 'annual',
    initialInvestment: -1000,
    periodicCashFlow: 400,
    numberOfPeriods: 3,
    growthRatePeriod: 0,
  };
  const result2 = calculateNPV(test2);
  // Expected: -1000 + 400/1.1 + 400/1.21 + 400/1.331 = -5.26 (approximately)
  check('Standard NPV calculation', Math.abs(result2.npv - (-5.26)) < 1);
  
  // Test 3: Monthly conversion
  const test3: NPVInputs = {
    ...DEFAULT_NPV_INPUTS,
    discountRateAnnual: 0.12,
    periodFrequency: 'monthly',
    initialInvestment: -1000,
    periodicCashFlow: 100,
    numberOfPeriods: 12,
    growthRatePeriod: 0,
  };
  const result3 = calculateNPV(test3);
  check('Monthly rate conversion works', result3.periodicDiscountRate > 0 && result3.periodicDiscountRate < 0.02);
  
  // Test 4: Beginning of period timing
  const test4a: NPVInputs = { ...test2, timingConvention: 'end_of_period' };
  const test4b: NPVInputs = { ...test2, timingConvention: 'beginning_of_period' };
  const result4a = calculateNPV(test4a);
  const result4b = calculateNPV(test4b);
  check('Beginning-of-period has higher NPV', result4b.npv > result4a.npv);
  
  // Test 5: Growth rate
  const test5: NPVInputs = {
    ...test2,
    growthRatePeriod: 0.05,
  };
  const result5 = calculateNPV(test5);
  check('Growth rate increases later cash flows', 
    result5.periodBreakdowns[3]?.cashFlow > result5.periodBreakdowns[1]?.cashFlow);
  
  // Test 6: Custom cash flows
  const test6: NPVInputs = {
    ...DEFAULT_NPV_INPUTS,
    cashFlowMode: 'custom_series',
    customCashFlows: [-100, 50, 50, 50],
  };
  const result6 = calculateNPV(test6);
  check('Custom cash flows are used', result6.numberOfPeriods === 3);
  
  return { passed: allPassed, results };
}

// Re-export types for convenience
import { DEFAULT_NPV_INPUTS } from './types';
export { DEFAULT_NPV_INPUTS };
