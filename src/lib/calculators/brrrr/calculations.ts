// BRRRR Calculator Core Calculations
// All calculation logic for the BRRRR investment strategy

import { BRRRRInputs, BRRRRResults, BRRRRRiskFlag, BRRRRSensitivityCell } from "./types";
import { CalculatorWarning } from "../types";

export const BRRRR_CALCULATION_VERSION = "1.0.0";

/**
 * Safely ensure a number is valid (not NaN, not Infinity for display purposes)
 * Returns the value if finite, otherwise returns the fallback
 */
function safeNumber(value: number, fallback: number = 0): number {
  if (!isFinite(value) || isNaN(value)) return fallback;
  return value;
}

/**
 * Calculate standard mortgage payment (PMT)
 */
function calculatePMT(principal: number, annualRate: number, termMonths: number): number {
  if (principal <= 0 || termMonths <= 0) return 0;
  if (annualRate <= 0) return principal / termMonths;
  
  const monthlyRate = annualRate / 12;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
         (Math.pow(1 + monthlyRate, termMonths) - 1);
}

/**
 * Run complete BRRRR analysis
 */
export function runBRRRRAnalysis(inputs: BRRRRInputs): BRRRRResults {
  const warnings: CalculatorWarning[] = [];
  const riskFlags: BRRRRRiskFlag[] = [];

  // === HOLDING PHASE ===
  const { acquisition, bridgeFinancing, afterRepairValue, refinance, rentalOperations } = inputs;

  // Calculate closing costs
  const closingCostsAmount = bridgeFinancing.downPaymentPct > 0 || acquisition.closingCostsIsPercent
    ? (acquisition.closingCostsIsPercent 
        ? acquisition.purchasePrice * (acquisition.closingCosts / 100)
        : acquisition.closingCosts)
    : acquisition.closingCosts;

  // Bridge loan calculations
  const downPaymentAmount = acquisition.purchasePrice * bridgeFinancing.downPaymentPct;
  const bridgeLoanAmount = acquisition.purchasePrice - downPaymentAmount;
  const pointsAmount = bridgeLoanAmount * bridgeFinancing.pointsPct;

  // Monthly bridge payment
  let monthlyBridgePayment = 0;
  if (bridgeLoanAmount > 0) {
    if (bridgeFinancing.isInterestOnly) {
      monthlyBridgePayment = (bridgeLoanAmount * bridgeFinancing.interestRate) / 12;
    } else {
      monthlyBridgePayment = calculatePMT(
        bridgeLoanAmount,
        bridgeFinancing.interestRate,
        bridgeFinancing.loanTermMonths
      );
    }
  }

  const totalBridgePayments = monthlyBridgePayment * acquisition.holdingPeriodMonths;
  const totalHoldingCosts = acquisition.monthlyHoldingCosts * acquisition.holdingPeriodMonths;
  const totalRehabCost = acquisition.rehabBudget;

  // Total cash in before refinance
  const totalCashIn = 
    downPaymentAmount +
    closingCostsAmount +
    totalRehabCost +
    totalHoldingCosts +
    totalBridgePayments +
    pointsAmount;

  // === REFINANCE ===
  const arv = afterRepairValue.arv;
  const maxRefiLoan = arv * refinance.refiLtvPct;

  // Refi closing costs
  const refiClosingCostsAmount = refinance.refiClosingCostsIsPercent
    ? maxRefiLoan * (refinance.refiClosingCosts / 100)
    : refinance.refiClosingCosts;

  // Outstanding bridge loan balance (for interest-only, full principal remains)
  const outstandingBridgeBalance = bridgeFinancing.isInterestOnly
    ? bridgeLoanAmount
    : calculateRemainingBalance(
        bridgeLoanAmount,
        bridgeFinancing.interestRate,
        bridgeFinancing.loanTermMonths,
        acquisition.holdingPeriodMonths
      );

  // Cash out calculation
  let netRefiProceeds = maxRefiLoan - outstandingBridgeBalance;
  let remainingCashInDeal: number;

  if (refinance.rollClosingCostsIntoLoan) {
    // Closing costs reduce cash out
    netRefiProceeds = netRefiProceeds - refiClosingCostsAmount;
    remainingCashInDeal = totalCashIn - Math.max(0, netRefiProceeds);
  } else {
    // Closing costs add to cash in
    remainingCashInDeal = totalCashIn + refiClosingCostsAmount - Math.max(0, netRefiProceeds);
  }

  const cashOut = Math.max(0, netRefiProceeds);

  // New monthly payment after refi
  const newMonthlyPayment = calculatePMT(
    maxRefiLoan,
    refinance.refiInterestRate,
    refinance.refiTermYears * 12
  );

  // === RENTAL OPERATIONS ===
  const grossMonthlyRent = rentalOperations.monthlyRent;
  const vacancyLoss = grossMonthlyRent * rentalOperations.vacancyPct;
  const effectiveGrossIncome = grossMonthlyRent - vacancyLoss;

  // Calculate expense base
  const expenseBase = rentalOperations.expenseBase === "egi" 
    ? effectiveGrossIncome 
    : grossMonthlyRent;

  // Variable expenses based on selected base
  const propertyManagement = expenseBase * rentalOperations.propertyManagementPct;
  const maintenance = expenseBase * rentalOperations.maintenancePct;

  // Fixed expenses
  const fixedExpenses = 
    rentalOperations.insuranceMonthly +
    rentalOperations.propertyTaxesMonthly +
    rentalOperations.utilitiesMonthly +
    rentalOperations.hoaMonthly +
    rentalOperations.otherMonthly;

  const monthlyExpenses = propertyManagement + maintenance + fixedExpenses;
  const monthlyNOI = effectiveGrossIncome - monthlyExpenses;
  const annualNOI = monthlyNOI * 12;

  const monthlyDebtService = newMonthlyPayment;
  const monthlyCashFlow = monthlyNOI - monthlyDebtService;
  const annualCashFlow = monthlyCashFlow * 12;

  // === METRICS ===
  let cashOnCashReturn = 0;
  if (remainingCashInDeal > 0) {
    cashOnCashReturn = annualCashFlow / remainingCashInDeal;
  } else if (annualCashFlow > 0) {
    // Infinite CoC (no money in deal, positive cash flow)
    cashOnCashReturn = Infinity;
  }

  let dscr = 0;
  if (monthlyDebtService > 0) {
    dscr = monthlyNOI / monthlyDebtService;
  } else {
    dscr = Infinity; // No debt
  }

  const capRate = arv > 0 ? annualNOI / arv : 0;
  const equityCreated = arv - acquisition.purchasePrice - totalRehabCost;
  
  let totalROI = 0;
  if (totalCashIn > 0) {
    totalROI = (cashOut + annualCashFlow + equityCreated) / totalCashIn;
  }

  let equityMultiple = 0;
  if (remainingCashInDeal > 0) {
    equityMultiple = (remainingCashInDeal + annualCashFlow * 5) / remainingCashInDeal; // 5-year estimate
  }

  // === RISK FLAGS ===
  if (dscr < 1.2 && dscr !== Infinity) {
    riskFlags.push({
      code: "LOW_DSCR",
      message: `DSCR of ${dscr.toFixed(2)} is below 1.20 threshold`,
      severity: "warning",
    });
  }

  if (monthlyCashFlow < 0) {
    riskFlags.push({
      code: "NEGATIVE_CASH_FLOW",
      message: `Negative monthly cash flow of ${formatCurrency(monthlyCashFlow)}`,
      severity: "error",
    });
  }

  const cashInRatio = remainingCashInDeal / totalCashIn;
  if (cashInRatio > 0.25 && totalCashIn > 0) {
    riskFlags.push({
      code: "HIGH_CASH_IN",
      message: `${(cashInRatio * 100).toFixed(0)}% of total cash remains in deal (>25%)`,
      severity: "warning",
    });
  }

  const purchaseToArvRatio = acquisition.purchasePrice / arv;
  if (purchaseToArvRatio > 0.75 && arv > 0) {
    riskFlags.push({
      code: "HIGH_PURCHASE_RATIO",
      message: `Purchase price is ${(purchaseToArvRatio * 100).toFixed(0)}% of ARV (>75%)`,
      severity: "warning",
    });
  }

  const allInCost = acquisition.purchasePrice + totalRehabCost + closingCostsAmount;
  if (allInCost > arv && arv > 0) {
    riskFlags.push({
      code: "ALL_IN_EXCEEDS_ARV",
      message: `All-in cost (${formatCurrency(allInCost)}) exceeds ARV`,
      severity: "error",
    });
  }

  // === SENSITIVITY TABLE ===
  const sensitivity = calculateSensitivityTable(inputs);

  return {
    holdingPhase: {
      bridgeLoanAmount: safeNumber(bridgeLoanAmount),
      monthlyBridgePayment: safeNumber(monthlyBridgePayment),
      totalBridgePayments: safeNumber(totalBridgePayments),
      totalHoldingCosts: safeNumber(totalHoldingCosts),
      totalRehabCost: safeNumber(totalRehabCost),
      closingCostsAmount: safeNumber(closingCostsAmount),
      pointsAmount: safeNumber(pointsAmount),
      totalCashIn: safeNumber(totalCashIn),
    },
    refinance: {
      maxRefiLoan: safeNumber(maxRefiLoan),
      refiClosingCostsAmount: safeNumber(refiClosingCostsAmount),
      netRefiProceeds: safeNumber(netRefiProceeds),
      cashOut: safeNumber(cashOut),
      remainingCashInDeal: safeNumber(remainingCashInDeal),
      newMonthlyPayment: safeNumber(newMonthlyPayment),
    },
    rental: {
      grossMonthlyRent: safeNumber(grossMonthlyRent),
      effectiveGrossIncome: safeNumber(effectiveGrossIncome),
      monthlyExpenses: safeNumber(monthlyExpenses),
      monthlyNOI: safeNumber(monthlyNOI),
      annualNOI: safeNumber(annualNOI),
      monthlyDebtService: safeNumber(monthlyDebtService),
      monthlyCashFlow: safeNumber(monthlyCashFlow),
      annualCashFlow: safeNumber(annualCashFlow),
    },
    metrics: {
      cashOnCashReturn: safeNumber(cashOnCashReturn),
      dscr: safeNumber(dscr),
      capRate: safeNumber(capRate),
      totalROI: safeNumber(totalROI),
      equityCreated: safeNumber(equityCreated),
      equityMultiple: safeNumber(equityMultiple),
    },
    riskFlags,
    sensitivity,
    warnings,
  };
}

