/**
 * Data Transformers
 * 
 * Convert calculator-specific results into CanonicalExportData.
 * Each calculator has its own transformer function.
 */

import {
  CanonicalExportData,
  ExportMetric,
  ExportSection,
  ExportTableRow,
  ExportWarning,
  SensitivityTable,
  SensitivityCell,
} from './types';
import { UnderwritingResults, UnderwritingInputs, formatCurrency, formatPercent, formatMultiple, MonthlyData, AnnualSummary } from '@/lib/underwriting';
import { PropertyAddress } from '@/contexts/UnderwritingContext';
import { BRRRRResults, BRRRRInputs } from '@/lib/calculators/brrrr/types';
import { SyndicationResults, SyndicationInputs } from '@/lib/calculators/syndication/types';
import { formatCurrency as formatCurrencyCalc, formatPercent as formatPercentCalc } from '@/lib/calculators/types';

const DEFAULT_DISCLAIMER = 'For educational purposes only. Not investment, legal, or tax advice. DealCalc.com';

/**
 * Transform Underwriting results to CanonicalExportData
 */
export function transformUnderwritingToCanonical(
  inputs: UnderwritingInputs,
  results: UnderwritingResults,
  propertyAddress?: PropertyAddress,
  monthlyData?: MonthlyData[],
  annualSummary?: AnnualSummary[],
  redFlags?: string[],
  notes?: string
): CanonicalExportData {
  const { metrics, sourcesAndUses, saleAnalysis, sensitivityTables } = results;

  // Key Metrics
  const keyMetrics: ExportMetric[] = [
    { label: 'IRR', value: isFinite(metrics.irr) ? formatPercent(metrics.irr) : 'N/A', format: 'percent' },
    { label: 'Cash-on-Cash (Year 1)', value: isFinite(metrics.cocYear1) ? formatPercent(metrics.cocYear1) : 'N/A', format: 'percent' },
    { label: 'Equity Multiple', value: isFinite(metrics.equityMultiple) ? formatMultiple(metrics.equityMultiple) : 'N/A', format: 'multiple' },
    { label: 'DSCR', value: metrics.dscrDisplay, format: 'number' },
    { label: 'Breakeven Occupancy', value: formatPercent(metrics.breakevenOccupancy), format: 'percent' },
    { label: 'Stabilized NOI (Annual)', value: formatCurrency(metrics.stabilizedNoiAnnual), format: 'currency' },
  ];

  // Assumptions sections
  const assumptions: ExportSection[] = [
    {
      title: 'Sources of Funds',
      type: 'metrics',
      data: [
        { label: 'Loan Amount', value: formatCurrency(sourcesAndUses.sources.loanAmount), format: 'currency' },
        { label: 'Equity Required', value: formatCurrency(sourcesAndUses.sources.equity), format: 'currency' },
        { label: 'Total Sources', value: formatCurrency(sourcesAndUses.sources.total), format: 'currency' },
      ],
    },
    {
      title: 'Uses of Funds',
      type: 'metrics',
      data: [
        { label: 'Purchase Price', value: formatCurrency(sourcesAndUses.uses.purchasePrice), format: 'currency' },
        { label: 'Closing Costs', value: formatCurrency(sourcesAndUses.uses.closingCosts), format: 'currency' },
        { label: 'Loan Origination', value: formatCurrency(sourcesAndUses.uses.originationFee), format: 'currency' },
        { label: 'Renovation Budget', value: formatCurrency(sourcesAndUses.uses.renoBudget), format: 'currency' },
        { label: 'Total Uses', value: formatCurrency(sourcesAndUses.uses.total), format: 'currency' },
      ],
    },
    {
      title: 'Exit Analysis',
      type: 'metrics',
      data: [
        { label: 'Stabilized NOI', value: formatCurrency(saleAnalysis.stabilizedNoi), format: 'currency' },
        { label: 'Sale Price', value: formatCurrency(saleAnalysis.salePrice), format: 'currency' },
        { label: 'Sale Costs', value: formatCurrency(saleAnalysis.saleCosts), format: 'currency' },
        { label: 'Loan Payoff', value: formatCurrency(saleAnalysis.loanPayoff), format: 'currency' },
        { label: 'Net Proceeds', value: formatCurrency(saleAnalysis.netSaleProceeds), format: 'currency' },
      ],
    },
    {
      title: 'Acquisition Inputs',
      type: 'key-value',
      data: [
        { label: 'Purchase Price', value: formatCurrency(inputs.acquisition.purchasePrice), format: 'currency' },
        { label: 'Closing Costs', value: formatCurrency(inputs.acquisition.closingCosts), format: 'currency' },
        { label: 'Hold Period', value: `${inputs.acquisition.holdPeriodMonths} months`, format: 'text' },
        { label: 'Exit Cap Rate', value: formatPercent(inputs.acquisition.exitCapRate), format: 'percent' },
      ],
    },
  ];

  // Warnings
  const warnings: ExportWarning[] = (redFlags || []).map(flag => ({
    message: flag,
    severity: 'warn' as const,
  }));

  // Add calculator warnings
  metrics.warnings.forEach(w => {
    if (!warnings.some(existing => existing.message === w.message)) {
      warnings.push({ message: w.message, severity: w.severity === 'error' ? 'error' : 'warn' });
    }
  });

  // Sensitivity Tables
  const sensitivityTablesCanonical: SensitivityTable[] = [];
  
  if (sensitivityTables) {
    // Rent sensitivity
    if (sensitivityTables.rent && sensitivityTables.rent.length > 0) {
      sensitivityTablesCanonical.push({
        title: 'Rent Sensitivity',
        rowHeader: 'Scenario',
        colHeader: '',
        rowLabels: sensitivityTables.rent.map(r => r.label),
        colLabels: ['IRR', 'CoC'],
        cells: sensitivityTables.rent.map(r => [
          { rowLabel: r.label, colLabel: 'IRR', primaryValue: formatPercent(r.irr) },
          { rowLabel: r.label, colLabel: 'CoC', primaryValue: formatPercent(r.coc) },
        ]),
      });
    }

    // Exit Cap sensitivity
    if (sensitivityTables.exitCap && sensitivityTables.exitCap.length > 0) {
      sensitivityTablesCanonical.push({
        title: 'Exit Cap Rate Sensitivity',
        rowHeader: 'Scenario',
        colHeader: '',
        rowLabels: sensitivityTables.exitCap.map(r => r.label),
        colLabels: ['IRR', 'CoC'],
        cells: sensitivityTables.exitCap.map(r => [
          { rowLabel: r.label, colLabel: 'IRR', primaryValue: formatPercent(r.irr) },
          { rowLabel: r.label, colLabel: 'CoC', primaryValue: formatPercent(r.coc) },
        ]),
      });
    }
  }

  // Cash Flow Table from annual summary
  let cashFlowTable: CanonicalExportData['cashFlowTable'];
  if (annualSummary && annualSummary.length > 0) {
    cashFlowTable = {
      title: 'Annual Pro Forma',
      columns: ['Year', 'GPR', 'EGI', 'NOI', 'Debt Service', 'Cash Flow', 'DSCR', 'CoC'],
      rows: annualSummary.map(yr => ({
        Year: yr.year,
        GPR: formatCurrency(yr.gpr),
        EGI: formatCurrency(yr.egi),
        NOI: formatCurrency(yr.noi),
        'Debt Service': formatCurrency(yr.debtService),
        'Cash Flow': formatCurrency(yr.cashFlow),
        DSCR: yr.dscr.toFixed(2),
        CoC: formatPercent(yr.coc),
      })),
    };
  }

  const addressLine = propertyAddress
    ? [propertyAddress.address, propertyAddress.city, propertyAddress.state, propertyAddress.zipCode]
        .filter(Boolean)
        .join(', ')
    : '';

  return {
    calculatorType: 'underwriting',
    reportTitle: 'Underwriting Report',
    exportDate: new Date().toLocaleString(),
    address: propertyAddress ? {
      address: propertyAddress.address,
      city: propertyAddress.city,
      state: propertyAddress.state,
      zipCode: propertyAddress.zipCode,
      dealName: addressLine || undefined,
    } : undefined,
    summary: {
      title: 'Summary',
      type: 'text',
      data: `${inputs.income.unitCount} units • ${inputs.acquisition.holdPeriodMonths} month hold`,
    },
    keyMetrics,
    assumptions,
    cashFlowTable,
    sensitivityTables: sensitivityTablesCanonical,
    warnings,
    notes,
    disclaimer: DEFAULT_DISCLAIMER,
  };
}

