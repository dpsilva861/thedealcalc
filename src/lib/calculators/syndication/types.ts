// ============================================================
// Syndication Calculator Types
// Complete type definitions for syndication underwriting and waterfall
// ============================================================

// ============ Enums / Literal Types ============

export type ClosingCostsMode = "percent" | "amount";
export type AcquisitionFeeMode = "percent_of_purchase" | "percent_of_equity" | "amount";
export type CapexScheduleMode = "upfront" | "linear" | "custom";
export type FinancingType = "none" | "amortizing" | "interest_only_then_amort" | "bridge_interest_only";
export type LoanAmountMode = "LTV" | "LTC" | "amount";
export type LoanValueBasis = "purchase_price" | "total_uses";
export type FeeMode = "percent" | "amount";
export type RentRollMode = "single_unit" | "multi_unit";
export type ExitMode = "cap_rate" | "price";
export type ROCMode = "lp_first" | "pro_rata";
export type WaterfallVariant = "pref_roc_promote" | "pref_roc_catchup_promote" | "irr_hurdles" | "em_hurdles";
export type TierType = "simple" | "equity_multiple" | "irr";
export type PeriodFrequency = "monthly" | "quarterly" | "annual";

// ============ Input Interfaces ============

export interface AcquisitionInputs {
  purchase_price: number;
  closing_costs_mode: ClosingCostsMode;
  closing_costs_pct: number; // 0.02 = 2%
  closing_costs_amount: number;
  acquisition_fee_mode: AcquisitionFeeMode;
  acquisition_fee_value: number; // pct or amount depending on mode
  capex_budget_total: number;
  capex_schedule_mode: CapexScheduleMode;
  capex_months: number; // for linear schedule
  initial_reserves: number;
  lender_fees_pct: number; // loan origination points
  organizational_costs: number;
}

export interface DebtInputs {
  financing_type: FinancingType;
  loan_amount_mode: LoanAmountMode;
  loan_value_basis: LoanValueBasis;
  ltv_or_ltc_pct: number; // 0.75 = 75%
  loan_amount: number; // if mode = amount
  interest_rate_annual: number; // 0.07 = 7%
  amort_years: number;
  interest_only_months: number;
  loan_term_months: number;
  origination_fee_pct: number;
  exit_fee_pct: number; // for bridge loans
}

export interface EquityInputs {
  lp_equity_pct: number; // 0.90 = 90%
  gp_equity_pct: number; // 0.10 = 10%
  gp_co_invest_amount: number; // optional explicit amount
  use_explicit_amounts: boolean;
  lp_equity_amount: number;
  gp_equity_amount: number;
}

export interface ExpenseLine {
  name: string;
  annual_amount: number;
  growth_rate: number; // annual growth rate
}

export interface ProFormaInputs {
  rent_roll_mode: RentRollMode;
  gross_scheduled_rent_month1: number;
  unit_count: number;
  avg_rent_month1: number;
  other_income_month1: number;
  vacancy_rate: number;
  bad_debt_rate: number;
  concessions_rate: number;
  rent_growth_annual: number;
  expense_growth_annual: number;
  other_income_growth_annual: number;
  expense_lines: ExpenseLine[];
  property_management_fee_mode: FeeMode;
  property_management_fee_pct: number;
  property_management_fee_amount: number;
  asset_management_fee_mode: FeeMode;
  asset_management_fee_pct: number; // of equity or EGI
  asset_management_fee_amount: number;
  replacement_reserves_monthly: number;
}

export interface ExitInputs {
  exit_mode: ExitMode;
  exit_cap_rate: number;
  exit_price: number;
  sale_cost_pct: number;
  disposition_fee_mode: FeeMode;
  disposition_fee_pct: number;
  disposition_fee_amount: number;
  sale_month: number; // period of sale (default = hold_period_months)
  refinance_enabled: boolean;
  refinance_month: number;
  refi_ltv: number;
  refi_interest_rate: number;
  refi_amort_years: number;
  refi_io_months: number;
  refi_cash_out_through_waterfall: boolean; // if true, distribute via waterfall; else return capital first
}

export interface WaterfallTier {
  tier_type: TierType;
  hurdle: number; // for EM: 1.5 = 1.5x; for IRR: 0.08 = 8%
  lp_split: number; // 0.70 = 70%
  gp_split: number; // 0.30 = 30%
  description?: string;
}

export interface WaterfallConfig {
  variant: WaterfallVariant;
  roc_mode: ROCMode;
  pref_rate_annual: number; // 0.08 = 8%
  pref_on_gp_equity: boolean; // does GP also accrue pref?
  catchup_enabled: boolean;
  catchup_target_gp_pct: number; // target GP share of profits after pref (for catch-up)
  tiers: WaterfallTier[];
}

export interface SyndicationInputs {
  // General
  deal_name: string;
  hold_period_months: number;
  period_frequency: PeriodFrequency; // calculation granularity
  
