/**
 * Share Link Hook
 * 
 * Provides encoding/decoding logic for shareable URL parameters.
 * Each calculator has its own param schema with short keys.
 */

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';

// === UNDERWRITE PARAMS ===
export interface UnderwriteShareParams {
  pp: number;    // purchasePrice
  ccP: number;   // closingCosts (percent if ccIsP=1)
  ccIsP: 0 | 1;  // closingCostsIsPercent
  hm: number;    // holdPeriodMonths
  ecr: number;   // exitCapRate
  uc: number;    // unitCount
  rpu: number;   // inPlaceMonthlyRentPerUnit
  vac: number;   // economicVacancyPct
  tax: number;   // propertyTaxesAnnual
  ins: number;   // insuranceAnnual
  useFin: 0 | 1; // useFinancing
  ltv: number;   // loanLtv
  ir: number;    // interestRateAnnual
  am: number;    // amortizationYears
}

export function encodeUnderwriteParams(inputs: any): URLSearchParams {
  const params = new URLSearchParams();
  params.set('pp', String(inputs.acquisition.purchasePrice));
  params.set('ccP', String(inputs.acquisition.closingCosts));
  params.set('ccIsP', inputs.acquisition.closingCostsIsPercent ? '1' : '0');
  params.set('hm', String(inputs.acquisition.holdPeriodMonths));
  params.set('ecr', String(inputs.acquisition.exitCapRate));
  params.set('uc', String(inputs.income.unitCount));
  params.set('rpu', String(inputs.income.inPlaceMonthlyRentPerUnit));
  params.set('vac', String(inputs.income.economicVacancyPct));
  params.set('tax', String(inputs.expenses.propertyTaxesAnnual));
  params.set('ins', String(inputs.expenses.insuranceAnnual));
  params.set('useFin', inputs.financing.useFinancing ? '1' : '0');
  params.set('ltv', String(inputs.financing.loanLtv));
  params.set('ir', String(inputs.financing.interestRateAnnual));
  params.set('am', String(inputs.financing.amortizationYears));
  return params;
}

export function decodeUnderwriteParams(params: URLSearchParams): Partial<any> | null {
  const pp = params.get('pp');
  if (!pp) return null; // No share params
  
  try {
    return {
      acquisition: {
        purchasePrice: parseFloat(pp) || 0,
        closingCosts: parseFloat(params.get('ccP') || '2'),
        closingCostsIsPercent: params.get('ccIsP') === '1',
        holdPeriodMonths: parseInt(params.get('hm') || '60'),
        exitCapRate: parseFloat(params.get('ecr') || '5.5'),
      },
      income: {
        unitCount: parseInt(params.get('uc') || '1'),
        inPlaceMonthlyRentPerUnit: parseFloat(params.get('rpu') || '1200'),
        economicVacancyPct: parseFloat(params.get('vac') || '5'),
      },
      expenses: {
        propertyTaxesAnnual: parseFloat(params.get('tax') || '12000'),
        insuranceAnnual: parseFloat(params.get('ins') || '6000'),
      },
      financing: {
        useFinancing: params.get('useFin') === '1',
        loanLtv: parseFloat(params.get('ltv') || '75'),
        interestRateAnnual: parseFloat(params.get('ir') || '7'),
        amortizationYears: parseInt(params.get('am') || '30'),
      },
    };
  } catch {
    return null;
  }
}

// === BRRRR PARAMS ===
export function encodeBRRRRParams(inputs: any): URLSearchParams {
  const params = new URLSearchParams();
  params.set('pp', String(inputs.acquisition.purchasePrice));
  params.set('rb', String(inputs.acquisition.rehabBudget));
  params.set('cc', String(inputs.acquisition.closingCosts));
  params.set('hc', String(inputs.acquisition.monthlyHoldingCosts));
  params.set('hm', String(inputs.acquisition.holdingPeriodMonths));
  params.set('arv', String(inputs.afterRepairValue.arv));
  params.set('rltv', String(inputs.refinance.refiLtvPct));
  params.set('rir', String(inputs.refinance.refiInterestRate));
  params.set('rent', String(inputs.rentalOperations.monthlyRent));
  params.set('vac', String(inputs.rentalOperations.vacancyPct));
  params.set('pm', String(inputs.rentalOperations.propertyManagementPct));
  return params;
}