/**
 * Transform BRRRR results to CanonicalExportData
 */
export function transformBRRRRToCanonical(
  inputs: BRRRRInputs,
  results: BRRRRResults,
  notes?: string
): CanonicalExportData {
  const { holdingPhase, refinance, rental, metrics, riskFlags, sensitivity } = results;

  const keyMetrics: ExportMetric[] = [
    { label: 'Cash Left In Deal', value: formatCurrencyCalc(Math.max(0, refinance.remainingCashInDeal)), format: 'currency' },
    { label: 'Monthly Cash Flow', value: formatCurrencyCalc(rental.monthlyCashFlow), format: 'currency', isWarning: rental.monthlyCashFlow < 0 },
    { label: 'Cash-on-Cash Return', value: metrics.cashOnCashReturn === Infinity ? '∞' : formatPercentCalc(metrics.cashOnCashReturn), format: 'percent' },
    { label: 'DSCR', value: metrics.dscr === Infinity ? 'N/A' : metrics.dscr.toFixed(2), format: 'number', isWarning: metrics.dscr < 1.2 && metrics.dscr !== Infinity },
    { label: 'Cap Rate', value: formatPercentCalc(metrics.capRate), format: 'percent' },
    { label: 'Equity Created', value: formatCurrencyCalc(metrics.equityCreated), format: 'currency' },
  ];

  const assumptions: ExportSection[] = [
    {
      title: 'Holding Phase',
      type: 'metrics',
      data: [
        { label: 'Total Cash In', value: formatCurrencyCalc(holdingPhase.totalCashIn), format: 'currency' },
        { label: 'Rehab Cost', value: formatCurrencyCalc(holdingPhase.totalRehabCost), format: 'currency' },
        { label: 'Holding Costs', value: formatCurrencyCalc(holdingPhase.totalHoldingCosts), format: 'currency' },
        { label: 'Bridge Payments', value: formatCurrencyCalc(holdingPhase.totalBridgePayments), format: 'currency' },
        { label: 'Bridge Loan Amount', value: formatCurrencyCalc(holdingPhase.bridgeLoanAmount), format: 'currency' },
      ],
    },
    {
      title: 'Refinance',
      type: 'metrics',
      data: [
        { label: 'Max Refi Loan', value: formatCurrencyCalc(refinance.maxRefiLoan), format: 'currency' },
        { label: 'Cash Out', value: formatCurrencyCalc(refinance.cashOut), format: 'currency' },
        { label: 'New Monthly Payment', value: `${formatCurrencyCalc(refinance.newMonthlyPayment)}/mo`, format: 'currency' },
        { label: 'Remaining Cash In Deal', value: formatCurrencyCalc(refinance.remainingCashInDeal), format: 'currency' },
      ],
    },
    {
      title: 'Rental Operations',
      type: 'metrics',
      data: [
        { label: 'Gross Monthly Rent', value: formatCurrencyCalc(rental.grossMonthlyRent), format: 'currency' },
        { label: 'Effective Gross Income', value: `${formatCurrencyCalc(rental.effectiveGrossIncome)}/mo`, format: 'currency' },
        { label: 'Monthly Expenses', value: `${formatCurrencyCalc(rental.monthlyExpenses)}/mo`, format: 'currency' },
        { label: 'Monthly NOI', value: `${formatCurrencyCalc(rental.monthlyNOI)}/mo`, format: 'currency' },
        { label: 'Annual NOI', value: formatCurrencyCalc(rental.annualNOI), format: 'currency' },
      ],
    },
  ];

  const warnings: ExportWarning[] = riskFlags.map(flag => ({
    message: flag.message,
    severity: flag.severity === 'error' ? 'error' : 'warn',
  }));

  // Build sensitivity table
  const sensitivityTablesCanonical: SensitivityTable[] = [];
  if (sensitivity && sensitivity.cells && sensitivity.cells.length > 0) {
    const cells: SensitivityCell[][] = sensitivity.cells.map((row, rowIdx) =>
      row.map((cell, colIdx) => ({
        rowLabel: `Rent ${sensitivity.rentVariations[rowIdx] >= 0 ? '+' : ''}${(sensitivity.rentVariations[rowIdx] * 100).toFixed(0)}%`,
        colLabel: `ARV ${sensitivity.arvVariations[colIdx] >= 0 ? '+' : ''}${(sensitivity.arvVariations[colIdx] * 100).toFixed(0)}%`,
        primaryValue: formatCurrencyCalc(cell.monthlyCashFlow),
        secondaryValue: `${formatPercentCalc(cell.cashOnCash)} CoC`,
        isHighlighted: rowIdx === 1 && colIdx === 1,
      }))
    );

    sensitivityTablesCanonical.push({
      title: 'Rent vs ARV Sensitivity',
      rowHeader: 'Rent Change',
      colHeader: 'ARV Change',
      rowLabels: sensitivity.rentVariations.map(v => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(0)}%`),
      colLabels: sensitivity.arvVariations.map(v => `ARV ${v >= 0 ? '+' : ''}${(v * 100).toFixed(0)}%`),
      cells,
    });
  }

  return {
    calculatorType: 'brrrr',
    reportTitle: 'BRRRR Analysis Report',
    exportDate: new Date().toLocaleString(),
    address: undefined,
    summary: {
      title: 'Summary',
      type: 'text',
      data: `Purchase: ${formatCurrencyCalc(inputs.acquisition.purchasePrice)} • ARV: ${formatCurrencyCalc(inputs.afterRepairValue.arv)}`,
    },
    keyMetrics,
    assumptions,
    sensitivityTables: sensitivityTablesCanonical,
    warnings,
    notes,
    disclaimer: DEFAULT_DISCLAIMER,
  };
}

/**
 * Transform Syndication results to CanonicalExportData
 */
export function transformSyndicationToCanonical(
  inputs: SyndicationInputs,
  results: SyndicationResults,
  notes?: string
): CanonicalExportData {
  const { metrics, sources_and_uses, waterfall_summary, cash_flows } = results;

  const keyMetrics: ExportMetric[] = [
    { label: 'Levered IRR (Total)', value: formatPercentCalc(metrics.levered_irr_total), format: 'percent' },
    { label: 'LP IRR', value: formatPercentCalc(waterfall_summary.lp_irr), format: 'percent' },
    { label: 'GP IRR', value: formatPercentCalc(waterfall_summary.gp_irr), format: 'percent' },
    { label: 'LP Equity Multiple', value: `${waterfall_summary.lp_equity_multiple.toFixed(2)}x`, format: 'multiple' },
    { label: 'GP Equity Multiple', value: `${waterfall_summary.gp_equity_multiple.toFixed(2)}x`, format: 'multiple' },
    { label: 'Average Cash-on-Cash', value: formatPercentCalc(metrics.avg_cash_on_cash), format: 'percent' },
  ];

  const assumptions: ExportSection[] = [
    {
      title: 'Sources of Funds',
      type: 'metrics',
      data: [
        { label: 'Senior Loan', value: formatCurrencyCalc(sources_and_uses.loan_amount), format: 'currency' },
        { label: 'LP Equity', value: formatCurrencyCalc(sources_and_uses.lp_equity), format: 'currency' },
        { label: 'GP Equity', value: formatCurrencyCalc(sources_and_uses.gp_equity), format: 'currency' },
        { label: 'Total Sources', value: formatCurrencyCalc(sources_and_uses.total_sources), format: 'currency' },
      ],
    },
    {
      title: 'Uses of Funds',
      type: 'metrics',
      data: [
        { label: 'Purchase Price', value: formatCurrencyCalc(sources_and_uses.purchase_price), format: 'currency' },
        { label: 'Closing Costs', value: formatCurrencyCalc(sources_and_uses.closing_costs), format: 'currency' },
        { label: 'Acquisition Fee', value: formatCurrencyCalc(sources_and_uses.acquisition_fee), format: 'currency' },
        { label: 'CapEx Budget', value: formatCurrencyCalc(sources_and_uses.capex_budget), format: 'currency' },
        { label: 'Total Uses', value: formatCurrencyCalc(sources_and_uses.total_uses), format: 'currency' },
      ],
    },
    {
      title: 'Waterfall Summary',
      type: 'metrics',
      data: [
        { label: 'Total LP Distributions', value: formatCurrencyCalc(waterfall_summary.lp_total_distributions), format: 'currency' },
        { label: 'Total GP Distributions', value: formatCurrencyCalc(waterfall_summary.gp_total_distributions), format: 'currency' },
        { label: 'LP Profit', value: formatCurrencyCalc(metrics.lp_profit), format: 'currency' },
        { label: 'GP Promote', value: formatCurrencyCalc(waterfall_summary.promote_dollars), format: 'currency' },
      ],
    },
  ];

  // Warnings from results
  const warnings: ExportWarning[] = (results.warnings || []).map(w => ({
    message: w.message,
    severity: w.severity === 'error' ? 'error' : 'warn',
  }));

  // Cash flow table from period data
  let cashFlowTable: CanonicalExportData['cashFlowTable'];
  if (cash_flows && cash_flows.length > 0) {
    // Show annual summaries (every 12 periods for monthly)
    const annualData = cash_flows.filter((_, idx) => idx === 0 || idx % 12 === 0 || idx === cash_flows.length - 1);
    cashFlowTable = {
      title: 'Cash Flow Summary',
      columns: ['Period', 'EGI', 'NOI', 'NCF'],
      rows: annualData.slice(0, 15).map(cf => ({
        Period: cf.period,
        EGI: formatCurrencyCalc(cf.effective_gross_income),
        NOI: formatCurrencyCalc(cf.noi),
        NCF: formatCurrencyCalc(cf.ncf_after_debt),
      })),
    };
  }

  return {
    calculatorType: 'syndication',
    reportTitle: 'Syndication Analysis Report',
    exportDate: new Date().toLocaleString(),
    address: {
      dealName: inputs.deal_name || 'Syndication Deal',
    },
    summary: {
      title: 'Summary',
      type: 'text',
      data: `${inputs.deal_name || 'Deal'} • ${inputs.hold_period_months} month hold • LP/GP Split`,
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