  // Sub-sections
  acquisition: AcquisitionInputs;
  debt: DebtInputs;
  equity: EquityInputs;
  proforma: ProFormaInputs;
  exit: ExitInputs;
  waterfall: WaterfallConfig;
}

// ============ Output / Calculation Interfaces ============

export interface SourcesAndUses {
  // Uses
  purchase_price: number;
  closing_costs: number;
  acquisition_fee: number;
  capex_budget: number;
  initial_reserves: number;
  lender_fees: number;
  organizational_costs: number;
  total_uses: number;
  
  // Sources
  loan_amount: number;
  lp_equity: number;
  gp_equity: number;
  total_equity: number;
  total_sources: number;
}

export interface PeriodCashFlow {
  period: number; // 0 = close, 1 = first operating month, etc.
  
  // Income
  gross_potential_rent: number;
  vacancy_loss: number;
  bad_debt: number;
  concessions: number;
  other_income: number;
  effective_gross_income: number;
  
  // Expenses
  operating_expenses: number;
  property_management_fee: number;
  noi: number;
  
  // Below NOI
  asset_management_fee: number;
  replacement_reserves: number;
  reserve_top_up: number;
  ncf_before_debt: number;
  
  // Debt service
  debt_service: number;
  interest_payment: number;
  principal_payment: number;
  loan_balance_ending: number;
  
  // Cash available for distribution
  ncf_after_debt: number;
  cash_available_for_distribution: number;
  
  // Contributions (negative = call)
  lp_contribution: number;
  gp_contribution: number;
  
  // Events
  is_sale_period: boolean;
  is_refi_period: boolean;
  sale_proceeds: number;
  refi_cash_out: number;
  
  // Ending balances
  reserve_balance: number;
}

export interface WaterfallPeriodAllocation {
  period: number;
  
  // Inputs to this period's allocation
  cash_available: number;
  
  // ROC
  roc_lp: number;
  roc_gp: number;
  
  // Pref
  pref_accrual_lp: number;
  pref_accrual_gp: number;
  pref_paid_lp: number;
  pref_paid_gp: number;
  
  // Catch-up
  catchup_paid_gp: number;
  
  // Tier distributions
  tier_distributions: {
    tier_index: number;
    tier_description: string;
    lp_amount: number;
    gp_amount: number;
    cash_used: number;
  }[];
  
  // Totals this period
  total_distributed_lp: number;
  total_distributed_gp: number;
  
  // Running balances
  lp_unreturned_capital: number;
  gp_unreturned_capital: number;
  lp_pref_balance: number;
  gp_pref_balance: number;
  lp_total_distributed_to_date: number;
  gp_total_distributed_to_date: number;
  lp_contributed_to_date: number;
  gp_contributed_to_date: number;
  
  // Hurdle tracking
  lp_equity_multiple: number;
  lp_irr_to_date: number; // computed if IRR hurdles enabled
  active_tier_index: number;
  tier_rationale: string;
}

export interface WaterfallSummary {
  lp_total_contributions: number;
  gp_total_contributions: number;
  lp_total_roc: number;
  gp_total_roc: number;
  lp_total_pref: number;
  gp_total_pref: number;
  gp_total_catchup: number;
  lp_total_promote: number;
  gp_total_promote: number;
  lp_total_distributions: number;
  gp_total_distributions: number;
  lp_irr: number;
  gp_irr: number;
  lp_equity_multiple: number;
  gp_equity_multiple: number;
  promote_dollars: number;
  promote_percent_of_profit: number;
}

export interface DealMetrics {
  // Returns
  levered_irr_total: number;
  levered_irr_lp: number;
  unlevered_irr: number;
  equity_multiple_total: number;
  equity_multiple_lp: number;
  avg_cash_on_cash: number;
  
  // Yield metrics
  purchase_cap_rate: number;
  exit_cap_rate: number;
  
  // Debt metrics
  dscr_min: number;
  dscr_avg: number;
  debt_yield: number;
  ltv_at_purchase: number;
  ltv_at_exit: number;
  
  // Break-even
  breakeven_occupancy: number;
  
  // Fee summary
  total_acquisition_fees: number;
  total_asset_management_fees: number;
  total_disposition_fees: number;
  total_fees: number;
  
  // Profit split
  lp_profit: number;
  gp_profit: number;
  total_profit: number;
}

export interface SyndicationResults {
  sources_and_uses: SourcesAndUses;
  cash_flows: PeriodCashFlow[];
  waterfall_allocations: WaterfallPeriodAllocation[];
  waterfall_summary: WaterfallSummary;
  metrics: DealMetrics;
  warnings: SyndicationWarning[];
}

export interface SyndicationWarning {
  code: string;
  message: string;
  severity: "info" | "warning" | "error";
  field?: string;
}

// ============ Default Values ============

