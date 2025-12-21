// ============================================================
// Syndication Waterfall Allocations
// Distribute cash through LP/GP waterfall structure
// ============================================================

import {
  SyndicationInputs,
  SourcesAndUses,
  PeriodCashFlow,
  WaterfallConfig,
  WaterfallPeriodAllocation,
  WaterfallSummary,
} from "./types";
import { calculateIRRFromCashFlows } from "./metrics";

/**
 * Run waterfall allocation across all periods
 */
export function runWaterfall(
  inputs: SyndicationInputs,
  sourcesAndUses: SourcesAndUses,
  cashFlows: PeriodCashFlow[]
): { allocations: WaterfallPeriodAllocation[]; summary: WaterfallSummary } {
  const { waterfall } = inputs;
  const allocations: WaterfallPeriodAllocation[] = [];

  // Initialize running state
  let lpContributed = sourcesAndUses.lp_equity;
  let gpContributed = sourcesAndUses.gp_equity;
  let lpUnreturnedCapital = lpContributed;
  let gpUnreturnedCapital = gpContributed;
  let lpPrefBalance = 0;
  let gpPrefBalance = 0;
  let lpTotalDistributed = 0;
  let gpTotalDistributed = 0;

  // For tracking distributions by type
  let totalLPROC = 0;
  let totalGPROC = 0;
  let totalLPPref = 0;
  let totalGPPref = 0;
  let totalGPCatchup = 0;
  let totalLPPromote = 0;
  let totalGPPromote = 0;

  // Period 0: no distributions, just contributions
  allocations.push({
    period: 0,
    cash_available: 0,
    roc_lp: 0,
    roc_gp: 0,
    pref_accrual_lp: 0,
    pref_accrual_gp: 0,
    pref_paid_lp: 0,
    pref_paid_gp: 0,
    catchup_paid_gp: 0,
    tier_distributions: [],
    total_distributed_lp: 0,
    total_distributed_gp: 0,
    lp_unreturned_capital: lpUnreturnedCapital,
    gp_unreturned_capital: gpUnreturnedCapital,
    lp_pref_balance: lpPrefBalance,
    gp_pref_balance: gpPrefBalance,
    lp_total_distributed_to_date: lpTotalDistributed,
    gp_total_distributed_to_date: gpTotalDistributed,
    lp_contributed_to_date: lpContributed,
    gp_contributed_to_date: gpContributed,
    lp_equity_multiple: lpContributed > 0 ? lpTotalDistributed / lpContributed : 0,
    lp_irr_to_date: 0,
    active_tier_index: 0,
    tier_rationale: "Acquisition - no distributions",
  });

  // Monthly pref rate
  const prefRateMonthly = waterfall.pref_rate_annual / 12;

  // Process operating periods
  for (let i = 1; i < cashFlows.length; i++) {
    const cf = cashFlows[i];
    let remainingCash = cf.cash_available_for_distribution;

    // Handle any additional contributions this period
    if (cf.lp_contribution < 0) {
      lpContributed += Math.abs(cf.lp_contribution);
      lpUnreturnedCapital += Math.abs(cf.lp_contribution);
    }
    if (cf.gp_contribution < 0) {
      gpContributed += Math.abs(cf.gp_contribution);
      gpUnreturnedCapital += Math.abs(cf.gp_contribution);
    }

    // Accrue preferred return
    const lpPrefAccrual = lpUnreturnedCapital * prefRateMonthly;
    const gpPrefAccrual = waterfall.pref_on_gp_equity
      ? gpUnreturnedCapital * prefRateMonthly
      : 0;
    lpPrefBalance += lpPrefAccrual;
    gpPrefBalance += gpPrefAccrual;

    let rocLP = 0;
    let rocGP = 0;
    let prefPaidLP = 0;
    let prefPaidGP = 0;
    let catchupPaidGP = 0;
    const tierDists: WaterfallPeriodAllocation["tier_distributions"] = [];
    let activeTierIndex = 0;
    let tierRationale = "";

    if (remainingCash > 0) {
      // Step 1: Return of Capital (ROC)
      if (waterfall.roc_mode === "lp_first") {
        // LP first
        const lpROCAvailable = Math.min(remainingCash, lpUnreturnedCapital);
        rocLP = lpROCAvailable;
        remainingCash -= rocLP;
        lpUnreturnedCapital -= rocLP;
        totalLPROC += rocLP;

        const gpROCAvailable = Math.min(remainingCash, gpUnreturnedCapital);
        rocGP = gpROCAvailable;
        remainingCash -= rocGP;
        gpUnreturnedCapital -= rocGP;
        totalGPROC += rocGP;
      } else {
        // Pro-rata
        const totalUnreturned = lpUnreturnedCapital + gpUnreturnedCapital;
        if (totalUnreturned > 0) {
          const lpShare = lpUnreturnedCapital / totalUnreturned;
          const gpShare = gpUnreturnedCapital / totalUnreturned;
          const totalROC = Math.min(remainingCash, totalUnreturned);
          rocLP = Math.min(lpUnreturnedCapital, totalROC * lpShare);
          rocGP = Math.min(gpUnreturnedCapital, totalROC * gpShare);
          remainingCash -= rocLP + rocGP;
          lpUnreturnedCapital -= rocLP;
          gpUnreturnedCapital -= rocGP;
          totalLPROC += rocLP;
          totalGPROC += rocGP;
        }
      }

      // Step 2: Pay accrued preferred return
      prefPaidLP = Math.min(remainingCash, lpPrefBalance);
      remainingCash -= prefPaidLP;
      lpPrefBalance -= prefPaidLP;
      totalLPPref += prefPaidLP;

      if (waterfall.pref_on_gp_equity) {
        prefPaidGP = Math.min(remainingCash, gpPrefBalance);
        remainingCash -= prefPaidGP;
        gpPrefBalance -= prefPaidGP;
        totalGPPref += prefPaidGP;
      }

      // Step 3: Catch-up (if enabled)
      if (waterfall.catchup_enabled && remainingCash > 0) {
        // Calculate how much GP needs to "catch up"
        // Target: GP has catchup_target_gp_pct of total profit distributions
        const totalProfitDist = lpTotalDistributed + gpTotalDistributed - totalLPROC - totalGPROC;
        const gpCurrentProfit = gpTotalDistributed - totalGPROC;
        const desiredGPProfit = (totalProfitDist + remainingCash) * waterfall.catchup_target_gp_pct;
        const catchupNeeded = Math.max(0, desiredGPProfit - gpCurrentProfit);
        catchupPaidGP = Math.min(remainingCash, catchupNeeded);
        remainingCash -= catchupPaidGP;
        totalGPCatchup += catchupPaidGP;
      }

      // Step 4: Promote tiers
      if (remainingCash > 0 && waterfall.tiers.length > 0) {
        // Calculate current LP equity multiple
        const lpEM = lpContributed > 0 ? (lpTotalDistributed + rocLP + prefPaidLP) / lpContributed : 0;

        for (let tierIdx = 0; tierIdx < waterfall.tiers.length; tierIdx++) {
          const tier = waterfall.tiers[tierIdx];
          if (remainingCash <= 0) break;

          // Check if we've reached this tier
          let tierApplies = false;
          let cashInTier = remainingCash;

          if (tier.tier_type === "simple") {
            tierApplies = true;
          } else if (tier.tier_type === "equity_multiple") {
            // Current EM must be at or above previous tier hurdle
            const prevHurdle = tierIdx > 0 ? waterfall.tiers[tierIdx - 1].hurdle : 0;
            tierApplies = lpEM >= prevHurdle;
            if (tierApplies && tier.hurdle < Infinity) {
              // Calculate max cash before hitting next hurdle
              const targetEM = tier.hurdle;
              const targetDistributions = targetEM * lpContributed;
              const currentDist = lpTotalDistributed + rocLP + prefPaidLP;
              const additionalNeeded = Math.max(0, targetDistributions - currentDist);
              if (tier.lp_split > 0) {
                cashInTier = Math.min(remainingCash, additionalNeeded / tier.lp_split);
              }
            }
          } else if (tier.tier_type === "irr") {
            // IRR hurdle - more complex, use binary search
            const prevHurdle = tierIdx > 0 ? waterfall.tiers[tierIdx - 1].hurdle : 0;
            const currentIRR = calculateLPIRRToDate(allocations, lpContributed, lpTotalDistributed, cf.period);
            tierApplies = currentIRR >= prevHurdle;
            // For IRR tiers, allocate remaining to current tier (simplified)
            // A full implementation would binary-search to find the exact split point
          }

          if (tierApplies && cashInTier > 0) {
            const lpAmt = cashInTier * tier.lp_split;
            const gpAmt = cashInTier * tier.gp_split;
            tierDists.push({
              tier_index: tierIdx,
              tier_description: tier.description || `Tier ${tierIdx + 1}`,
              lp_amount: lpAmt,
              gp_amount: gpAmt,
              cash_used: cashInTier,
            });
            totalLPPromote += lpAmt;
            totalGPPromote += gpAmt;
            remainingCash -= cashInTier;
            activeTierIndex = tierIdx;
            tierRationale = tier.description || `Tier ${tierIdx + 1} active`;
          }
        }
      }
    }

    // Update totals
    const totalDistLP = rocLP + prefPaidLP + tierDists.reduce((s, t) => s + t.lp_amount, 0);
    const totalDistGP = rocGP + prefPaidGP + catchupPaidGP + tierDists.reduce((s, t) => s + t.gp_amount, 0);
    lpTotalDistributed += totalDistLP;
    gpTotalDistributed += totalDistGP;

    allocations.push({
      period: cf.period,
      cash_available: cf.cash_available_for_distribution,
      roc_lp: rocLP,
      roc_gp: rocGP,
      pref_accrual_lp: lpPrefAccrual,
      pref_accrual_gp: gpPrefAccrual,
      pref_paid_lp: prefPaidLP,
      pref_paid_gp: prefPaidGP,
      catchup_paid_gp: catchupPaidGP,
      tier_distributions: tierDists,
      total_distributed_lp: totalDistLP,
      total_distributed_gp: totalDistGP,
      lp_unreturned_capital: lpUnreturnedCapital,
      gp_unreturned_capital: gpUnreturnedCapital,
      lp_pref_balance: lpPrefBalance,
      gp_pref_balance: gpPrefBalance,
      lp_total_distributed_to_date: lpTotalDistributed,
      gp_total_distributed_to_date: gpTotalDistributed,
      lp_contributed_to_date: lpContributed,
      gp_contributed_to_date: gpContributed,
      lp_equity_multiple: lpContributed > 0 ? lpTotalDistributed / lpContributed : 0,
      lp_irr_to_date: calculateLPIRRToDate(allocations.concat([{} as WaterfallPeriodAllocation]), lpContributed, lpTotalDistributed, cf.period),
      active_tier_index: activeTierIndex,
      tier_rationale: tierRationale || (remainingCash <= 0 ? "Fully distributed" : "No distributions"),
    });
  }

  // Build summary
  const lpCashFlows = buildLPCashFlows(allocations, sourcesAndUses);
  const gpCashFlows = buildGPCashFlows(allocations, sourcesAndUses);

  const summary: WaterfallSummary = {
    lp_total_contributions: lpContributed,
    gp_total_contributions: gpContributed,
    lp_total_roc: totalLPROC,
    gp_total_roc: totalGPROC,
    lp_total_pref: totalLPPref,
    gp_total_pref: totalGPPref,
    gp_total_catchup: totalGPCatchup,
    lp_total_promote: totalLPPromote,
    gp_total_promote: totalGPPromote,
    lp_total_distributions: lpTotalDistributed,
    gp_total_distributions: gpTotalDistributed,
    lp_irr: calculateIRRFromCashFlows(lpCashFlows),
    gp_irr: calculateIRRFromCashFlows(gpCashFlows),
    lp_equity_multiple: lpContributed > 0 ? lpTotalDistributed / lpContributed : 0,
    gp_equity_multiple: gpContributed > 0 ? gpTotalDistributed / gpContributed : 0,
    promote_dollars: totalGPPromote + totalGPCatchup,
    promote_percent_of_profit: 
      (lpTotalDistributed + gpTotalDistributed - lpContributed - gpContributed) > 0
        ? (totalGPPromote + totalGPCatchup) / (lpTotalDistributed + gpTotalDistributed - lpContributed - gpContributed)
        : 0,
  };

  return { allocations, summary };
}

