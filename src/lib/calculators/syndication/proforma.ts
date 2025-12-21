// ============================================================
// Syndication Pro Forma Calculations
// Build period-by-period cash flow schedule
// ============================================================

import {
  SyndicationInputs,
  SourcesAndUses,
  PeriodCashFlow,
  SyndicationWarning,
} from "./types";

/**
 * Calculate sources and uses for the deal
 */
export function calculateSourcesAndUses(inputs: SyndicationInputs): SourcesAndUses {
  const { acquisition, debt, equity } = inputs;

  // Calculate closing costs
  const closing_costs =
    acquisition.closing_costs_mode === "percent"
      ? acquisition.purchase_price * acquisition.closing_costs_pct
      : acquisition.closing_costs_amount;

  // Calculate total uses (before knowing equity, use iterative if needed for pct of equity fee)
  let total_uses_preliminary =
    acquisition.purchase_price +
    closing_costs +
    acquisition.capex_budget_total +
    acquisition.initial_reserves +
    acquisition.organizational_costs;

  // Loan amount
  let loan_amount = 0;
  if (debt.financing_type !== "none") {
    if (debt.loan_amount_mode === "amount") {
      loan_amount = debt.loan_amount;
    } else if (debt.loan_amount_mode === "LTV") {
      loan_amount = acquisition.purchase_price * debt.ltv_or_ltc_pct;
    } else if (debt.loan_amount_mode === "LTC") {
      // LTC needs total cost, which includes capex
      const basis =
        debt.loan_value_basis === "purchase_price"
          ? acquisition.purchase_price
          : total_uses_preliminary;
      loan_amount = basis * debt.ltv_or_ltc_pct;
    }
  }

  // Lender fees (points on loan)
  const lender_fees = loan_amount * acquisition.lender_fees_pct;

  // Equity required (before acquisition fee if pct of equity)
  const equity_before_acq_fee = total_uses_preliminary + lender_fees - loan_amount;

  // Acquisition fee
  let acquisition_fee = 0;
  if (acquisition.acquisition_fee_mode === "amount") {
    acquisition_fee = acquisition.acquisition_fee_value;
  } else if (acquisition.acquisition_fee_mode === "percent_of_purchase") {
    acquisition_fee = acquisition.purchase_price * acquisition.acquisition_fee_value;
  } else if (acquisition.acquisition_fee_mode === "percent_of_equity") {
    // Iterative solve: fee is % of total equity, but total equity includes fee
    // equity_total = equity_before + fee = equity_before + equity_total * pct
    // equity_total - equity_total * pct = equity_before
    // equity_total * (1 - pct) = equity_before
    // equity_total = equity_before / (1 - pct)
    const pct = acquisition.acquisition_fee_value;
    if (pct < 1) {
      const equity_total_with_fee = equity_before_acq_fee / (1 - pct);
      acquisition_fee = equity_total_with_fee - equity_before_acq_fee;
    } else {
      acquisition_fee = 0;
    }
  }

  // Final totals
  const total_uses =
    acquisition.purchase_price +
    closing_costs +
    acquisition_fee +
    acquisition.capex_budget_total +
    acquisition.initial_reserves +
    lender_fees +
    acquisition.organizational_costs;

  const total_equity = total_uses - loan_amount;

  // Split equity between LP and GP
  let lp_equity: number;
  let gp_equity: number;

  if (equity.use_explicit_amounts) {
    lp_equity = equity.lp_equity_amount;
    gp_equity = equity.gp_equity_amount;
    // If amounts don't add up, scale proportionally
    const provided_total = lp_equity + gp_equity;
    if (provided_total > 0 && Math.abs(provided_total - total_equity) > 1) {
      const scale = total_equity / provided_total;
      lp_equity *= scale;
      gp_equity *= scale;
    }
  } else {
    lp_equity = total_equity * equity.lp_equity_pct;
    gp_equity = total_equity * equity.gp_equity_pct;
  }

  return {
    purchase_price: acquisition.purchase_price,
    closing_costs,
    acquisition_fee,
    capex_budget: acquisition.capex_budget_total,
    initial_reserves: acquisition.initial_reserves,
    lender_fees,
    organizational_costs: acquisition.organizational_costs,
    total_uses,
    loan_amount,
    lp_equity,
    gp_equity,
    total_equity,
    total_sources: loan_amount + total_equity,
  };
}

/**
 * Calculate monthly debt service payment
 */
function calculateAmortizingPayment(
  balance: number,
  annualRate: number,
  amortMonths: number
): number {
  if (balance <= 0 || amortMonths <= 0) return 0;
  const r = annualRate / 12;
  if (r === 0) return balance / amortMonths;
  const payment = balance * (r * Math.pow(1 + r, amortMonths)) / (Math.pow(1 + r, amortMonths) - 1);
  return payment;
}

/**
 * Build full period-by-period cash flow schedule
 */
