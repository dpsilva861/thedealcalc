// BRRRR Calculator Presets
// Pre-configured scenarios for common BRRRR deal profiles

import { BRRRRPreset, BRRRRInputs } from "./types";

export const BRRRR_PRESETS: BRRRRPreset[] = [
  {
    id: "typical",
    name: "Typical BRRRR (Moderate Rehab)",
    description: "Standard BRRRR deal with moderate renovation scope",
    inputs: {
      acquisition: {
        purchasePrice: 220000,
        closingCosts: 2.5,
        closingCostsIsPercent: true,
        rehabBudget: 45000,
        monthlyHoldingCosts: 900,
        holdingPeriodMonths: 4,
      },
      bridgeFinancing: {
        downPaymentPct: 0.20,
        interestRate: 0.115,
        loanTermMonths: 12,
        isInterestOnly: true,
        pointsPct: 0.02,
      },
      afterRepairValue: {
        arv: 320000,
      },
      refinance: {
        refiLtvPct: 0.75,
        refiInterestRate: 0.0675,
        refiTermYears: 30,
        refiClosingCosts: 2,
        refiClosingCostsIsPercent: true,
        rollClosingCostsIntoLoan: false,
      },
      rentalOperations: {
        monthlyRent: 2450,
        vacancyPct: 0.05,
        propertyManagementPct: 0.08,
        maintenancePct: 0.07,
        expenseBase: "egi",
        insuranceMonthly: 135,
        propertyTaxesMonthly: 250,
        utilitiesMonthly: 0,
        hoaMonthly: 0,
        otherMonthly: 0,
      },
    },
  },
  {
    id: "conservative",
    name: "Conservative BRRRR",
    description: "Lower risk profile with higher reserves",
    inputs: {
      acquisition: {
        purchasePrice: 230000,
        closingCosts: 3,
        closingCostsIsPercent: true,
        rehabBudget: 55000,
        monthlyHoldingCosts: 1050,
        holdingPeriodMonths: 6,
      },
      bridgeFinancing: {
        downPaymentPct: 0.25,
        interestRate: 0.12,
        loanTermMonths: 12,
        isInterestOnly: true,
        pointsPct: 0.02,
      },
      afterRepairValue: {
        arv: 315000,
      },
      refinance: {
        refiLtvPct: 0.70,
        refiInterestRate: 0.07,
        refiTermYears: 30,
        refiClosingCosts: 2.5,
        refiClosingCostsIsPercent: true,
        rollClosingCostsIntoLoan: false,
      },
      rentalOperations: {
        monthlyRent: 2250,
        vacancyPct: 0.07,
        propertyManagementPct: 0.10,
        maintenancePct: 0.10,
        expenseBase: "egi",
        insuranceMonthly: 150,
        propertyTaxesMonthly: 275,
        utilitiesMonthly: 0,
        hoaMonthly: 0,
        otherMonthly: 0,
      },
    },
  },
  {
    id: "aggressive",
    name: "Aggressive BRRRR",
    description: "Higher leverage, faster timeline",
    inputs: {
      acquisition: {
        purchasePrice: 200000,
        closingCosts: 2,
        closingCostsIsPercent: true,
        rehabBudget: 35000,
        monthlyHoldingCosts: 850,
        holdingPeriodMonths: 3,
      },
      bridgeFinancing: {
        downPaymentPct: 0.15,
        interestRate: 0.105,
        loanTermMonths: 12,
        isInterestOnly: true,
        pointsPct: 0.015,
      },
      afterRepairValue: {
        arv: 340000,
      },
      refinance: {
        refiLtvPct: 0.80,
        refiInterestRate: 0.065,
        refiTermYears: 30,
        refiClosingCosts: 1.5,
        refiClosingCostsIsPercent: true,
        rollClosingCostsIntoLoan: true,
      },
      rentalOperations: {
        monthlyRent: 2650,
        vacancyPct: 0.05,
        propertyManagementPct: 0.08,
        maintenancePct: 0.06,
        expenseBase: "egi",
        insuranceMonthly: 125,
        propertyTaxesMonthly: 230,
        utilitiesMonthly: 0,
        hoaMonthly: 0,
        otherMonthly: 0,
      },
    },
  },
];

export const getDefaultBRRRRInputs = (): BRRRRInputs => {
  return {
    acquisition: {
      purchasePrice: 0,
      closingCosts: 2.5,
      closingCostsIsPercent: true,
      rehabBudget: 0,
      monthlyHoldingCosts: 0,
      holdingPeriodMonths: 4,
    },
    bridgeFinancing: {
      downPaymentPct: 0.20,
      interestRate: 0.11,
      loanTermMonths: 12,
      isInterestOnly: true,
      pointsPct: 0.02,
    },
    afterRepairValue: {
      arv: 0,
    },
    refinance: {
      refiLtvPct: 0.75,
      refiInterestRate: 0.07,
      refiTermYears: 30,
      refiClosingCosts: 2,
      refiClosingCostsIsPercent: true,
      rollClosingCostsIntoLoan: false,
    },
    rentalOperations: {
      monthlyRent: 0,
      vacancyPct: 0.05,
      propertyManagementPct: 0.08,
      maintenancePct: 0.07,
      expenseBase: "egi",
      insuranceMonthly: 0,
      propertyTaxesMonthly: 0,
      utilitiesMonthly: 0,
      hoaMonthly: 0,
      otherMonthly: 0,
    },
  };
};

export const getBRRRRPresetById = (id: string): BRRRRPreset | undefined => {
  return BRRRR_PRESETS.find((preset) => preset.id === id);
};
