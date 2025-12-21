// ============================================================
// Syndication Calculator - Main Entry Point
// ============================================================

export * from "./types";
export * from "./proforma";
export * from "./waterfall";
export * from "./metrics";

import {
  SyndicationInputs,
  SyndicationResults,
  SyndicationWarning,
} from "./types";
import { calculateSourcesAndUses, buildCashFlows } from "./proforma";
import { runWaterfall } from "./waterfall";
import { calculateDealMetrics } from "./metrics";

/**
 * Run complete syndication underwriting analysis
 */
export function runSyndicationAnalysis(inputs: SyndicationInputs): SyndicationResults {
  const warnings: SyndicationWarning[] = [];

  // Step 1: Calculate Sources & Uses
  const sourcesAndUses = calculateSourcesAndUses(inputs);

  // Validate sources = uses
  if (Math.abs(sourcesAndUses.total_sources - sourcesAndUses.total_uses) > 1) {
    warnings.push({
      code: "SOURCES_USES_MISMATCH",
      message: `Sources ($${sourcesAndUses.total_sources.toLocaleString()}) do not equal Uses ($${sourcesAndUses.total_uses.toLocaleString()})`,
      severity: "error",
    });
  }

  // Step 2: Build Cash Flows
  const { cashFlows, warnings: cfWarnings } = buildCashFlows(inputs, sourcesAndUses);
  warnings.push(...cfWarnings);

  // Step 3: Run Waterfall
  const { allocations, summary } = runWaterfall(inputs, sourcesAndUses, cashFlows);

  // Validate conservation of cash
  const totalCashAvailable = cashFlows.reduce((sum, cf) => sum + cf.cash_available_for_distribution, 0);
  const totalDistributed = summary.lp_total_distributions + summary.gp_total_distributions;
  if (Math.abs(totalCashAvailable - totalDistributed) > 1) {
    warnings.push({
      code: "CASH_CONSERVATION_ERROR",
      message: `Total distributed ($${totalDistributed.toLocaleString()}) does not equal total available ($${totalCashAvailable.toLocaleString()})`,
      severity: "warning",
    });
  }

  // Step 4: Calculate Metrics
  const metrics = calculateDealMetrics(inputs, sourcesAndUses, cashFlows, summary);

  return {
    sources_and_uses: sourcesAndUses,
    cash_flows: cashFlows,
    waterfall_allocations: allocations,
    waterfall_summary: summary,
    metrics,
    warnings,
  };
}

/**
 * Run waterfall-only calculation (for waterfall calculator)
 */
export function runWaterfallOnly(
  inputs: SyndicationInputs
): { allocations: SyndicationResults["waterfall_allocations"]; summary: SyndicationResults["waterfall_summary"]; warnings: SyndicationWarning[] } {
  const warnings: SyndicationWarning[] = [];

  const sourcesAndUses = calculateSourcesAndUses(inputs);
  const { cashFlows, warnings: cfWarnings } = buildCashFlows(inputs, sourcesAndUses);
  warnings.push(...cfWarnings);

  const { allocations, summary } = runWaterfall(inputs, sourcesAndUses, cashFlows);

  return { allocations, summary, warnings };
}