/**
 * Calculate remaining loan balance after n payments
 */
function calculateRemainingBalance(
  principal: number,
  annualRate: number,
  totalMonths: number,
  paymentsMade: number
): number {
  if (principal <= 0 || paymentsMade >= totalMonths) return 0;
  if (annualRate <= 0) return principal * (1 - paymentsMade / totalMonths);

  const monthlyRate = annualRate / 12;
  const pmt = calculatePMT(principal, annualRate, totalMonths);
  
  return principal * Math.pow(1 + monthlyRate, paymentsMade) - 
         pmt * ((Math.pow(1 + monthlyRate, paymentsMade) - 1) / monthlyRate);
}

/**
 * Generate 3x3 sensitivity table
 */
function calculateSensitivityTable(inputs: BRRRRInputs): {
  rentVariations: number[];
  arvVariations: number[];
  cells: BRRRRSensitivityCell[][];
} {
  const rentVariations = [-0.10, 0, 0.10]; // -10%, base, +10%
  const arvVariations = [-0.05, 0, 0.05]; // -5%, base, +5%

  const cells: BRRRRSensitivityCell[][] = [];

  for (let r = 0; r < rentVariations.length; r++) {
    const row: BRRRRSensitivityCell[] = [];
    
    for (let a = 0; a < arvVariations.length; a++) {
      const modifiedInputs: BRRRRInputs = {
        ...inputs,
        rentalOperations: {
          ...inputs.rentalOperations,
          monthlyRent: inputs.rentalOperations.monthlyRent * (1 + rentVariations[r]),
        },
        afterRepairValue: {
          arv: inputs.afterRepairValue.arv * (1 + arvVariations[a]),
        },
      };

      const result = runBRRRRQuick(modifiedInputs);
      
      row.push({
        rent: modifiedInputs.rentalOperations.monthlyRent,
        arv: modifiedInputs.afterRepairValue.arv,
        monthlyCashFlow: result.monthlyCashFlow,
        cashOnCash: result.cashOnCash,
        remainingCashIn: result.remainingCashIn,
      });
    }
    
    cells.push(row);
  }

  return { rentVariations, arvVariations, cells };
}

