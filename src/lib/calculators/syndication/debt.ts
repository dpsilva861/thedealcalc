// ============================================================
// Syndication Debt Schedule Calculations
// Loan amortization, IO periods, and balance tracking
// ============================================================

import { DebtInputs, FinancingType } from "./types";

export interface DebtScheduleRow {
  period: number;
  beginning_balance: number;
  payment: number;
  interest: number;
  principal: number;
  ending_balance: number;
  is_io_period: boolean;
}

/**
 * Calculate monthly amortizing payment using standard formula
 * PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
 */
export function calculateAmortizingPayment(
  principal: number,
  annualRate: number,
  amortMonths: number
): number {
  if (principal <= 0 || amortMonths <= 0) return 0;
  const r = annualRate / 12;
  if (r === 0) return principal / amortMonths;
  const payment = principal * (r * Math.pow(1 + r, amortMonths)) / (Math.pow(1 + r, amortMonths) - 1);
  return payment;
}

/**
 * Calculate interest-only payment for a period
 */
export function calculateIOPayment(balance: number, annualRate: number): number {
  if (balance <= 0) return 0;
  return balance * (annualRate / 12);
}

/**
 * Build complete debt schedule for the loan term
 */
export function buildDebtSchedule(
  loanAmount: number,
  debt: DebtInputs,
  termMonths: number
): DebtScheduleRow[] {
  const schedule: DebtScheduleRow[] = [];
  
  if (debt.financing_type === "none" || loanAmount <= 0) {
    // No debt - return empty schedule
    for (let t = 0; t <= termMonths; t++) {
      schedule.push({
        period: t,
        beginning_balance: 0,
        payment: 0,
        interest: 0,
        principal: 0,
        ending_balance: 0,
        is_io_period: false,
      });
    }
    return schedule;
  }

  const monthlyRate = debt.interest_rate_annual / 12;
  const amortMonths = debt.amort_years * 12;
  
  // Calculate the amortizing payment (used after IO period if applicable)
  const amortPayment = calculateAmortizingPayment(
    loanAmount,
    debt.interest_rate_annual,
    amortMonths
  );

  let balance = loanAmount;

  // Period 0 (acquisition)
  schedule.push({
    period: 0,
    beginning_balance: loanAmount,
    payment: 0,
    interest: 0,
    principal: 0,
    ending_balance: loanAmount,
    is_io_period: false,
  });

  for (let t = 1; t <= termMonths; t++) {
    const beginningBalance = balance;
    const isIO = isInterestOnlyPeriod(debt.financing_type, t, debt.interest_only_months);
    
    let payment: number;
    let interest: number;
    let principal: number;

    interest = beginningBalance * monthlyRate;

    if (isIO) {
      payment = interest;
      principal = 0;
    } else {
      // After IO period or fully amortizing
      if (debt.financing_type === "interest_only_then_amort" && t === debt.interest_only_months + 1) {
        // Recalculate payment based on remaining balance and remaining amort term
        const remainingAmortMonths = amortMonths - debt.interest_only_months;
        payment = calculateAmortizingPayment(beginningBalance, debt.interest_rate_annual, remainingAmortMonths);
      } else if (debt.financing_type === "amortizing") {
        payment = amortPayment;
      } else {
        // Use previously calculated or standard amort payment
        const remainingAmortMonths = amortMonths - (t - debt.interest_only_months - 1);
        payment = calculateAmortizingPayment(beginningBalance, debt.interest_rate_annual, Math.max(1, remainingAmortMonths));
      }
      principal = Math.min(payment - interest, beginningBalance);
    }

    balance = Math.max(0, beginningBalance - principal);

    schedule.push({
      period: t,
      beginning_balance: beginningBalance,
      payment,
      interest,
      principal,
      ending_balance: balance,
      is_io_period: isIO,
    });
  }

  return schedule;
}

/**
 * Determine if a period is in the IO phase
 */
function isInterestOnlyPeriod(
  financingType: FinancingType,
  period: number,
  ioMonths: number
): boolean {
  if (financingType === "bridge_interest_only") {
    return true; // Always IO for bridge
  }
  if (financingType === "interest_only_then_amort") {
    return period <= ioMonths;
  }
  return false; // Fully amortizing
}

/**
 * Calculate loan payoff amount at a given period
 * Includes exit fees if applicable
 */
export function calculateLoanPayoff(
  schedule: DebtScheduleRow[],
  period: number,
  exitFeePercent: number = 0
): number {
  if (period >= schedule.length) {
    return 0;
  }
  const row = schedule[period];
  const payoffBalance = row.ending_balance;
  const exitFee = payoffBalance * exitFeePercent;
  return payoffBalance + exitFee;
}

/**
 * Calculate DSCR for a given period
 */
export function calculateDSCR(noi: number, debtService: number): number {
  if (debtService <= 0) return 0;
  return noi / debtService;
}

/**
 * Calculate debt yield
 */
export function calculateDebtYield(annualNOI: number, loanAmount: number): number {
  if (loanAmount <= 0) return 0;
  return annualNOI / loanAmount;
}
