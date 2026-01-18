/**
 * NPV Sensitivity Analysis
 * 
 * Generates sensitivity tables for NPV calculations following
 * the canonical TheDealCalc sensitivity pattern.
 */

import { NPVInputs } from './types';
import { calculateNPV } from './calculations';
import { SensitivityTable, SensitivityCell } from '@/lib/exports/types';
import { formatCurrency, formatPercent } from '@/lib/calculators/types';

export interface NPVSensitivityConfig {
  // Discount rate range (as decimals, e.g., 0.06 to 0.14)
  discountRateStart: number;
  discountRateEnd: number;
  discountRateStep: number;
  
  // Growth rate range (only for single_recurring mode)
  growthRateStart?: number;
  growthRateEnd?: number;
  growthRateStep?: number;
}

export const DEFAULT_SENSITIVITY_CONFIG: NPVSensitivityConfig = {
  discountRateStart: 0.06, // 6%
  discountRateEnd: 0.14,   // 14%
  discountRateStep: 0.01,  // 1% step
  
  growthRateStart: 0,
  growthRateEnd: 0.05,
  growthRateStep: 0.01,
};

export interface NPVSensitivityRow {
  discountRate: number;
  npv: number;
  pvInflows: number;
  pvOutflows: number;
}

export interface NPVGrowthSensitivityCell {
  discountRate: number;
  growthRate: number;
  npv: number;
}

/**
 * Generate 1D sensitivity: NPV vs Discount Rate
 * Returns array of { discountRate, npv } for each rate in range
 */
export function generateDiscountRateSensitivity(
  inputs: NPVInputs,
  config: Partial<NPVSensitivityConfig> = {}
): NPVSensitivityRow[] {
  const cfg = { ...DEFAULT_SENSITIVITY_CONFIG, ...config };
  const rows: NPVSensitivityRow[] = [];
  
  // Generate rates from start to end (inclusive)
  let rate = cfg.discountRateStart;
  const precision = 10000; // Handle floating point
  
  while (rate <= cfg.discountRateEnd + 0.0001) {
    const modifiedInputs: NPVInputs = {
      ...inputs,
      discountRateAnnual: Math.round(rate * precision) / precision,
    };
    
    const result = calculateNPV(modifiedInputs);
    
    rows.push({
      discountRate: rate,
      npv: isFinite(result.npv) ? result.npv : 0,
      pvInflows: result.pvOfInflows,
      pvOutflows: result.pvOfOutflows,
    });
    
    rate += cfg.discountRateStep;
  }
  
  return rows;
}

/**
 * Generate 2D sensitivity: NPV vs (Discount Rate x Growth Rate)
 * Only applicable for single_recurring mode
 */
export function generateGrowthVsDiscountSensitivity(
  inputs: NPVInputs,
  config: Partial<NPVSensitivityConfig> = {}
): {
  discountRates: number[];
  growthRates: number[];
  cells: NPVGrowthSensitivityCell[][];
} | null {
  // Only for single_recurring mode
  if (inputs.cashFlowMode !== 'single_recurring') {
    return null;
  }
  
  const cfg = { ...DEFAULT_SENSITIVITY_CONFIG, ...config };
  const discountRates: number[] = [];
  const growthRates: number[] = [];
  
  // Build rate arrays
  let dr = cfg.discountRateStart;
  while (dr <= cfg.discountRateEnd + 0.0001) {
    discountRates.push(Math.round(dr * 10000) / 10000);
    dr += cfg.discountRateStep;
  }
  
  let gr = cfg.growthRateStart ?? 0;
  const grEnd = cfg.growthRateEnd ?? 0.05;
  const grStep = cfg.growthRateStep ?? 0.01;
  while (gr <= grEnd + 0.0001) {
    growthRates.push(Math.round(gr * 10000) / 10000);
    gr += grStep;
  }
  
  // Generate 2D matrix: rows = growth rates, cols = discount rates
  const cells: NPVGrowthSensitivityCell[][] = [];
  
  for (const growth of growthRates) {
    const row: NPVGrowthSensitivityCell[] = [];
    
    for (const discount of discountRates) {
      const modifiedInputs: NPVInputs = {
        ...inputs,
        discountRateAnnual: discount,
        growthRatePeriod: growth,
      };
      
      const result = calculateNPV(modifiedInputs);
      
      row.push({
        discountRate: discount,
        growthRate: growth,
        npv: isFinite(result.npv) ? result.npv : 0,
      });
    }
    
    cells.push(row);
  }
  
  return { discountRates, growthRates, cells };
}

/**
 * Convert NPV sensitivity data to canonical SensitivityTable format
 * for use in exports (DOCX, PPTX)
 */
export function npvSensitivityToCanonical(
  inputs: NPVInputs,
  config: Partial<NPVSensitivityConfig> = {}
): SensitivityTable[] {
  const tables: SensitivityTable[] = [];
  
  // 1D Discount Rate Sensitivity
  const discountSensitivity = generateDiscountRateSensitivity(inputs, config);
  const baseRate = inputs.discountRateAnnual;
  
  const discountCells: SensitivityCell[][] = discountSensitivity.map(row => {
    const isBase = Math.abs(row.discountRate - baseRate) < 0.001;
    return [{
      rowLabel: formatPercent(row.discountRate),
      colLabel: 'NPV',
      primaryValue: formatCurrency(row.npv),
      secondaryValue: row.npv >= 0 ? 'Positive' : 'Negative',
      isHighlighted: isBase,
    }];
  });
  
  tables.push({
    title: 'NPV vs Discount Rate',
    rowHeader: 'Discount Rate',
    colHeader: '',
    rowLabels: discountSensitivity.map(r => formatPercent(r.discountRate)),
    colLabels: ['NPV'],
    cells: discountCells,
  });
  
  // 2D Growth vs Discount (only for single_recurring)
  if (inputs.cashFlowMode === 'single_recurring') {
    const growthSensitivity = generateGrowthVsDiscountSensitivity(inputs, config);
    
    if (growthSensitivity) {
      const baseGrowth = inputs.growthRatePeriod;
      
      const growthCells: SensitivityCell[][] = growthSensitivity.cells.map((row, rowIdx) => {
        return row.map((cell, colIdx) => {
          const isBase = 
            Math.abs(cell.discountRate - baseRate) < 0.001 &&
            Math.abs(cell.growthRate - baseGrowth) < 0.001;
          
          return {
            rowLabel: formatPercent(growthSensitivity.growthRates[rowIdx]),
            colLabel: formatPercent(growthSensitivity.discountRates[colIdx]),
            primaryValue: formatCurrency(cell.npv),
            isHighlighted: isBase,
          };
        });
      });
      
      tables.push({
        title: 'NPV: Growth Rate vs Discount Rate',
        rowHeader: 'Growth Rate',
        colHeader: 'Discount Rate',
        rowLabels: growthSensitivity.growthRates.map(r => formatPercent(r)),
        colLabels: growthSensitivity.discountRates.map(r => formatPercent(r)),
        cells: growthCells,
      });
    }
  }
  
  return tables;
}
