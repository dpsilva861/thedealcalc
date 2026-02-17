/**
 * Financial Models for Lease Redline Agent
 *
 * Pure calculation functions for landlord-side lease financial analysis.
 * All models are client-side — no API calls needed.
 */

import type {
  RentEscalationInputs,
  RentEscalationResult,
  TIAmortizationInputs,
  TIAmortizationResult,
  NOIImpactInputs,
  NOIImpactResult,
  EffectiveRentInputs,
  EffectiveRentResult,
  CoTenancyImpactInputs,
  CoTenancyImpactResult,
  FinancialModelInputs,
  FinancialModelResult,
} from "./types";

// ── Rent Escalation Model ───────────────────────────────────────────

export function calculateRentEscalation(
  inputs: RentEscalationInputs
): RentEscalationResult {
  const { baseRentPSF, squareFeet, leaseTerm, escalationType, escalationRate, freeRentMonths = 0 } = inputs;

  const yearlySchedule: RentEscalationResult["yearlySchedule"] = [];
  let totalRent = 0;

  for (let year = 1; year <= leaseTerm; year++) {
    let rentPSF: number;

    switch (escalationType) {
      case "fixed_pct":
        rentPSF = baseRentPSF * Math.pow(1 + escalationRate, year - 1);
        break;
      case "cpi": {
        // Simulate CPI with floor/cap
        const cpiRate = Math.max(
          inputs.cpiFloor ?? 0,
          Math.min(inputs.cpiCap ?? 1, escalationRate)
        );
        rentPSF = baseRentPSF * Math.pow(1 + cpiRate, year - 1);
        break;
      }
      case "flat":
        rentPSF = baseRentPSF;
        break;
      case "stepped":
        // Step up by fixed amount each year
        rentPSF = baseRentPSF + escalationRate * (year - 1);
        break;
      default:
        rentPSF = baseRentPSF;
    }

    let annualRent = rentPSF * squareFeet;

    // Apply free rent in year 1
    if (year === 1 && freeRentMonths > 0) {
      const paidMonths = Math.max(0, 12 - freeRentMonths);
      annualRent = (annualRent / 12) * paidMonths;
    }

    yearlySchedule.push({
      year,
      annualRent: Math.round(annualRent * 100) / 100,
      rentPSF: Math.round(rentPSF * 100) / 100,
    });
    totalRent += annualRent;
  }

  const totalMonths = leaseTerm * 12;
  const effectiveRentPSF = totalRent / squareFeet / leaseTerm;
  const avgAnnualRent = totalRent / leaseTerm;

  return {
    yearlySchedule,
    totalRent: Math.round(totalRent * 100) / 100,
    effectiveRentPSF: Math.round(effectiveRentPSF * 100) / 100,
    avgAnnualRent: Math.round(avgAnnualRent * 100) / 100,
  };
}

// ── TI Amortization Model ───────────────────────────────────────────

export function calculateTIAmortization(
  inputs: TIAmortizationInputs
): TIAmortizationResult {
  const { tiAmount, interestRate, leaseTerm, earlyTerminationYear } = inputs;

  const monthlyRate = interestRate / 12;
  const totalMonths = leaseTerm * 12;

  // Standard amortization formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
  const monthlyPayment =
    monthlyRate > 0
      ? (tiAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1)
      : tiAmount / totalMonths;

  const totalCost = monthlyPayment * totalMonths;
  const totalInterest = totalCost - tiAmount;

  const amortizationSchedule: TIAmortizationResult["amortizationSchedule"] = [];
  let balance = tiAmount;

  for (let year = 1; year <= leaseTerm; year++) {
    let yearlyPayment = 0;
    let principalPaid = 0;
    let interestPaid = 0;

    for (let month = 0; month < 12; month++) {
      if (balance <= 0) break;
      const monthInterest = balance * monthlyRate;
      const monthPrincipal = Math.min(monthlyPayment - monthInterest, balance);
      balance -= monthPrincipal;
      yearlyPayment += monthlyPayment;
      principalPaid += monthPrincipal;
      interestPaid += monthInterest;
    }

    amortizationSchedule.push({
      year,
      balance: Math.max(0, Math.round(balance * 100) / 100),
      yearlyPayment: Math.round(yearlyPayment * 100) / 100,
      principalPaid: Math.round(principalPaid * 100) / 100,
      interestPaid: Math.round(interestPaid * 100) / 100,
    });
  }

  let unamortizedAtTermination: number | undefined;
  if (earlyTerminationYear && earlyTerminationYear <= leaseTerm) {
    const entry = amortizationSchedule[earlyTerminationYear - 1];
    unamortizedAtTermination = entry ? entry.balance : 0;
  }

  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    amortizationSchedule,
    unamortizedAtTermination,
  };
}

// ── NOI Impact Model ────────────────────────────────────────────────

