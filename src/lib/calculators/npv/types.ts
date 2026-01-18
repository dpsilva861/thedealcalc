/**
 * NPV Calculator Types
 * Complete type definitions for Net Present Value calculations
 */

// ============ Enums / Literal Types ============

export type PeriodFrequency = 'annual' | 'monthly' | 'quarterly';
export type TimingConvention = 'end_of_period' | 'beginning_of_period';
export type CashFlowMode = 'single_recurring' | 'custom_series';

// ============ Input Interfaces ============

export interface NPVInputs {
  // Core settings
  discountRateAnnual: number; // e.g., 0.10 = 10%
  periodFrequency: PeriodFrequency;
  timingConvention: TimingConvention;
  cashFlowMode: CashFlowMode;
  
  // Single recurring mode
  initialInvestment: number; // CF0, typically negative
  periodicCashFlow: number; // Base CF for recurring
  numberOfPeriods: number; // Integer >= 1
  growthRatePeriod: number; // Growth rate per period (e.g., 0.03 = 3%)
  
  // Custom series mode
  customCashFlows: number[]; // CF0, CF1, CF2, ... CFN
}

// ============ Output Interfaces ============

export interface PeriodBreakdown {
  period: number;
  cashFlow: number;
  discountFactor: number;
  presentValue: number;
  cumulativePV: number;
}

export interface NPVResults {
  // Core outputs
  npv: number;
  pvOfInflows: number;
  pvOfOutflows: number;
  
  // Per-period breakdown
  periodBreakdowns: PeriodBreakdown[];
  
  // Metadata
  periodicDiscountRate: number;
  totalCashFlows: number;
  numberOfPeriods: number;
  
  // Warnings
  warnings: NPVWarning[];
}

export interface NPVWarning {
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

// ============ Default Values ============

export const DEFAULT_NPV_INPUTS: NPVInputs = {
  discountRateAnnual: 0.10, // 10%
  periodFrequency: 'annual',
  timingConvention: 'end_of_period',
  cashFlowMode: 'single_recurring',
  
  // Single recurring defaults
  initialInvestment: -100000, // $100k investment
  periodicCashFlow: 25000, // $25k per period
  numberOfPeriods: 5,
  growthRatePeriod: 0, // No growth
  
  // Custom series defaults
  customCashFlows: [-100000, 25000, 25000, 25000, 25000, 25000],
};

// ============ Example Presets ============

export interface NPVPreset {
  id: string;
  name: string;
  description: string;
  inputs: NPVInputs;
}

export const NPV_PRESETS: NPVPreset[] = [
  {
    id: 'rental_property',
    name: 'Rental Property',
    description: 'Typical rental property cash flows over 5 years',
    inputs: {
      discountRateAnnual: 0.10,
      periodFrequency: 'annual',
      timingConvention: 'end_of_period',
      cashFlowMode: 'single_recurring',
      initialInvestment: -50000,
      periodicCashFlow: 8000,
      numberOfPeriods: 5,
      growthRatePeriod: 0.03,
      customCashFlows: [-50000],
    },
  },
  {
    id: 'equipment_purchase',
    name: 'Equipment Purchase',
    description: 'Monthly equipment lease vs. buy analysis',
    inputs: {
      discountRateAnnual: 0.08,
      periodFrequency: 'monthly',
      timingConvention: 'end_of_period',
      cashFlowMode: 'single_recurring',
      initialInvestment: -25000,
      periodicCashFlow: 800,
      numberOfPeriods: 36,
      growthRatePeriod: 0,
      customCashFlows: [-25000],
    },
  },
  {
    id: 'custom_development',
    name: 'Development Project',
    description: 'Custom cash flows with construction phase',
    inputs: {
      discountRateAnnual: 0.12,
      periodFrequency: 'annual',
      timingConvention: 'end_of_period',
      cashFlowMode: 'custom_series',
      initialInvestment: -200000,
      periodicCashFlow: 0,
      numberOfPeriods: 6,
      growthRatePeriod: 0,
      customCashFlows: [-200000, -50000, 50000, 75000, 100000, 150000, 200000],
    },
  },
];
