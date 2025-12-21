// ============================================================
// Syndication Metrics Calculations
// IRR, EM, DSCR, Cap Rates, and other KPIs
// ============================================================

import {
  SyndicationInputs,
  SourcesAndUses,
  PeriodCashFlow,
  WaterfallSummary,
  DealMetrics,
} from "./types";

/**
 * Calculate IRR from periodic cash flows using Newton-Raphson with fallbacks
 */
export function calculateIRRFromCashFlows(cashFlows: number[], periodsPerYear: number = 12): number {
  if (!cashFlows || cashFlows.length < 2) return 0;

  // Check if there's any positive cash flow
  const hasPositive = cashFlows.some((cf) => cf > 0);
  const hasNegative = cashFlows.some((cf) => cf < 0);
  if (!hasPositive || !hasNegative) return 0;

  // Total cash flow check
  const totalCF = cashFlows.reduce((sum, cf) => sum + cf, 0);

  // NPV function
  const npv = (rate: number): number => {
    return cashFlows.reduce((sum, cf, t) => {
      return sum + cf / Math.pow(1 + rate, t / periodsPerYear);
    }, 0);
  };

  // NPV derivative
  const npvDerivative = (rate: number): number => {
    return cashFlows.reduce((sum, cf, t) => {
      const years = t / periodsPerYear;
      return sum - (years * cf) / Math.pow(1 + rate, years + 1);
    }, 0);
  };

  // Newton-Raphson with multiple starting guesses
  const startingGuesses = [0.1, 0.2, 0.05, 0.5, -0.05, 0.01];
  const maxIterations = 100;
  const tolerance = 1e-7;

  for (const guess of startingGuesses) {
    let rate = guess;
    let converged = false;

    for (let i = 0; i < maxIterations; i++) {
      const f = npv(rate);
      const fPrime = npvDerivative(rate);

      if (Math.abs(fPrime) < 1e-12) break;

      const newRate = rate - f / fPrime;

      // Bound the rate to reasonable range
      if (newRate < -0.99) {
        rate = -0.99;
      } else if (newRate > 10) {
        rate = 10;
      } else {
        rate = newRate;
      }

      if (Math.abs(f) < tolerance) {
        converged = true;
        break;
      }
    }

    if (converged && isFinite(rate) && rate > -1 && rate < 10) {
      return rate;
    }
  }

  // Fallback: bisection method
  let low = -0.99;
  let high = 5;
  const npvLow = npv(low);
  const npvHigh = npv(high);

  if (npvLow * npvHigh > 0) {
    // Same sign - try to find bounds
    if (totalCF > 0) {
      return totalCF < cashFlows[0] * -1 ? -0.5 : 0.1;
    }
    return totalCF > 0 ? 0.05 : -0.1;
  }

  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const npvMid = npv(mid);

    if (Math.abs(npvMid) < tolerance || (high - low) / 2 < tolerance) {
      return mid;
    }

    if (npvMid * npvLow < 0) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return (low + high) / 2;
}

/**
 * Calculate deal-level metrics
 */
