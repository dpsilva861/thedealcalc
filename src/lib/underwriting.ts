// Deterministic Underwriting Calculator Module
// All calculations are pure functions with no side effects

// CALCULATION VERSION - increment this when calculation logic changes
// This allows historical analyses to be flagged if they were computed with a different version
// v1.1.0: Added edge case guards, safe metric handling, breakeven/DSCR fixes
export const CALCULATION_VERSION = "1.1.0";

// ==================== CALCULATION WARNINGS ====================
export interface CalculationWarning {
  code: string;
  message: string;
  severity: "info" | "warn" | "error";
}

export interface AcquisitionInputs {
  purchasePrice: number;
  closingCosts: number;
  closingCostsIsPercent: boolean;
  acquisitionFee: number;
  holdPeriodMonths: number;
  saleCostPct: number;
  exitCapRate: number;
}

export interface IncomeInputs {
  unitCount: number;
  inPlaceMonthlyRentPerUnit: number;
  marketMonthlyRentPerUnit: number;
  otherMonthlyIncome: number;
  rentGrowthAnnualPct: number;
  economicVacancyPct: number;
  badDebtPct: number;
  useMarketRentImmediately: boolean;
}

export interface ExpenseInputs {
  propertyTaxesAnnual: number;
  insuranceAnnual: number;
  repairsMaintenanceAnnual: number;
  propertyMgmtPctOfEgi: number;
  utilitiesAnnual: number;
  hoaAnnual: number;
  replacementReservesAnnual: number;
  otherExpensesAnnual: number;
}

export interface RenovationInputs {
  renoBudgetTotal: number;
  renoDurationMonths: number;
  renoRentLossPct: number;
  leaseUpMonthsAfterReno: number;
  leasingCommissionPctOfNewLease: number;
  makeReadyPerUnit: number;
}

export interface FinancingInputs {
  useFinancing: boolean;
  loanAmount: number;
  loanLtv: number;
  useLtv: boolean;
  interestRateAnnual: number;
  amortizationYears: number;
  loanTermMonths: number;
  loanOriginationFeePct: number;
  interestOnlyMonths: number;
}

export interface TaxInputs {
  marginalTaxRatePct: number | null;
  depreciationYears: number;
  landValuePct: number | null;
  costSegregationEnabled: boolean;
  bonusDepreciationPct: number | null;
}

export interface UnderwritingInputs {
  acquisition: AcquisitionInputs;
  income: IncomeInputs;
  expenses: ExpenseInputs;
  renovation: RenovationInputs;
  financing: FinancingInputs;
  tax: TaxInputs;
}

export interface MonthlyData {
  month: number;
  rent: number;
  gpr: number;
  renoLoss: number;
  vacancyLoss: number;
  badDebtLoss: number;
  otherIncome: number;
  egi: number;
  fixedOpex: number;
  mgmtFee: number;
  totalOpex: number;
  noi: number;
  renoSpend: number;
  makeReady: number;
  leasingCosts: number;
  debtService: number;
  principalPayment: number;
  interestPayment: number;
  cashFlowBeforeTax: number;
  loanBalance: number;
}

export interface UnderwritingResults {
  monthlyData: MonthlyData[];
  annualSummary: AnnualSummary[];
  metrics: Metrics;
  sourcesAndUses: SourcesAndUses;
  saleAnalysis: SaleAnalysis;
  sensitivityTables: SensitivityTables;
}

export interface AnnualSummary {
  year: number;
  gpr: number;
  vacancyLoss: number;
  egi: number;
  opex: number;
  noi: number;
  debtService: number;
  cashFlow: number;
  dscr: number;
  coc: number;
}

export interface Metrics {
  stabilizedNoiAnnual: number;
  stabilizedNoiMonthly: number;
  cocYear1: number;
  cocStabilized: number;
  irr: number;
  equityMultiple: number;
  dscr: number;
  dscrDisplay: string; // "N/A" when no debt, otherwise formatted number
  breakevenOccupancy: number;
  breakevenOccupancyDisplay: string; // "N/A" when GPR is 0
  totalEquityInvested: number;
  totalCashFlow: number;
  totalProfit: number;
  warnings: CalculationWarning[];
}