export function decodeBRRRRParams(params: URLSearchParams): Partial<any> | null {
  const pp = params.get('pp');
  if (!pp) return null;
  
  try {
    return {
      acquisition: {
        purchasePrice: parseFloat(pp) || 0,
        rehabBudget: parseFloat(params.get('rb') || '0'),
        closingCosts: parseFloat(params.get('cc') || '2.5'),
        monthlyHoldingCosts: parseFloat(params.get('hc') || '0'),
        holdingPeriodMonths: parseInt(params.get('hm') || '4'),
      },
      afterRepairValue: {
        arv: parseFloat(params.get('arv') || '0'),
      },
      refinance: {
        refiLtvPct: parseFloat(params.get('rltv') || '0.75'),
        refiInterestRate: parseFloat(params.get('rir') || '0.07'),
      },
      rentalOperations: {
        monthlyRent: parseFloat(params.get('rent') || '0'),
        vacancyPct: parseFloat(params.get('vac') || '0.05'),
        propertyManagementPct: parseFloat(params.get('pm') || '0.08'),
      },
    };
  } catch {
    return null;
  }
}

// === SYNDICATION PARAMS ===
export function encodeSyndicationParams(inputs: any): URLSearchParams {
  const params = new URLSearchParams();
  params.set('hp', String(inputs.hold_period_months));
  params.set('pp', String(inputs.acquisition.purchase_price));
  params.set('ltv', String(inputs.debt.ltv_or_ltc_pct));
  params.set('ir', String(inputs.debt.interest_rate_annual));
  params.set('ecr', String(inputs.exit.exit_cap_rate));
  params.set('pref', String(inputs.waterfall.pref_rate_annual));
  params.set('lpEq', String(inputs.equity.lp_equity_pct));
  params.set('rg', String(inputs.proforma.rent_growth_annual));
  return params;
}

export function decodeSyndicationParams(params: URLSearchParams): Partial<any> | null {
  const hp = params.get('hp');
  if (!hp) return null;
  
  try {
    return {
      hold_period_months: parseInt(hp) || 60,
      acquisition: {
        purchase_price: parseFloat(params.get('pp') || '1000000'),
      },
      debt: {
        ltv_or_ltc_pct: parseFloat(params.get('ltv') || '0.70'),
        interest_rate_annual: parseFloat(params.get('ir') || '0.065'),
      },
      exit: {
        exit_cap_rate: parseFloat(params.get('ecr') || '0.055'),
      },
      waterfall: {
        pref_rate_annual: parseFloat(params.get('pref') || '0.08'),
      },
      equity: {
        lp_equity_pct: parseFloat(params.get('lpEq') || '0.90'),
      },
      proforma: {
        rent_growth_annual: parseFloat(params.get('rg') || '0.03'),
      },
    };
  } catch {
    return null;
  }
}

// === Generic Share Handler ===
export async function copyShareLink(
  calculator: 'underwrite' | 'brrrr' | 'syndication',
  inputs: any
): Promise<boolean> {
  try {
    const url = new URL(window.location.href);
    // Clear existing params
    url.search = '';
    
    let params: URLSearchParams;
    switch (calculator) {
      case 'underwrite':
        params = encodeUnderwriteParams(inputs);
        break;
      case 'brrrr':
        params = encodeBRRRRParams(inputs);
        break;
      case 'syndication':
        params = encodeSyndicationParams(inputs);
        break;
    }
    
    params.forEach((value, key) => url.searchParams.set(key, value));
    
    await navigator.clipboard.writeText(url.toString());
    toast.success('Link copied to clipboard!');
    trackEvent('share_link', { calculator });
    return true;
  } catch {
    toast.error('Failed to copy link');
    return false;
  }
}

// === Hook for loading share params on mount ===
export function useLoadShareParams<T>(
  decoder: (params: URLSearchParams) => Partial<T> | null,
  onLoad: (partialInputs: Partial<T>) => void,
  defaultInputs: T
) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  useEffect(() => {
    const decoded = decoder(searchParams);
    if (decoded) {
      // Deep merge with defaults
      const merged = deepMerge(defaultInputs, decoded);
      onLoad(merged as Partial<T>);
      toast.info('Inputs loaded from shared link');
      // Clear URL params after loading
      setSearchParams({}, { replace: true });
    }
  }, []); // Run once on mount
}

// Deep merge utility
function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof (target as any)[key] === 'object'
      ) {
        (result as any)[key] = deepMerge((target as any)[key], source[key] as any);
      } else {
        (result as any)[key] = source[key];
      }
    }
  }
  return result;
}