export function calculateDealMetrics(
  inputs: SyndicationInputs,
  sourcesAndUses: SourcesAndUses,
  cashFlows: PeriodCashFlow[],
  waterfallSummary: WaterfallSummary
): DealMetrics {
  const { acquisition, debt, proforma, exit } = inputs;

  // Year 1 NOI (sum of months 1-12)
  const year1NOI = cashFlows
    .filter((cf) => cf.period >= 1 && cf.period <= 12)
    .reduce((sum, cf) => sum + cf.noi, 0);

  // Purchase cap rate
  const purchaseCapRate = acquisition.purchase_price > 0 ? year1NOI / acquisition.purchase_price : 0;

  // Exit cap rate (from inputs or calculated)
  const exitCapRateUsed = exit.exit_cap_rate;

  // Build total cash flows for levered IRR
  const totalCashFlows: number[] = [];
  totalCashFlows.push(-sourcesAndUses.total_equity);
  for (let i = 1; i < cashFlows.length; i++) {
    totalCashFlows.push(cashFlows[i].cash_available_for_distribution);
  }
  const leveredIRRTotal = calculateIRRFromCashFlows(totalCashFlows);

  // Unlevered cash flows (no debt)
  const unleveredCashFlows: number[] = [];
  unleveredCashFlows.push(-sourcesAndUses.total_uses);
  for (let i = 1; i < cashFlows.length; i++) {
    const cf = cashFlows[i];
    // Add back debt service to get unlevered NCF
    let unleveredNCF = cf.ncf_after_debt + cf.debt_service;
    // Add sale proceeds without loan payoff adjustment
    if (cf.is_sale_period) {
      // Recalculate sale proceeds without debt
      const annualNOI = cf.noi * 12;
      const salePrice =
        exit.exit_mode === "cap_rate" && exit.exit_cap_rate > 0
          ? annualNOI / exit.exit_cap_rate
          : exit.exit_price;
      const saleCosts = salePrice * exit.sale_cost_pct;
      const dispFee =
        exit.disposition_fee_mode === "percent"
          ? salePrice * exit.disposition_fee_pct
          : exit.disposition_fee_amount;
      unleveredNCF = cf.ncf_before_debt + salePrice - saleCosts - dispFee + cf.reserve_balance;
    }
    unleveredCashFlows.push(unleveredNCF);
  }
  const unleveredIRR = calculateIRRFromCashFlows(unleveredCashFlows);

  // Equity multiples
  const totalDistributions = waterfallSummary.lp_total_distributions + waterfallSummary.gp_total_distributions;
  const totalEquity = sourcesAndUses.total_equity;
  const equityMultipleTotal = totalEquity > 0 ? totalDistributions / totalEquity : 0;

  // Cash on cash (average)
  const operatingCF = cashFlows
    .filter((cf) => cf.period > 0 && !cf.is_sale_period)
    .map((cf) => cf.cash_available_for_distribution);
  const avgOperatingCF = operatingCF.length > 0 
    ? operatingCF.reduce((s, c) => s + c, 0) / operatingCF.length 
    : 0;
  const annualizedCF = avgOperatingCF * 12;
  const avgCashOnCash = totalEquity > 0 ? annualizedCF / totalEquity : 0;

  // DSCR
  const dscrValues = cashFlows
    .filter((cf) => cf.period > 0 && cf.debt_service > 0)
    .map((cf) => cf.noi / cf.debt_service);
  const dscrMin = dscrValues.length > 0 ? Math.min(...dscrValues) : 0;
  const dscrAvg = dscrValues.length > 0 ? dscrValues.reduce((s, d) => s + d, 0) / dscrValues.length : 0;

  // Debt yield
  const debtYield = sourcesAndUses.loan_amount > 0 ? year1NOI / sourcesAndUses.loan_amount : 0;

  // LTV at purchase
  const ltvAtPurchase = acquisition.purchase_price > 0 
    ? sourcesAndUses.loan_amount / acquisition.purchase_price 
    : 0;

  // LTV at exit (approximate)
  const salePeriodCF = cashFlows.find((cf) => cf.is_sale_period);
  const exitLoanBalance = salePeriodCF ? salePeriodCF.loan_balance_ending : 0;
  const exitValue = salePeriodCF 
    ? (exit.exit_mode === "cap_rate" && exit.exit_cap_rate > 0 
        ? (salePeriodCF.noi * 12) / exit.exit_cap_rate 
        : exit.exit_price)
    : 0;
  const ltvAtExit = exitValue > 0 ? exitLoanBalance / exitValue : 0;

  // Break-even occupancy
  const avgNOI = cashFlows.filter(cf => cf.period > 0).reduce((s, cf) => s + cf.noi, 0) / 
    Math.max(1, cashFlows.filter(cf => cf.period > 0).length);
  const avgDebtService = cashFlows.filter(cf => cf.period > 0).reduce((s, cf) => s + cf.debt_service, 0) / 
    Math.max(1, cashFlows.filter(cf => cf.period > 0).length);
  const avgOpEx = cashFlows.filter(cf => cf.period > 0).reduce((s, cf) => s + cf.operating_expenses + cf.property_management_fee, 0) / 
    Math.max(1, cashFlows.filter(cf => cf.period > 0).length);
  const avgGPR = cashFlows.filter(cf => cf.period > 0).reduce((s, cf) => s + cf.gross_potential_rent, 0) / 
    Math.max(1, cashFlows.filter(cf => cf.period > 0).length);
  
  // Break-even: (OpEx + DebtService) / GPR
  const breakEvenOccupancy = avgGPR > 0 ? (avgOpEx + avgDebtService) / avgGPR : 1;

  // Fee totals
  const totalAcquisitionFees = sourcesAndUses.acquisition_fee;
  const totalAssetManagementFees = cashFlows
    .filter((cf) => cf.period > 0)
    .reduce((sum, cf) => sum + cf.asset_management_fee, 0);
  const saleCF = cashFlows.find((cf) => cf.is_sale_period);
  const salePrice = saleCF 
    ? (exit.exit_mode === "cap_rate" && exit.exit_cap_rate > 0 
        ? (saleCF.noi * 12) / exit.exit_cap_rate 
        : exit.exit_price)
    : 0;
  const totalDispositionFees = exit.disposition_fee_mode === "percent"
    ? salePrice * exit.disposition_fee_pct
    : exit.disposition_fee_amount;
  const totalFees = totalAcquisitionFees + totalAssetManagementFees + totalDispositionFees;

  // Profit split
  const lpProfit = waterfallSummary.lp_total_distributions - waterfallSummary.lp_total_contributions;
  const gpProfit = waterfallSummary.gp_total_distributions - waterfallSummary.gp_total_contributions;
  const totalProfit = lpProfit + gpProfit;

  return {
    levered_irr_total: leveredIRRTotal,
    levered_irr_lp: waterfallSummary.lp_irr,
    unlevered_irr: unleveredIRR,
    equity_multiple_total: equityMultipleTotal,
    equity_multiple_lp: waterfallSummary.lp_equity_multiple,
    avg_cash_on_cash: avgCashOnCash,
    purchase_cap_rate: purchaseCapRate,
    exit_cap_rate: exitCapRateUsed,
    dscr_min: dscrMin,
    dscr_avg: dscrAvg,
    debt_yield: debtYield,
    ltv_at_purchase: ltvAtPurchase,
    ltv_at_exit: ltvAtExit,
    breakeven_occupancy: breakEvenOccupancy,
    total_acquisition_fees: totalAcquisitionFees,
    total_asset_management_fees: totalAssetManagementFees,
    total_disposition_fees: totalDispositionFees,
    total_fees: totalFees,
    lp_profit: lpProfit,
    gp_profit: gpProfit,
    total_profit: totalProfit,
  };
}
