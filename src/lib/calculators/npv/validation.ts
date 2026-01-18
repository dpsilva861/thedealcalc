/**
 * NPV Calculator Validation
 * Input validation rules following canonical TheDealCalc patterns
 */

import { NPVInputs } from './types';

export interface NPVValidationRule {
  min?: number;
  max?: number;
  unit: string;
  label: string;
  errorMessage: string;
  warningThreshold?: { low?: number; high?: number; message: string };
}

export interface NPVValidationError {
  field: string;
  message: string;
}

export interface NPVValidationWarning {
  field: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface NPVValidationResult {
  isValid: boolean;
  errors: NPVValidationError[];
  warnings: NPVValidationWarning[];
}

export const NPV_VALIDATION_RULES: Record<string, NPVValidationRule> = {
  discountRateAnnual: {
    min: 0,
    max: 1, // 100%
    unit: 'decimal',
    label: 'Annual Discount Rate',
    errorMessage: 'Discount rate must be between 0% and 100%',
    warningThreshold: { high: 0.30, message: 'Discount rate above 30% is unusually high' },
  },
  numberOfPeriods: {
    min: 1,
    max: 600,
    unit: 'count',
    label: 'Number of Periods',
    errorMessage: 'Number of periods must be between 1 and 600',
    warningThreshold: { high: 120, message: 'Over 120 periods may reduce precision' },
  },
  growthRatePeriod: {
    min: -0.5, // -50%
    max: 0.5, // 50%
    unit: 'decimal',
    label: 'Growth Rate per Period',
    errorMessage: 'Growth rate must be between -50% and 50%',
    warningThreshold: { low: -0.1, high: 0.1, message: 'Growth rate outside typical range (-10% to 10%)' },
  },
  initialInvestment: {
    min: -1_000_000_000,
    max: 1_000_000_000,
    unit: 'currency',
    label: 'Initial Investment (CF₀)',
    errorMessage: 'Initial investment must be between -$1B and $1B',
  },
  periodicCashFlow: {
    min: -1_000_000_000,
    max: 1_000_000_000,
    unit: 'currency',
    label: 'Periodic Cash Flow',
    errorMessage: 'Periodic cash flow must be between -$1B and $1B',
  },
};

/**
 * Validate a single NPV input field
 */
export function validateNPVField(
  fieldName: string,
  value: number
): { error?: string; warning?: NPVValidationWarning } {
  const rule = NPV_VALIDATION_RULES[fieldName];
  if (!rule) return {};

  // Check for invalid numbers
  if (value === null || value === undefined || !isFinite(value) || isNaN(value)) {
    return { error: `${rule.label} must be a valid number` };
  }

  // Range validation
  if (rule.min !== undefined && value < rule.min) {
    return { error: rule.errorMessage };
  }
  if (rule.max !== undefined && value > rule.max) {
    return { error: rule.errorMessage };
  }

  // Warning thresholds
  if (rule.warningThreshold) {
    const { low, high, message } = rule.warningThreshold;
    if (low !== undefined && value < low) {
      return { warning: { field: fieldName, message, severity: 'medium' } };
    }
    if (high !== undefined && value > high) {
      return { warning: { field: fieldName, message, severity: 'medium' } };
    }
  }

  return {};
}

/**
 * Validate all NPV inputs
 */
export function validateNPVInputs(inputs: NPVInputs): NPVValidationResult {
  const errors: NPVValidationError[] = [];
  const warnings: NPVValidationWarning[] = [];

  // Validate discount rate
  const discountValidation = validateNPVField('discountRateAnnual', inputs.discountRateAnnual);
  if (discountValidation.error) {
    errors.push({ field: 'discountRateAnnual', message: discountValidation.error });
  }
  if (discountValidation.warning) {
    warnings.push(discountValidation.warning);
  }

  // Mode-specific validation
  if (inputs.cashFlowMode === 'single_recurring') {
    // Validate initial investment
    const initValidation = validateNPVField('initialInvestment', inputs.initialInvestment);
    if (initValidation.error) {
      errors.push({ field: 'initialInvestment', message: initValidation.error });
    }

    // Validate periodic cash flow
    const periodicValidation = validateNPVField('periodicCashFlow', inputs.periodicCashFlow);
    if (periodicValidation.error) {
      errors.push({ field: 'periodicCashFlow', message: periodicValidation.error });
    }

    // Validate number of periods (must be integer)
    const periodsValidation = validateNPVField('numberOfPeriods', inputs.numberOfPeriods);
    if (periodsValidation.error) {
      errors.push({ field: 'numberOfPeriods', message: periodsValidation.error });
    } else if (!Number.isInteger(inputs.numberOfPeriods)) {
      errors.push({ field: 'numberOfPeriods', message: 'Number of periods must be a whole number' });
    }
    if (periodsValidation.warning) {
      warnings.push(periodsValidation.warning);
    }

    // Validate growth rate
    const growthValidation = validateNPVField('growthRatePeriod', inputs.growthRatePeriod);
    if (growthValidation.error) {
      errors.push({ field: 'growthRatePeriod', message: growthValidation.error });
    }
    if (growthValidation.warning) {
      warnings.push(growthValidation.warning);
    }

    // Warning: all positive or all negative cash flows
    if (inputs.initialInvestment >= 0 && inputs.periodicCashFlow >= 0) {
      warnings.push({
        field: 'cashFlows',
        message: 'All cash flows are non-negative. NPV equals discounted sum with no payback.',
        severity: 'low',
      });
    }
    if (inputs.initialInvestment <= 0 && inputs.periodicCashFlow <= 0) {
      warnings.push({
        field: 'cashFlows',
        message: 'All cash flows are non-positive. NPV will be negative.',
        severity: 'medium',
      });
    }
  } else {
    // Custom series validation
    if (!Array.isArray(inputs.customCashFlows) || inputs.customCashFlows.length === 0) {
      errors.push({ field: 'customCashFlows', message: 'At least one cash flow (CF₀) is required' });
    } else {
      // Validate each cash flow
      inputs.customCashFlows.forEach((cf, idx) => {
        if (!isFinite(cf) || isNaN(cf)) {
          errors.push({ field: `customCashFlows[${idx}]`, message: `CF${idx} must be a valid number` });
        }
        if (Math.abs(cf) > 1_000_000_000) {
          errors.push({ field: `customCashFlows[${idx}]`, message: `CF${idx} exceeds maximum value` });
        }
      });

      // Warn if too many periods
      if (inputs.customCashFlows.length > 120) {
        warnings.push({
          field: 'customCashFlows',
          message: 'Over 120 periods may reduce calculation precision',
          severity: 'low',
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Sanitize inputs to prevent NaN/Infinity issues
 */
export function sanitizeNPVInputs(inputs: NPVInputs): NPVInputs {
  const sanitizeNumber = (val: number, fallback: number): number => {
    if (val === null || val === undefined || !isFinite(val) || isNaN(val)) {
      return fallback;
    }
    return val;
  };

  return {
    ...inputs,
    discountRateAnnual: sanitizeNumber(inputs.discountRateAnnual, 0.1),
    initialInvestment: sanitizeNumber(inputs.initialInvestment, 0),
    periodicCashFlow: sanitizeNumber(inputs.periodicCashFlow, 0),
    numberOfPeriods: Math.max(1, Math.round(sanitizeNumber(inputs.numberOfPeriods, 1))),
    growthRatePeriod: sanitizeNumber(inputs.growthRatePeriod, 0),
    customCashFlows: inputs.customCashFlows.map((cf, idx) => 
      sanitizeNumber(cf, idx === 0 ? -100000 : 0)
    ),
  };
}