export const DEFAULT_EXPENSE_LINES: ExpenseLine[] = [
  { name: "Property Taxes", annual_amount: 12000, growth_rate: 0.02 },
  { name: "Insurance", annual_amount: 3600, growth_rate: 0.03 },
  { name: "Repairs & Maintenance", annual_amount: 6000, growth_rate: 0.02 },
  { name: "Utilities", annual_amount: 2400, growth_rate: 0.02 },
  { name: "Administrative", annual_amount: 1200, growth_rate: 0.02 },
];

export const DEFAULT_WATERFALL_TIERS_EM: WaterfallTier[] = [
  { tier_type: "equity_multiple", hurdle: 1.0, lp_split: 1.0, gp_split: 0.0, description: "ROC + Pref" },
  { tier_type: "equity_multiple", hurdle: 1.5, lp_split: 0.70, gp_split: 0.30, description: "70/30 to 1.5x" },
  { tier_type: "equity_multiple", hurdle: 2.0, lp_split: 0.60, gp_split: 0.40, description: "60/40 to 2.0x" },
  { tier_type: "simple", hurdle: Infinity, lp_split: 0.50, gp_split: 0.50, description: "50/50 thereafter" },
];

export const DEFAULT_WATERFALL_CONFIG: WaterfallConfig = {
  variant: "em_hurdles",
  roc_mode: "pro_rata",
  pref_rate_annual: 0.08,
  pref_on_gp_equity: false,
  catchup_enabled: false,
  catchup_target_gp_pct: 0.30,
  tiers: DEFAULT_WATERFALL_TIERS_EM,
};

export const DEFAULT_ACQUISITION_INPUTS: AcquisitionInputs = {
  purchase_price: 1000000,
  closing_costs_mode: "percent",
  closing_costs_pct: 0.02,
  closing_costs_amount: 20000,
  acquisition_fee_mode: "percent_of_equity",
  acquisition_fee_value: 0.02,
  capex_budget_total: 50000,
  capex_schedule_mode: "upfront",
  capex_months: 6,
  initial_reserves: 25000,
  lender_fees_pct: 0.01,
  organizational_costs: 15000,
};

export const DEFAULT_DEBT_INPUTS: DebtInputs = {
  financing_type: "interest_only_then_amort",
  loan_amount_mode: "LTV",
  loan_value_basis: "purchase_price",
  ltv_or_ltc_pct: 0.70,
  loan_amount: 700000,
  interest_rate_annual: 0.065,
  amort_years: 30,
  interest_only_months: 24,
  loan_term_months: 60,
  origination_fee_pct: 0.01,
  exit_fee_pct: 0,
};

export const DEFAULT_EQUITY_INPUTS: EquityInputs = {
  lp_equity_pct: 0.90,
  gp_equity_pct: 0.10,
  gp_co_invest_amount: 0,
  use_explicit_amounts: false,
  lp_equity_amount: 0,
  gp_equity_amount: 0,
};

export const DEFAULT_PROFORMA_INPUTS: ProFormaInputs = {
  rent_roll_mode: "multi_unit",
  gross_scheduled_rent_month1: 0,
  unit_count: 10,
  avg_rent_month1: 1500,
  other_income_month1: 500,
  vacancy_rate: 0.05,
  bad_debt_rate: 0.01,
  concessions_rate: 0,
  rent_growth_annual: 0.03,
  expense_growth_annual: 0.02,
  other_income_growth_annual: 0.02,
  expense_lines: DEFAULT_EXPENSE_LINES,
  property_management_fee_mode: "percent",
  property_management_fee_pct: 0.08,
  property_management_fee_amount: 0,
  asset_management_fee_mode: "percent",
  asset_management_fee_pct: 0.02,
  asset_management_fee_amount: 0,
  replacement_reserves_monthly: 250,
};

export const DEFAULT_EXIT_INPUTS: ExitInputs = {
  exit_mode: "cap_rate",
  exit_cap_rate: 0.055,
  exit_price: 0,
  sale_cost_pct: 0.03,
  disposition_fee_mode: "percent",
  disposition_fee_pct: 0.01,
  disposition_fee_amount: 0,
  sale_month: 60,
  refinance_enabled: false,
  refinance_month: 36,
  refi_ltv: 0.70,
  refi_interest_rate: 0.06,
  refi_amort_years: 30,
  refi_io_months: 0,
  refi_cash_out_through_waterfall: true,
};

export const DEFAULT_SYNDICATION_INPUTS: SyndicationInputs = {
  deal_name: "Sample Syndication",
  hold_period_months: 60,
  period_frequency: "monthly",
  acquisition: DEFAULT_ACQUISITION_INPUTS,
  debt: DEFAULT_DEBT_INPUTS,
  equity: DEFAULT_EQUITY_INPUTS,
  proforma: DEFAULT_PROFORMA_INPUTS,
  exit: DEFAULT_EXIT_INPUTS,
  waterfall: DEFAULT_WATERFALL_CONFIG,
};
