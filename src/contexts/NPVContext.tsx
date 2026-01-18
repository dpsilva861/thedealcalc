/**
 * NPV Calculator Context
 * 
 * Provides state management for the NPV calculator following
 * the canonical TheDealCalc context patterns.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  NPVInputs,
  NPVResults,
  DEFAULT_NPV_INPUTS,
  NPV_PRESETS,
} from '@/lib/calculators/npv';
import { calculateNPV, runNPVSelfTest } from '@/lib/calculators/npv/calculations';
import { devLog } from '@/lib/devLogger';
import { toast } from 'sonner';

interface NPVContextType {
  inputs: NPVInputs;
  results: NPVResults | null;
  selectedPreset: string | null;
  
  // Update functions
  updateInputs: (updates: Partial<NPVInputs>) => void;
  setDiscountRate: (rate: number) => void;
  setPeriodFrequency: (freq: NPVInputs['periodFrequency']) => void;
  setTimingConvention: (timing: NPVInputs['timingConvention']) => void;
  setCashFlowMode: (mode: NPVInputs['cashFlowMode']) => void;
  setCustomCashFlows: (flows: number[]) => void;
  addCustomCashFlow: (amount: number) => void;
  removeCustomCashFlow: (index: number) => void;
  updateCustomCashFlow: (index: number, amount: number) => void;
  
  // Preset management
  loadPreset: (presetId: string) => void;
  loadExample: () => void;
  
  // Actions
  runAnalysis: () => void;
  resetInputs: () => void;
  runSelfTest: () => { passed: boolean; results: string[] };
}

const NPVContext = createContext<NPVContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEY = 'dealcalc:npv:state';
const RESULTS_KEY = 'dealcalc:npv:results';

const loadFromStorage = (): NPVInputs | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        // Merge with defaults to ensure all fields exist
        return { ...DEFAULT_NPV_INPUTS, ...parsed };
      }
    }
  } catch (err) {
    console.error('[NPV] Failed to load state from storage:', err);
    localStorage.removeItem(STORAGE_KEY);
  }
  return null;
};

const loadResultsFromStorage = (): NPVResults | null => {
  try {
    const stored = localStorage.getItem(RESULTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed.npv === 'number') {
        return parsed;
      }
    }
  } catch (err) {
    console.error('[NPV] Failed to load results from storage:', err);
    localStorage.removeItem(RESULTS_KEY);
  }
  return null;
};

const saveToStorage = (inputs: NPVInputs) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
  } catch (err) {
    console.error('[NPV] Failed to save state:', err);
  }
};

const saveResultsToStorage = (results: NPVResults | null) => {
  try {
    if (results) {
      localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
    } else {
      localStorage.removeItem(RESULTS_KEY);
    }
  } catch (err) {
    console.error('[NPV] Failed to save results:', err);
  }
};

export function NPVProvider({ children }: { children: React.ReactNode }) {
  const stored = loadFromStorage();
  const storedResults = loadResultsFromStorage();
  
  const [inputs, setInputs] = useState<NPVInputs>(stored || DEFAULT_NPV_INPUTS);
  const [results, setResults] = useState<NPVResults | null>(storedResults);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const updateInputs = useCallback((updates: Partial<NPVInputs>) => {
    setInputs(prev => {
      const next = { ...prev, ...updates };
      saveToStorage(next);
      return next;
    });
    setSelectedPreset(null);
  }, []);

  const setDiscountRate = useCallback((rate: number) => {
    updateInputs({ discountRateAnnual: rate });
  }, [updateInputs]);

  const setPeriodFrequency = useCallback((freq: NPVInputs['periodFrequency']) => {
    updateInputs({ periodFrequency: freq });
  }, [updateInputs]);

  const setTimingConvention = useCallback((timing: NPVInputs['timingConvention']) => {
    updateInputs({ timingConvention: timing });
  }, [updateInputs]);

  const setCashFlowMode = useCallback((mode: NPVInputs['cashFlowMode']) => {
    updateInputs({ cashFlowMode: mode });
  }, [updateInputs]);

  const setCustomCashFlows = useCallback((flows: number[]) => {
    updateInputs({ customCashFlows: flows });
  }, [updateInputs]);

  const addCustomCashFlow = useCallback((amount: number) => {
    setInputs(prev => {
      const next = {
        ...prev,
        customCashFlows: [...prev.customCashFlows, amount],
      };
      saveToStorage(next);
      return next;
    });
    setSelectedPreset(null);
  }, []);

  const removeCustomCashFlow = useCallback((index: number) => {
    setInputs(prev => {
      if (index === 0) return prev; // Can't remove CF0
      const next = {
        ...prev,
        customCashFlows: prev.customCashFlows.filter((_, i) => i !== index),
      };
      saveToStorage(next);
      return next;
    });
    setSelectedPreset(null);
  }, []);

  const updateCustomCashFlow = useCallback((index: number, amount: number) => {
    setInputs(prev => {
      const newFlows = [...prev.customCashFlows];
      newFlows[index] = amount;
      const next = { ...prev, customCashFlows: newFlows };
      saveToStorage(next);
      return next;
    });
    setSelectedPreset(null);
  }, []);

  const loadPreset = useCallback((presetId: string) => {
    const preset = NPV_PRESETS.find(p => p.id === presetId);
    if (preset) {
      devLog.presetLoaded('NPV', presetId, false);
      setInputs(preset.inputs);
      setSelectedPreset(presetId);
      saveToStorage(preset.inputs);
      setResults(null);
      saveResultsToStorage(null);
    }
  }, []);

  const loadExample = useCallback(() => {
    loadPreset('rental_property');
    toast.success('Example loaded');
  }, [loadPreset]);

  const runAnalysis = useCallback(() => {
    try {
      devLog.analysisStarted('NPV');
      const analysisResults = calculateNPV(inputs);
      
      // Check for errors
      const hasError = analysisResults.warnings.some(w => w.severity === 'error');
      if (hasError) {
        analysisResults.warnings
          .filter(w => w.severity === 'error')
          .forEach(w => toast.error(w.message));
        return;
      }
      
      // Show warnings
      analysisResults.warnings
        .filter(w => w.severity === 'warning')
        .forEach(w => toast.warning(w.message));
      
      saveResultsToStorage(analysisResults);
      localStorage.setItem('dealcalc:npv:lastUpdatedAt', new Date().toISOString());
      devLog.resultsSaved('NPV', RESULTS_KEY);
      setResults(analysisResults);
      toast.success('Analysis complete!');
    } catch (err) {
      console.error('[NPV] Analysis failed:', err);
      toast.error('Analysis failed. Please check your inputs.');
      setResults(null);
      saveResultsToStorage(null);
    }
  }, [inputs]);

  const resetInputs = useCallback(() => {
    setInputs(DEFAULT_NPV_INPUTS);
    setResults(null);
    setSelectedPreset(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(RESULTS_KEY);
    localStorage.removeItem('dealcalc:npv:lastUpdatedAt');
    toast.success('Calculator reset');
  }, []);

  const runSelfTest = useCallback(() => {
    return runNPVSelfTest();
  }, []);

  return (
    <NPVContext.Provider
      value={{
        inputs,
        results,
        selectedPreset,
        updateInputs,
        setDiscountRate,
        setPeriodFrequency,
        setTimingConvention,
        setCashFlowMode,
        setCustomCashFlows,
        addCustomCashFlow,
        removeCustomCashFlow,
        updateCustomCashFlow,
        loadPreset,
        loadExample,
        runAnalysis,
        resetInputs,
        runSelfTest,
      }}
    >
      {children}
    </NPVContext.Provider>
  );
}

export function useNPV() {
  const context = useContext(NPVContext);
  if (context === undefined) {
    throw new Error('useNPV must be used within an NPVProvider');
  }
  return context;
}