export interface SourcesAndUses {
  sources: {
    loanAmount: number;
    equity: number;
    total: number;
  };
  uses: {
    purchasePrice: number;
    closingCosts: number;
    originationFee: number;
    renoBudget: number;
    acquisitionFee: number;
    total: number;
  };
}

export interface SaleAnalysis {
  stabilizedNoi: number;
  salePrice: number;
  salePriceDisplay: string; // "N/A" when cap rate is invalid
  saleCosts: number;
  loanPayoff: number;
  netSaleProceeds: number;
  isValid: boolean; // false if exit cap rate causes invalid calculation
}

export interface SensitivityTables {
  rent: SensitivityRow[];
  exitCap: SensitivityRow[];
  renoBudget: SensitivityRow[];
}

export interface SensitivityRow {
  label: string;
  value: number;
  irr: number;
  coc: number;
  equityMultiple: number;
}

// PMT calculation (standard mortgage payment formula)
export function calculatePMT(rate: number, nper: number, pv: number): number {
  if (rate === 0) return pv / nper;
  return (pv * rate * Math.pow(1 + rate, nper)) / (Math.pow(1 + rate, nper) - 1);
}

// Calculate remaining loan balance at a given month
export function calculateLoanBalance(
  principal: number,
  monthlyRate: number,
  payment: number,
  monthsElapsed: number,
  interestOnlyMonths: number
): number {
  let balance = principal;
  for (let m = 1; m <= monthsElapsed; m++) {
    const interest = balance * monthlyRate;
    if (m <= interestOnlyMonths) {
      // Interest only - no principal reduction
      continue;
    }
    const principalPayment = payment - interest;
    balance -= principalPayment;
  }
  return Math.max(0, balance);
}

// IRR calculation using Newton-Raphson method
export function calculateIRR(cashFlows: number[], guess: number = 0.1): number {
  // Guard: need at least 2 cash flows
  if (cashFlows.length < 2) return 0;
  
  // Guard: first cash flow should be negative (investment)
  if (cashFlows[0] >= 0) return 0;
  
  // Guard: check if there's any positive cash flow
  const hasPositive = cashFlows.slice(1).some(cf => cf > 0);
  if (!hasPositive) return 0;

  const maxIterations = 100;
  const tolerance = 1e-7;
  let rate = guess;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      const factor = Math.pow(1 + rate, t);
      npv += cashFlows[t] / factor;
      dnpv -= t * cashFlows[t] / (factor * (1 + rate));
    }

    // Guard against division by zero or invalid values
    if (dnpv === 0 || !isFinite(dnpv) || !isFinite(npv)) {
      return 0;
    }

    const newRate = rate - npv / dnpv;
    
    // Guard against invalid rate
    if (!isFinite(newRate) || newRate <= -1) {
      return 0;
    }
    
    if (Math.abs(newRate - rate) < tolerance) {
      // Convert monthly IRR to annual
      const annualIRR = Math.pow(1 + newRate, 12) - 1;
      return isFinite(annualIRR) ? annualIRR : 0;
    }
    
    rate = newRate;
  }

  // Fallback: simple annualization with guard
  const fallback = rate * 12;
  return isFinite(fallback) ? fallback : 0;
}

