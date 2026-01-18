/**
 * NPV to Canonical Export Data Transformer
 * 
 * Transforms NPV calculator results to the canonical export format
 * used by DOCX/PPTX export functions.
 */

import {
  CanonicalExportData,
  ExportMetric,
  ExportSection,
  ExportWarning,
} from './types';
import { NPVInputs, NPVResults, PeriodFrequency } from '@/lib/calculators/npv/types';
import { formatCurrency, formatPercent } from '@/lib/calculators/types';

const DEFAULT_DISCLAIMER = 'For educational purposes only. Not investment, legal, or tax advice. DealCalc.com';

function getFrequencyLabel(freq: PeriodFrequency): string {
  switch (freq) {
    case 'annual': return 'Annual';
    case 'monthly': return 'Monthly';
    case 'quarterly': return 'Quarterly';
  }
}

export function transformNPVToCanonical(
  inputs: NPVInputs,
  results: NPVResults,
  notes?: string
): CanonicalExportData {
  // Key Metrics
  const keyMetrics: ExportMetric[] = [
    { 
      label: 'Net Present Value', 
      value: formatCurrency(results.npv), 
      format: 'currency',
      isWarning: results.npv < 0,
    },
    { 
      label: 'PV of Inflows', 
      value: formatCurrency(results.pvOfInflows), 
      format: 'currency' 
    },
    { 
      label: 'PV of Outflows', 
      value: formatCurrency(results.pvOfOutflows), 
      format: 'currency' 
    },
    { 
      label: 'Total Cash Flows', 
      value: formatCurrency(results.totalCashFlows), 
      format: 'currency' 
    },
    { 
      label: 'Number of Periods', 
      value: results.numberOfPeriods, 
      format: 'number' 
    },
  ];

  // Assumptions
  const assumptions: ExportSection[] = [
    {
      title: 'Calculation Parameters',
      type: 'metrics',
      data: [
        { label: 'Annual Discount Rate', value: formatPercent(inputs.discountRateAnnual), format: 'percent' },
        { label: 'Periodic Rate', value: formatPercent(results.periodicDiscountRate), format: 'percent' },
        { label: 'Period Frequency', value: getFrequencyLabel(inputs.periodFrequency), format: 'text' },
        { label: 'Timing Convention', value: inputs.timingConvention === 'end_of_period' ? 'End of Period' : 'Beginning of Period', format: 'text' },
        { label: 'Cash Flow Mode', value: inputs.cashFlowMode === 'single_recurring' ? 'Single + Recurring' : 'Custom Series', format: 'text' },
      ],
    },
  ];

  // Add inputs section based on mode
  if (inputs.cashFlowMode === 'single_recurring') {
    assumptions.push({
      title: 'Cash Flow Inputs',
      type: 'metrics',
      data: [
        { label: 'Initial Investment (CF₀)', value: formatCurrency(inputs.initialInvestment), format: 'currency' },
        { label: 'Periodic Cash Flow', value: formatCurrency(inputs.periodicCashFlow), format: 'currency' },
        { label: 'Number of Periods', value: inputs.numberOfPeriods, format: 'number' },
        { label: 'Growth Rate', value: formatPercent(inputs.growthRatePeriod), format: 'percent' },
      ],
    });
  }

  // Warnings
  const warnings: ExportWarning[] = results.warnings.map(w => ({
    message: w.message,
    severity: w.severity === 'error' ? 'error' : 'warn',
  }));

  // Cash Flow Table
  const cashFlowTable = {
    title: 'Period Breakdown',
    columns: ['Period', 'Cash Flow', 'Discount Factor', 'Present Value', 'Cumulative PV'],
    rows: results.periodBreakdowns.slice(0, 50).map(pb => ({
      Period: pb.period,
      'Cash Flow': formatCurrency(pb.cashFlow),
      'Discount Factor': pb.discountFactor.toFixed(4),
      'Present Value': formatCurrency(pb.presentValue),
      'Cumulative PV': formatCurrency(pb.cumulativePV),
    })),
  };

  return {
    calculatorType: 'underwriting', // Using underwriting for compatibility
    reportTitle: 'NPV Analysis Report',
    exportDate: new Date().toLocaleString(),
    address: undefined,
    summary: {
      title: 'Summary',
      type: 'text',
      data: `${results.numberOfPeriods} periods • ${getFrequencyLabel(inputs.periodFrequency)} • ${formatPercent(inputs.discountRateAnnual)} discount rate`,
    },
    keyMetrics,
    assumptions,
    cashFlowTable,
    sensitivityTables: [],
    warnings,
    notes,
    disclaimer: DEFAULT_DISCLAIMER,
  };
}
