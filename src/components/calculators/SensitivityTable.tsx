/**
 * Single-Variable Sensitivity Table Component
 * 
 * Displays sensitivity analysis by varying one input and showing key outputs.
 * Calls the actual analysis function with modified inputs (no new math engines).
 */

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/calculators/types';

export interface SensitivityRow {
  label: string;
  variedValue: number;
  metrics: Record<string, number | string>;
  isBase?: boolean;
}

interface SensitivityTableProps {
  title: string;
  variableName: string;
  rows: SensitivityRow[];
  metricColumns: { key: string; label: string; format: 'currency' | 'percent' | 'number' }[];
}

export function SensitivityTable({ 
  title, 
  variableName, 
  rows, 
  metricColumns 
}: SensitivityTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatValue = (value: number | string, format: 'currency' | 'percent' | 'number') => {
    if (typeof value === 'string') return value;
    if (!isFinite(value)) return 'N/A';
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percent':
        return formatPercent(value);
      case 'number':
        return value.toFixed(2);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>Hide <ChevronUp className="h-4 w-4 ml-1" /></>
            ) : (
              <>Show <ChevronDown className="h-4 w-4 ml-1" /></>
            )}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{variableName}</TableHead>
                  {metricColumns.map(col => (
                    <TableHead key={col.key} className="text-right">{col.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow 
                    key={i} 
                    className={row.isBase ? 'bg-primary/5 font-medium' : ''}
                  >
                    <TableCell>{row.label}</TableCell>
                    {metricColumns.map(col => (
                      <TableCell key={col.key} className="text-right">
                        {formatValue(row.metrics[col.key], col.format)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// === UNDERWRITE SENSITIVITY ===
// Vary in-place rent per unit +/- 10% in 5% steps
import { UnderwritingInputs, runUnderwritingNoSensitivity } from '@/lib/underwriting';

export function generateUnderwriteSensitivity(inputs: UnderwritingInputs): SensitivityRow[] {
  const baseRent = inputs.income.inPlaceMonthlyRentPerUnit;
  const variations = [-0.10, -0.05, 0, 0.05, 0.10];
  
  return variations.map(v => {
    const adjustedRent = baseRent * (1 + v);
    const modifiedInputs: UnderwritingInputs = {
      ...inputs,
      income: { ...inputs.income, inPlaceMonthlyRentPerUnit: adjustedRent },
    };
    
    try {
      const results = runUnderwritingNoSensitivity(modifiedInputs);
      return {
        label: v === 0 ? 'Base Case' : `${v > 0 ? '+' : ''}${(v * 100).toFixed(0)}%`,
        variedValue: adjustedRent,
        isBase: v === 0,
        metrics: {
          rent: adjustedRent,
          coc: results.metrics.cocYear1,
          irr: results.metrics.irr,
          dscr: results.metrics.dscr,
        },
      };
    } catch {
      return {
        label: v === 0 ? 'Base Case' : `${v > 0 ? '+' : ''}${(v * 100).toFixed(0)}%`,
        variedValue: adjustedRent,
        isBase: v === 0,
        metrics: { rent: adjustedRent, coc: 'Error', irr: 'Error', dscr: 'Error' },
      };
    }
  });
}

// === BRRRR SENSITIVITY ===
// Vary ARV +/- 10% in 5% steps
import { BRRRRInputs } from '@/lib/calculators/brrrr/types';
import { runBRRRRAnalysis } from '@/lib/calculators/brrrr/calculations';

export function generateBRRRRSensitivity(inputs: BRRRRInputs): SensitivityRow[] {
  const baseARV = inputs.afterRepairValue.arv;
  const variations = [-0.10, -0.05, 0, 0.05, 0.10];
  
  return variations.map(v => {
    const adjustedARV = baseARV * (1 + v);
    const modifiedInputs: BRRRRInputs = {
      ...inputs,
      afterRepairValue: { arv: adjustedARV },
    };
    
    try {
      const results = runBRRRRAnalysis(modifiedInputs);
      return {
        label: v === 0 ? 'Base Case' : `${v > 0 ? '+' : ''}${(v * 100).toFixed(0)}%`,
        variedValue: adjustedARV,
        isBase: v === 0,
        metrics: {
          arv: adjustedARV,
          cashOut: results.refinance.cashOut,
          cashLeft: results.refinance.remainingCashInDeal,
          coc: results.metrics.cashOnCashReturn,
        },
      };
    } catch {
      return {
        label: v === 0 ? 'Base Case' : `${v > 0 ? '+' : ''}${(v * 100).toFixed(0)}%`,
        variedValue: adjustedARV,
        isBase: v === 0,
        metrics: { arv: adjustedARV, cashOut: 'Error', cashLeft: 'Error', coc: 'Error' },
      };
    }
  });
}

// === SYNDICATION SENSITIVITY ===
// Vary exit cap rate +/- 50 bps in 25 bps steps
import { SyndicationInputs } from '@/lib/calculators/syndication/types';
import { runSyndicationAnalysis } from '@/lib/calculators/syndication';

export function generateSyndicationSensitivity(inputs: SyndicationInputs): SensitivityRow[] {
  const baseExitCap = inputs.exit.exit_cap_rate;
  const variations = [-0.005, -0.0025, 0, 0.0025, 0.005]; // +/- 50bps in 25bps steps
  
  return variations.map(v => {
    const adjustedCap = baseExitCap + v;
    const modifiedInputs: SyndicationInputs = {
      ...inputs,
      exit: { ...inputs.exit, exit_cap_rate: adjustedCap },
    };
    
    try {
      const results = runSyndicationAnalysis(modifiedInputs);
      return {
        label: v === 0 ? 'Base Case' : `${v > 0 ? '+' : ''}${(v * 10000).toFixed(0)} bps`,
        variedValue: adjustedCap,
        isBase: v === 0,
        metrics: {
          exitCap: adjustedCap * 100, // Convert to percent for display
          lpIrr: results.waterfall_summary.lp_irr,
          em: results.waterfall_summary.lp_equity_multiple,
          gpPromote: results.waterfall_summary.promote_dollars,
        },
      };
    } catch {
      return {
        label: v === 0 ? 'Base Case' : `${v > 0 ? '+' : ''}${(v * 10000).toFixed(0)} bps`,
        variedValue: adjustedCap,
        isBase: v === 0,
        metrics: { exitCap: adjustedCap * 100, lpIrr: 'Error', em: 'Error', gpPromote: 'Error' },
      };
    }
  });
}