export function calculateNOIImpact(inputs: NOIImpactInputs): NOIImpactResult {
  const { currentNOI, revisionImpact, impactIsPercentage, capRate } = inputs;

  const noiChange = impactIsPercentage
    ? currentNOI * revisionImpact
    : revisionImpact;
  const revisedNOI = currentNOI + noiChange;
  const noiChangePct = currentNOI > 0 ? noiChange / currentNOI : 0;

  const originalValue = capRate > 0 ? currentNOI / capRate : 0;
  const revisedValue = capRate > 0 ? revisedNOI / capRate : 0;
  const valueChange = revisedValue - originalValue;

  return {
    originalNOI: Math.round(currentNOI * 100) / 100,
    revisedNOI: Math.round(revisedNOI * 100) / 100,
    noiChange: Math.round(noiChange * 100) / 100,
    noiChangePct: Math.round(noiChangePct * 10000) / 10000,
    originalValue: Math.round(originalValue),
    revisedValue: Math.round(revisedValue),
    valueChange: Math.round(valueChange),
  };
}

// ── Effective Rent Model ────────────────────────────────────────────

export function calculateEffectiveRent(
  inputs: EffectiveRentInputs
): EffectiveRentResult {
  const {
    baseRentPSF,
    squareFeet,
    leaseTerm,
    escalationRate,
    freeRentMonths,
    tiAllowancePSF,
    landlordWorkCost = 0,
    leasingCommissionPct = 0,
  } = inputs;

  // Calculate gross rent over term with escalations
  let grossRentTotal = 0;
  for (let year = 1; year <= leaseTerm; year++) {
    const yearRentPSF = baseRentPSF * Math.pow(1 + escalationRate, year - 1);
    grossRentTotal += yearRentPSF * squareFeet;
  }

  // Subtract free rent (based on year 1 rate)
  const monthlyRentYear1 = (baseRentPSF * squareFeet) / 12;
  const freeRentCost = monthlyRentYear1 * freeRentMonths;

  // TI cost
  const tiCost = tiAllowancePSF * squareFeet;

  // Leasing commission
  const commissionCost = grossRentTotal * leasingCommissionPct;

  const totalConcessions = freeRentCost + tiCost + landlordWorkCost + commissionCost;
  const netEffectiveRentTotal = grossRentTotal - totalConcessions;

  const totalMonths = leaseTerm * 12;
  const netEffectiveRentPSF = netEffectiveRentTotal / squareFeet / leaseTerm;
  const netEffectiveRentMonthly = netEffectiveRentTotal / totalMonths;
  const landlordCostPerYear = totalConcessions / leaseTerm;

  return {
    grossRentTotal: Math.round(grossRentTotal * 100) / 100,
    totalConcessions: Math.round(totalConcessions * 100) / 100,
    netEffectiveRentTotal: Math.round(netEffectiveRentTotal * 100) / 100,
    netEffectiveRentPSF: Math.round(netEffectiveRentPSF * 100) / 100,
    netEffectiveRentMonthly: Math.round(netEffectiveRentMonthly * 100) / 100,
    landlordCostPerYear: Math.round(landlordCostPerYear * 100) / 100,
  };
}

// ── Co-Tenancy Impact Model ─────────────────────────────────────────

export function calculateCoTenancyImpact(
  inputs: CoTenancyImpactInputs
): CoTenancyImpactResult {
  const { baseAnnualRent, reducedRentPct, curePeriodMonths, probabilityOfTrigger, leaseTerm } = inputs;

  const reducedAnnualRent = baseAnnualRent * reducedRentPct;
  const maxAnnualLoss = baseAnnualRent - reducedAnnualRent;

  // Prorate for cure period (loss only during cure period per trigger event)
  const curePeriodYears = curePeriodMonths / 12;
  const maxLossPerEvent = maxAnnualLoss * curePeriodYears;

  // Expected annual loss = probability of trigger * loss per event
  const expectedAnnualLoss = probabilityOfTrigger * maxAnnualLoss;

  const maxLossOverTerm = maxAnnualLoss * Math.min(curePeriodYears, leaseTerm);
  const expectedLossOverTerm = expectedAnnualLoss * leaseTerm;

  const noiImpactPct = baseAnnualRent > 0 ? expectedAnnualLoss / baseAnnualRent : 0;

  return {
    maxAnnualLoss: Math.round(maxAnnualLoss * 100) / 100,
    expectedAnnualLoss: Math.round(expectedAnnualLoss * 100) / 100,
    maxLossOverTerm: Math.round(maxLossOverTerm * 100) / 100,
    expectedLossOverTerm: Math.round(expectedLossOverTerm * 100) / 100,
    noiImpactPct: Math.round(noiImpactPct * 10000) / 10000,
  };
}

// ── Dispatcher ──────────────────────────────────────────────────────

export function computeFinancialModel(
  model: FinancialModelInputs
): FinancialModelResult {
  switch (model.type) {
    case "rent_escalation":
      return {
        type: "rent_escalation",
        inputs: model.inputs,
        results: calculateRentEscalation(model.inputs),
      };
    case "ti_amortization":
      return {
        type: "ti_amortization",
        inputs: model.inputs,
        results: calculateTIAmortization(model.inputs),
      };
    case "noi_impact":
      return {
        type: "noi_impact",
        inputs: model.inputs,
        results: calculateNOIImpact(model.inputs),
      };
    case "effective_rent":
      return {
        type: "effective_rent",
        inputs: model.inputs,
        results: calculateEffectiveRent(model.inputs),
      };
    case "co_tenancy_impact":
      return {
        type: "co_tenancy_impact",
        inputs: model.inputs,
        results: calculateCoTenancyImpact(model.inputs),
      };
  }
}

// ── Formatting Helpers ──────────────────────────────────────────────

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrencyPrecise(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}