export function buildCashFlows(
  inputs: SyndicationInputs,
  sourcesAndUses: SourcesAndUses
): { cashFlows: PeriodCashFlow[]; warnings: SyndicationWarning[] } {
  const warnings: SyndicationWarning[] = [];
  const { debt, proforma, exit, acquisition } = inputs;
  const holdPeriods = inputs.hold_period_months;

  const cashFlows: PeriodCashFlow[] = [];

  // Initialize state
  let loanBalance = sourcesAndUses.loan_amount;
  let reserveBalance = sourcesAndUses.initial_reserves;

  // Track contributions
  let lpContributed = 0;
  let gpContributed = 0;

  // Monthly growth factors
  const rentGrowthMonthly = Math.pow(1 + proforma.rent_growth_annual, 1 / 12);
  const expenseGrowthMonthly = Math.pow(1 + proforma.expense_growth_annual, 1 / 12);
  const otherIncomeGrowthMonthly = Math.pow(1 + proforma.other_income_growth_annual, 1 / 12);

  // Calculate base rent
  let currentRent =
    proforma.rent_roll_mode === "single_unit"
      ? proforma.gross_scheduled_rent_month1
      : proforma.unit_count * proforma.avg_rent_month1;
  let currentOtherIncome = proforma.other_income_month1;

  // Expense line monthly amounts
  let expenseAmounts = proforma.expense_lines.map((e) => e.annual_amount / 12);

  // Calculate amortizing payment (used after IO period)
  const amortPayment = calculateAmortizingPayment(
    sourcesAndUses.loan_amount,
    debt.interest_rate_annual,
    debt.amort_years * 12
  );

  // Capex schedule: track remaining capex
  let remainingCapex = acquisition.capex_budget_total;
  const capexPerMonth =
    acquisition.capex_schedule_mode === "linear" && acquisition.capex_months > 0
      ? acquisition.capex_budget_total / acquisition.capex_months
      : 0;

  // Period 0: Acquisition
  const period0: PeriodCashFlow = {
    period: 0,
    gross_potential_rent: 0,
    vacancy_loss: 0,
    bad_debt: 0,
    concessions: 0,
    other_income: 0,
    effective_gross_income: 0,
    operating_expenses: 0,
    property_management_fee: 0,
    noi: 0,
    asset_management_fee: 0,
    replacement_reserves: 0,
    reserve_top_up: 0,
    ncf_before_debt: 0,
    debt_service: 0,
    interest_payment: 0,
    principal_payment: 0,
    loan_balance_ending: loanBalance,
    ncf_after_debt: 0,
    cash_available_for_distribution: 0,
    lp_contribution: -sourcesAndUses.lp_equity,
    gp_contribution: -sourcesAndUses.gp_equity,
    is_sale_period: false,
    is_refi_period: false,
    sale_proceeds: 0,
    refi_cash_out: 0,
    reserve_balance: reserveBalance,
  };
  lpContributed = sourcesAndUses.lp_equity;
  gpContributed = sourcesAndUses.gp_equity;

  // Handle upfront capex
  if (acquisition.capex_schedule_mode === "upfront") {
    remainingCapex = 0;
    // Capex is already funded at close via uses
  }

  cashFlows.push(period0);

  // Operating periods (1 to holdPeriods)
  for (let t = 1; t <= holdPeriods; t++) {
    // Grow rent and other income
    if (t > 1) {
      currentRent *= rentGrowthMonthly;
      currentOtherIncome *= otherIncomeGrowthMonthly;
      expenseAmounts = expenseAmounts.map((e) => e * expenseGrowthMonthly);
    }

    // Income
    const gpr = currentRent;
    const vacancyLoss = gpr * proforma.vacancy_rate;
    const badDebt = gpr * proforma.bad_debt_rate;
    const concessions = gpr * proforma.concessions_rate;
    const egi = gpr - vacancyLoss - badDebt - concessions + currentOtherIncome;

    // Expenses
    const opex = expenseAmounts.reduce((sum, e) => sum + e, 0);
    const pmFee =
      proforma.property_management_fee_mode === "percent"
        ? egi * proforma.property_management_fee_pct
        : proforma.property_management_fee_amount;

    const noi = egi - opex - pmFee;

    // Asset management fee
    const amFee =
      proforma.asset_management_fee_mode === "percent"
        ? egi * proforma.asset_management_fee_pct
        : proforma.asset_management_fee_amount;

    // Replacement reserves
    const replReserves = proforma.replacement_reserves_monthly;

    // Capex draw (linear schedule)
    let capexDraw = 0;
    if (
      acquisition.capex_schedule_mode === "linear" &&
      t <= acquisition.capex_months &&
      remainingCapex > 0
    ) {
      capexDraw = Math.min(capexPerMonth, remainingCapex);
      remainingCapex -= capexDraw;
    }

    // NCF before debt
    const ncfBeforeDebt = noi - amFee - replReserves - capexDraw;

    // Debt service
    let debtService = 0;
    let interestPayment = 0;
    let principalPayment = 0;

    if (debt.financing_type !== "none" && loanBalance > 0) {
      interestPayment = loanBalance * (debt.interest_rate_annual / 12);

      const isIO =
        debt.financing_type === "bridge_interest_only" ||
        (debt.financing_type === "interest_only_then_amort" && t <= debt.interest_only_months);

      if (isIO) {
        debtService = interestPayment;
        principalPayment = 0;
      } else {
        // Amortizing
        debtService = amortPayment;
        principalPayment = Math.min(debtService - interestPayment, loanBalance);
        // Recalculate interest based on current balance if balance changed due to refi
      }

      loanBalance = Math.max(0, loanBalance - principalPayment);
    }

    const ncfAfterDebt = ncfBeforeDebt - debtService;

    // Reserve top-up (if NCF negative, draw from reserves; if positive, build reserves)
    let reserveTopUp = 0;
    if (ncfAfterDebt < 0) {
      // Draw from reserves
      const draw = Math.min(Math.abs(ncfAfterDebt), reserveBalance);
      reserveBalance -= draw;
      reserveTopUp = -draw;
    } else {
      // Add to replacement reserves
      reserveBalance += replReserves;
    }

    // Cash available for distribution
    let cad = Math.max(0, ncfAfterDebt);

    // Check for refi event
    let isRefiPeriod = false;
    let refiCashOut = 0;
    if (exit.refinance_enabled && t === exit.refinance_month) {
      isRefiPeriod = true;
      // Calculate refi
      const annualNOI = noi * 12;
      // Simple approach: refi LTV on current value (based on exit cap as proxy)
      const estimatedValue = exit.exit_cap_rate > 0 ? annualNOI / exit.exit_cap_rate : 0;
      const newLoanAmount = estimatedValue * exit.refi_ltv;
      const closingCostsRefi = newLoanAmount * 0.02; // assume 2% closing
      refiCashOut = Math.max(0, newLoanAmount - loanBalance - closingCostsRefi);
      loanBalance = newLoanAmount;
      // Refi cash out added to CAD if through waterfall, else separate event
      if (exit.refi_cash_out_through_waterfall) {
        cad += refiCashOut;
      }
    }

    // Check for sale event
    let isSalePeriod = false;
    let saleProceeds = 0;
    if (t === exit.sale_month) {
      isSalePeriod = true;

      // Calculate sale price
      const annualNOI = noi * 12; // use current period NOI annualized
      const salePrice =
        exit.exit_mode === "cap_rate" && exit.exit_cap_rate > 0
          ? annualNOI / exit.exit_cap_rate
          : exit.exit_price;

      const saleCosts = salePrice * exit.sale_cost_pct;
      const dispFee =
        exit.disposition_fee_mode === "percent"
          ? salePrice * exit.disposition_fee_pct
          : exit.disposition_fee_amount;

      // Loan payoff
      const exitFee = loanBalance * debt.exit_fee_pct;
      const loanPayoff = loanBalance + exitFee;

      // Return reserves
      const reservesReturned = reserveBalance;
      reserveBalance = 0;

      saleProceeds = salePrice - saleCosts - dispFee - loanPayoff + reservesReturned;
      loanBalance = 0;

      cad += saleProceeds;
    }

    const periodCF: PeriodCashFlow = {
      period: t,
      gross_potential_rent: gpr,
      vacancy_loss: vacancyLoss,
      bad_debt: badDebt,
      concessions,
      other_income: currentOtherIncome,
      effective_gross_income: egi,
      operating_expenses: opex,
      property_management_fee: pmFee,
      noi,
      asset_management_fee: amFee,
      replacement_reserves: replReserves,
      reserve_top_up: reserveTopUp,
      ncf_before_debt: ncfBeforeDebt,
      debt_service: debtService,
      interest_payment: interestPayment,
      principal_payment: principalPayment,
      loan_balance_ending: loanBalance,
      ncf_after_debt: ncfAfterDebt,
      cash_available_for_distribution: cad,
      lp_contribution: 0,
      gp_contribution: 0,
      is_sale_period: isSalePeriod,
      is_refi_period: isRefiPeriod,
      sale_proceeds: saleProceeds,
      refi_cash_out: refiCashOut,
      reserve_balance: reserveBalance,
    };

    cashFlows.push(periodCF);
  }

  // Validation warnings
  const minDSCR = Math.min(
    ...cashFlows
      .filter((cf) => cf.period > 0 && cf.debt_service > 0)
      .map((cf) => cf.noi / cf.debt_service)
  );

  if (minDSCR < 1.0 && debt.financing_type !== "none") {
    warnings.push({
      code: "LOW_DSCR",
      message: `Minimum DSCR of ${minDSCR.toFixed(2)} is below 1.0 - deal may not support debt.`,
      severity: "error",
    });
  } else if (minDSCR < 1.2 && debt.financing_type !== "none") {
    warnings.push({
      code: "TIGHT_DSCR",
      message: `Minimum DSCR of ${minDSCR.toFixed(2)} is below typical 1.2x lender threshold.`,
      severity: "warning",
    });
  }

  return { cashFlows, warnings };
}

/**
 * Calculate annual NOI for a given year
 */
export function calculateAnnualNOI(cashFlows: PeriodCashFlow[], year: number): number {
  const startPeriod = (year - 1) * 12 + 1;
  const endPeriod = year * 12;
  return cashFlows
    .filter((cf) => cf.period >= startPeriod && cf.period <= endPeriod)
    .reduce((sum, cf) => sum + cf.noi, 0);
}