export function runUnderwriting(
  inputs: UnderwritingInputs,
  options?: { includeSensitivity?: boolean }
): UnderwritingResults {
  const { acquisition, income, expenses, renovation, financing, tax } = inputs;

  // Calculate closing costs
  const closingCostsAmount = acquisition.closingCostsIsPercent
    ? acquisition.purchasePrice * (acquisition.closingCosts / 100)
    : acquisition.closingCosts;

  // Calculate loan amount
  let loanAmount = 0;
  if (financing.useFinancing) {
    loanAmount = financing.useLtv
      ? acquisition.purchasePrice * (financing.loanLtv / 100)
      : financing.loanAmount;
  }

  const originationFee = financing.useFinancing
    ? loanAmount * (financing.loanOriginationFeePct / 100)
    : 0;

  // Sources and Uses
  const totalUses = acquisition.purchasePrice + closingCostsAmount + originationFee +
    renovation.renoBudgetTotal + acquisition.acquisitionFee;
  const totalEquity = totalUses - loanAmount;

  const sourcesAndUses: SourcesAndUses = {
    sources: {
      loanAmount,
      equity: totalEquity,
      total: totalUses,
    },
    uses: {
      purchasePrice: acquisition.purchasePrice,
      closingCosts: closingCostsAmount,
      originationFee,
      renoBudget: renovation.renoBudgetTotal,
      acquisitionFee: acquisition.acquisitionFee,
      total: totalUses,
    },
  };

  // Monthly calculations
  const monthlyData: MonthlyData[] = [];
  const monthlyRate = financing.interestRateAnnual / 100 / 12;
  const amortMonths = financing.amortizationYears * 12;
  const monthlyPayment = financing.useFinancing
    ? calculatePMT(monthlyRate, amortMonths, loanAmount)
    : 0;

  const monthlyGrowthRate = Math.pow(1 + income.rentGrowthAnnualPct / 100, 1 / 12) - 1;
  const renoEndMonth = renovation.renoDurationMonths;
  const leaseUpEndMonth = renoEndMonth + renovation.leaseUpMonthsAfterReno;

  // Fixed monthly opex
  const fixedOpexMonthly = (
    expenses.propertyTaxesAnnual +
    expenses.insuranceAnnual +
    expenses.repairsMaintenanceAnnual +
    expenses.utilitiesAnnual +
    expenses.hoaAnnual +
    expenses.replacementReservesAnnual +
    expenses.otherExpensesAnnual
  ) / 12;

  // Monthly reno spend
  const monthlyRenoSpend = renovation.renoDurationMonths > 0
    ? renovation.renoBudgetTotal / renovation.renoDurationMonths
    : 0;

  let currentLoanBalance = loanAmount;
  let currentRent = income.inPlaceMonthlyRentPerUnit;

  for (let m = 1; m <= acquisition.holdPeriodMonths; m++) {
    // Rent progression
    if (m === 1) {
      currentRent = income.useMarketRentImmediately
        ? income.marketMonthlyRentPerUnit
        : income.inPlaceMonthlyRentPerUnit;
    } else if (m === leaseUpEndMonth + 1 && !income.useMarketRentImmediately) {
      // Transition to market rent after lease-up
      currentRent = income.marketMonthlyRentPerUnit;
    }

    // Apply monthly growth
    if (m > 1) {
      currentRent = currentRent * (1 + monthlyGrowthRate);
    }

    const gpr = income.unitCount * currentRent;

    // Reno/Lease-up rent loss
    let renoLoss = 0;
    if (m <= renoEndMonth) {
      renoLoss = gpr * renovation.renoRentLossPct;
    } else if (m <= leaseUpEndMonth) {
      // Full vacancy during lease-up
      renoLoss = gpr;
    }

    // Vacancy and bad debt
    const effectiveGpr = gpr - renoLoss;
    const vacancyLoss = effectiveGpr * (income.economicVacancyPct / 100);
    const afterVacancy = effectiveGpr - vacancyLoss;
    const badDebtLoss = afterVacancy * (income.badDebtPct / 100);

    const otherIncome = income.otherMonthlyIncome;
    const egi = afterVacancy - badDebtLoss + otherIncome;

    // Operating expenses
    const mgmtFee = egi * (expenses.propertyMgmtPctOfEgi / 100);
    const totalOpex = fixedOpexMonthly + mgmtFee;

    const noi = egi - totalOpex;

    // CapEx
    const renoSpend = m <= renoEndMonth ? monthlyRenoSpend : 0;
    const makeReady = 0; // Simplified - could add turnover timing logic

    // Leasing costs at lease-up
    const leasingCosts = m === leaseUpEndMonth
      ? income.unitCount * currentRent * (renovation.leasingCommissionPctOfNewLease / 100)
      : 0;

    // Debt service
    let debtService = 0;
    let principalPayment = 0;
    let interestPayment = 0;

    if (financing.useFinancing) {
      interestPayment = currentLoanBalance * monthlyRate;

      if (m <= financing.interestOnlyMonths) {
        debtService = interestPayment;
        principalPayment = 0;
      } else {
        debtService = monthlyPayment;
        principalPayment = monthlyPayment - interestPayment;
        currentLoanBalance = Math.max(0, currentLoanBalance - principalPayment);
      }
    }

    const cashFlowBeforeTax = noi - debtService - renoSpend - makeReady - leasingCosts;

    monthlyData.push({
      month: m,
      rent: currentRent,
      gpr,
      renoLoss,
      vacancyLoss,
      badDebtLoss,
      otherIncome,
      egi,
      fixedOpex: fixedOpexMonthly,
      mgmtFee,
      totalOpex,
      noi,
      renoSpend,
      makeReady,
      leasingCosts,
      debtService,
      principalPayment,
      interestPayment,
      cashFlowBeforeTax,
      loanBalance: currentLoanBalance,
    });
  }

  // Annual summary
  const annualSummary: AnnualSummary[] = [];
  const years = Math.ceil(acquisition.holdPeriodMonths / 12);

  for (let year = 1; year <= years; year++) {
    const startMonth = (year - 1) * 12 + 1;
    const endMonth = Math.min(year * 12, acquisition.holdPeriodMonths);
    const yearMonths = monthlyData.filter(m => m.month >= startMonth && m.month <= endMonth);

    const yearGpr = yearMonths.reduce((sum, m) => sum + m.gpr, 0);
    const yearVacancyLoss = yearMonths.reduce((sum, m) => sum + m.vacancyLoss + m.renoLoss + m.badDebtLoss, 0);
    const yearEgi = yearMonths.reduce((sum, m) => sum + m.egi, 0);
    const yearOpex = yearMonths.reduce((sum, m) => sum + m.totalOpex, 0);
    const yearNoi = yearMonths.reduce((sum, m) => sum + m.noi, 0);
    const yearDebtService = yearMonths.reduce((sum, m) => sum + m.debtService, 0);
    const yearCashFlow = yearMonths.reduce((sum, m) => sum + m.cashFlowBeforeTax, 0);

    const yearDscr = yearDebtService > 0 ? yearNoi / yearDebtService : 0;
    const yearCoc = totalEquity > 0 ? (yearCashFlow / totalEquity) * 100 : 0;

    annualSummary.push({
      year,
      gpr: yearGpr,
      vacancyLoss: yearVacancyLoss,
      egi: yearEgi,
      opex: yearOpex,
      noi: yearNoi,
      debtService: yearDebtService,
      cashFlow: yearCashFlow,
      dscr: yearDscr,
      coc: yearCoc,
    });
  }

  // Stabilized metrics (last 3 months average)
  const last3Months = monthlyData.slice(-3);
  const stabilizedNoiMonthly = last3Months.reduce((sum, m) => sum + m.noi, 0) / 3;
  const stabilizedNoiAnnual = stabilizedNoiMonthly * 12;
  const stabilizedDebtService = last3Months.reduce((sum, m) => sum + m.debtService, 0) / 3 * 12;

  // Sale analysis with guard for invalid exit cap rate
  const exitCapRateDecimal = acquisition.exitCapRate / 100;
  const isSalePriceValid = exitCapRateDecimal > 0 && isFinite(exitCapRateDecimal);
  const salePrice = isSalePriceValid ? stabilizedNoiAnnual / exitCapRateDecimal : 0;
  const saleCosts = isSalePriceValid ? salePrice * (acquisition.saleCostPct / 100) : 0;
  const loanPayoff = monthlyData[monthlyData.length - 1]?.loanBalance || 0;
  const netSaleProceeds = isSalePriceValid ? salePrice - saleCosts - loanPayoff : 0;

  const saleAnalysis: SaleAnalysis = {
    stabilizedNoi: stabilizedNoiAnnual,
    salePrice,
    salePriceDisplay: isSalePriceValid ? formatCurrency(salePrice) : "N/A (Invalid Cap Rate)",
    saleCosts,
    loanPayoff,
    netSaleProceeds,
    isValid: isSalePriceValid,
  };

  // Collect calculation warnings
  const calculationWarnings: CalculationWarning[] = [];

  if (!isSalePriceValid) {
    calculationWarnings.push({
      code: "INVALID_EXIT_CAP",
      message: "Exit cap rate is 0% or invalid. Sale price cannot be calculated.",
      severity: "error",
    });
  }

  // Cash flows for IRR
  const cashFlows = [-totalEquity];
  monthlyData.forEach((m, i) => {
    if (i === monthlyData.length - 1) {
      cashFlows.push(m.cashFlowBeforeTax + netSaleProceeds);
    } else {
      cashFlows.push(m.cashFlowBeforeTax);
    }
  });

  const totalCashFlow = monthlyData.reduce((sum, m) => sum + m.cashFlowBeforeTax, 0);
  const totalProfit = totalCashFlow + netSaleProceeds;

  const rawIrr = calculateIRR(cashFlows);
  const irr = rawIrr * 100;
  
  // IRR warning if calculation may be unreliable
  if (rawIrr === 0 && totalProfit > 0) {
    calculationWarnings.push({
      code: "IRR_CALC_FAILED",
      message: "IRR calculation did not converge. Value shown as 0%.",
      severity: "warn",
    });
  }

  const equityMultiple = totalEquity > 0 ? (totalEquity + totalProfit) / totalEquity : 0;

  // Year 1 CoC
  const year1Data = annualSummary.find(y => y.year === 1);
  const cocYear1 = year1Data ? year1Data.coc : 0;

  // Stabilized CoC (using last year)
  const lastYear = annualSummary[annualSummary.length - 1];
  const cocStabilized = lastYear ? lastYear.coc : 0;

  // DSCR - show N/A when no debt
  const hasDebt = financing.useFinancing && stabilizedDebtService > 0;
  const dscr = hasDebt ? stabilizedNoiAnnual / stabilizedDebtService : 0;
  const dscrDisplay = hasDebt ? dscr.toFixed(2) : "N/A (No Debt)";

  // Breakeven occupancy - guard against GPR = 0
  const stabilizedMonth = last3Months[0];
  const annualOpex = stabilizedMonth ? stabilizedMonth.totalOpex * 12 : 0;
  const annualGpi = stabilizedMonth ? (stabilizedMonth.gpr + stabilizedMonth.otherIncome) * 12 : 0;
  const isBreakevenValid = annualGpi > 0;
  const breakevenOccupancy = isBreakevenValid
    ? ((annualOpex + stabilizedDebtService) / annualGpi) * 100
    : 0;
  const breakevenOccupancyDisplay = isBreakevenValid 
    ? `${breakevenOccupancy.toFixed(1)}%` 
    : "N/A (No Income)";

  if (!isBreakevenValid) {
    calculationWarnings.push({
      code: "NO_INCOME_BREAKEVEN",
      message: "Gross Potential Income is 0. Breakeven occupancy cannot be calculated.",
      severity: "error",
    });
  }

  if (breakevenOccupancy > 100) {
    calculationWarnings.push({
      code: "BREAKEVEN_EXCEEDS_100",
      message: `Breakeven occupancy of ${breakevenOccupancy.toFixed(1)}% exceeds 100%. Property cannot cover expenses.`,
      severity: "error",
    });
  }

  const metrics: Metrics = {
    stabilizedNoiAnnual,
    stabilizedNoiMonthly,
    cocYear1,
    cocStabilized,
    irr,
    equityMultiple,
    dscr,
    dscrDisplay,
    breakevenOccupancy,
    breakevenOccupancyDisplay,
    totalEquityInvested: totalEquity,
    totalCashFlow,
    totalProfit,
    warnings: calculationWarnings,
  };

  // Sensitivity tables (skip for "quick" calculations to avoid recursion)
  const sensitivityTables =
    options?.includeSensitivity === false
      ? { rent: [], exitCap: [], renoBudget: [] }
      : calculateSensitivityTables(inputs);

  return {
    monthlyData,
    annualSummary,
    metrics,
    sourcesAndUses,
    saleAnalysis,
    sensitivityTables,
  };
}