/**
 * Quick calculation for sensitivity analysis (standalone - does NOT call runBRRRRAnalysis)
 * This prevents infinite recursion: runBRRRRAnalysis -> calculateSensitivityTable -> runBRRRRQuick
 */
function runBRRRRQuick(inputs: BRRRRInputs): {
  monthlyCashFlow: number;
  cashOnCash: number;
  remainingCashIn: number;
} {
  const { acquisition, bridgeFinancing, afterRepairValue, refinance, rentalOperations } = inputs;

  // === Calculate closing costs ===
  const closingCostsAmount = acquisition.closingCostsIsPercent
    ? acquisition.purchasePrice * (acquisition.closingCosts / 100)
    : acquisition.closingCosts;

  // === Bridge loan calculations ===
  const downPaymentAmount = acquisition.purchasePrice * bridgeFinancing.downPaymentPct;
  const bridgeLoanAmount = acquisition.purchasePrice - downPaymentAmount;
  const pointsAmount = bridgeLoanAmount * bridgeFinancing.pointsPct;

  let monthlyBridgePayment = 0;
  if (bridgeLoanAmount > 0) {
    if (bridgeFinancing.isInterestOnly) {
      monthlyBridgePayment = (bridgeLoanAmount * bridgeFinancing.interestRate) / 12;
    } else {
      monthlyBridgePayment = calculatePMT(
        bridgeLoanAmount,
        bridgeFinancing.interestRate,
        bridgeFinancing.loanTermMonths
      );
    }
  }

  const totalBridgePayments = monthlyBridgePayment * acquisition.holdingPeriodMonths;
  const totalHoldingCosts = acquisition.monthlyHoldingCosts * acquisition.holdingPeriodMonths;

  // Total cash in before refinance
  const totalCashIn =
    downPaymentAmount +
    closingCostsAmount +
    acquisition.rehabBudget +
    totalHoldingCosts +
    totalBridgePayments +
    pointsAmount;

  // === Refinance calculations ===
  const arv = afterRepairValue.arv;
  const maxRefiLoan = arv * refinance.refiLtvPct;

  const refiClosingCostsAmount = refinance.refiClosingCostsIsPercent
    ? maxRefiLoan * (refinance.refiClosingCosts / 100)
    : refinance.refiClosingCosts;

  // For quick calc, assume interest-only bridge (full principal remains)
  const outstandingBridgeBalance = bridgeFinancing.isInterestOnly
    ? bridgeLoanAmount
    : bridgeLoanAmount; // Simplified for quick calc

  let netRefiProceeds = maxRefiLoan - outstandingBridgeBalance;
  let remainingCashIn: number;

  if (refinance.rollClosingCostsIntoLoan) {
    netRefiProceeds = netRefiProceeds - refiClosingCostsAmount;
    remainingCashIn = totalCashIn - Math.max(0, netRefiProceeds);
  } else {
    remainingCashIn = totalCashIn + refiClosingCostsAmount - Math.max(0, netRefiProceeds);
  }

  const newMonthlyPayment = calculatePMT(
    maxRefiLoan,
    refinance.refiInterestRate,
    refinance.refiTermYears * 12
  );

  // === Rental calculations ===
  const grossMonthlyRent = rentalOperations.monthlyRent;
  const effectiveGrossIncome = grossMonthlyRent * (1 - rentalOperations.vacancyPct);

  const expenseBase = rentalOperations.expenseBase === "egi"
    ? effectiveGrossIncome
    : grossMonthlyRent;

  const monthlyExpenses =
    expenseBase * rentalOperations.propertyManagementPct +
    expenseBase * rentalOperations.maintenancePct +
    rentalOperations.insuranceMonthly +
    rentalOperations.propertyTaxesMonthly +
    rentalOperations.utilitiesMonthly +
    rentalOperations.hoaMonthly +
    rentalOperations.otherMonthly;

  const monthlyNOI = effectiveGrossIncome - monthlyExpenses;
  const monthlyCashFlow = monthlyNOI - newMonthlyPayment;
  const annualCashFlow = monthlyCashFlow * 12;

  // === Calculate cash-on-cash ===
  let cashOnCash = 0;
  if (remainingCashIn > 0) {
    cashOnCash = annualCashFlow / remainingCashIn;
  } else if (annualCashFlow > 0) {
    cashOnCash = Infinity;
  }

  return {
    monthlyCashFlow: safeNumber(monthlyCashFlow),
    cashOnCash: safeNumber(cashOnCash),
    remainingCashIn: safeNumber(remainingCashIn),
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