/**
 * Build LP cash flow array for IRR calculation
 */
function buildLPCashFlows(
  allocations: WaterfallPeriodAllocation[],
  sourcesAndUses: SourcesAndUses
): number[] {
  const flows: number[] = [];
  flows.push(-sourcesAndUses.lp_equity);
  for (let i = 1; i < allocations.length; i++) {
    flows.push(allocations[i].total_distributed_lp);
  }
  return flows;
}

/**
 * Build GP cash flow array for IRR calculation
 */
function buildGPCashFlows(
  allocations: WaterfallPeriodAllocation[],
  sourcesAndUses: SourcesAndUses
): number[] {
  const flows: number[] = [];
  flows.push(-sourcesAndUses.gp_equity);
  for (let i = 1; i < allocations.length; i++) {
    flows.push(allocations[i].total_distributed_gp);
  }
  return flows;
}

/**
 * Calculate LP IRR to date (for tier checks)
 */
function calculateLPIRRToDate(
  allocations: WaterfallPeriodAllocation[],
  lpContributed: number,
  lpDistributed: number,
  currentPeriod: number
): number {
  // Simple approximation using money-weighted return
  // A full implementation would use the actual periodic cash flows
  if (lpContributed <= 0 || currentPeriod <= 0) return 0;
  const years = currentPeriod / 12;
  const multiple = lpDistributed / lpContributed;
  if (multiple <= 0) return -1;
  return Math.pow(multiple, 1 / years) - 1;
}