function calculateSensitivityTables(inputs: UnderwritingInputs): SensitivityTables {
  const rentVariations = [-10, -5, 0, 5, 10];
  const exitCapVariations = [-1, -0.5, 0, 0.5, 1]; // percentage points
  const renoVariations = [0, 10, 20, 30];

  const rent: SensitivityRow[] = rentVariations.map(pctChange => {
    const modifiedInputs = JSON.parse(JSON.stringify(inputs)) as UnderwritingInputs;
    modifiedInputs.income.inPlaceMonthlyRentPerUnit *= (1 + pctChange / 100);
    modifiedInputs.income.marketMonthlyRentPerUnit *= (1 + pctChange / 100);
    const results = runUnderwritingQuick(modifiedInputs);
    return {
      label: pctChange === 0 ? 'Base' : `${pctChange > 0 ? '+' : ''}${pctChange}%`,
      value: pctChange,
      irr: results.irr,
      coc: results.coc,
      equityMultiple: results.equityMultiple,
    };
  });

  const exitCap: SensitivityRow[] = exitCapVariations.map(bpsChange => {
    const modifiedInputs = JSON.parse(JSON.stringify(inputs)) as UnderwritingInputs;
    modifiedInputs.acquisition.exitCapRate += bpsChange;
    const results = runUnderwritingQuick(modifiedInputs);
    return {
      label: bpsChange === 0 ? 'Base' : `${bpsChange > 0 ? '+' : ''}${bpsChange * 100} bps`,
      value: bpsChange,
      irr: results.irr,
      coc: results.coc,
      equityMultiple: results.equityMultiple,
    };
  });

  const renoBudget: SensitivityRow[] = renoVariations.map(pctIncrease => {
    const modifiedInputs = JSON.parse(JSON.stringify(inputs)) as UnderwritingInputs;
    modifiedInputs.renovation.renoBudgetTotal *= (1 + pctIncrease / 100);
    const results = runUnderwritingQuick(modifiedInputs);
    return {
      label: pctIncrease === 0 ? 'Base' : `+${pctIncrease}%`,
      value: pctIncrease,
      irr: results.irr,
      coc: results.coc,
      equityMultiple: results.equityMultiple,
    };
  });

  return { rent, exitCap, renoBudget };
}

export function runUnderwritingNoSensitivity(inputs: UnderwritingInputs): UnderwritingResults {
  return runUnderwriting(inputs, { includeSensitivity: false });
}

// Quick version for sensitivity analysis
function runUnderwritingQuick(inputs: UnderwritingInputs): { irr: number; coc: number; equityMultiple: number } {
  const results = runUnderwriting(inputs, { includeSensitivity: false });
  return {
    irr: results.metrics.irr,
    coc: results.metrics.cocYear1,
    equityMultiple: results.metrics.equityMultiple,
  };
}

// Format helpers
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatMultiple(value: number): string {
  return `${value.toFixed(2)}x`;
}

// Default inputs factory
export function getDefaultInputs(): UnderwritingInputs {
  return {
    acquisition: {
      purchasePrice: 1000000,
      closingCosts: 2,
      closingCostsIsPercent: true,
      acquisitionFee: 0,
      holdPeriodMonths: 60,
      saleCostPct: 5,
      exitCapRate: 5.5,
    },
    income: {
      unitCount: 10,
      inPlaceMonthlyRentPerUnit: 1200,
      marketMonthlyRentPerUnit: 1400,
      otherMonthlyIncome: 200,
      rentGrowthAnnualPct: 3,
      economicVacancyPct: 5,
      badDebtPct: 1,
      useMarketRentImmediately: false,
    },
    expenses: {
      propertyTaxesAnnual: 12000,
      insuranceAnnual: 6000,
      repairsMaintenanceAnnual: 6000,
      propertyMgmtPctOfEgi: 8,
      utilitiesAnnual: 3600,
      hoaAnnual: 0,
      replacementReservesAnnual: 3000,
      otherExpensesAnnual: 2400,
    },
    renovation: {
      renoBudgetTotal: 50000,
      renoDurationMonths: 6,
      renoRentLossPct: 0.5,
      leaseUpMonthsAfterReno: 3,
      leasingCommissionPctOfNewLease: 50,
      makeReadyPerUnit: 500,
    },
    financing: {
      useFinancing: true,
      loanAmount: 0,
      loanLtv: 75,
      useLtv: true,
      interestRateAnnual: 7,
      amortizationYears: 30,
      loanTermMonths: 60,
      loanOriginationFeePct: 1,
      interestOnlyMonths: 12,
    },
    tax: {
      marginalTaxRatePct: null,
      depreciationYears: 27.5,
      landValuePct: null,
      costSegregationEnabled: false,
      bonusDepreciationPct: null,
    },
  };
}
