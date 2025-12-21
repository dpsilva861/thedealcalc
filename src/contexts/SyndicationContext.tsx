import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import {
  SyndicationInputs,
  SyndicationResults,
  SyndicationWarning,
  DEFAULT_SYNDICATION_INPUTS,
} from "@/lib/calculators/syndication/types";
import { runSyndicationAnalysis } from "@/lib/calculators/syndication";
import { validateSyndicationInputs, ValidationResult } from "@/lib/calculators/syndication/validation";

// Preset configurations
export const SYNDICATION_PRESETS = {
  default: {
    name: "Default 5-Year Hold",
    description: "Standard 60-month hold, 70/30 LTV, 8% pref",
    inputs: DEFAULT_SYNDICATION_INPUTS,
  },
  conservative: {
    name: "Conservative",
    description: "Lower leverage, higher reserves",
    inputs: {
      ...DEFAULT_SYNDICATION_INPUTS,
      debt: {
        ...DEFAULT_SYNDICATION_INPUTS.debt,
        ltv_or_ltc_pct: 0.60,
      },
      acquisition: {
        ...DEFAULT_SYNDICATION_INPUTS.acquisition,
        initial_reserves: 50000,
      },
      waterfall: {
        ...DEFAULT_SYNDICATION_INPUTS.waterfall,
        pref_rate_annual: 0.10,
      },
    },
  },
  aggressive: {
    name: "Value-Add",
    description: "Higher LTV, larger capex, shorter hold",
    inputs: {
      ...DEFAULT_SYNDICATION_INPUTS,
      hold_period_months: 36,
      debt: {
        ...DEFAULT_SYNDICATION_INPUTS.debt,
        ltv_or_ltc_pct: 0.75,
        financing_type: "bridge_interest_only" as const,
      },
      acquisition: {
        ...DEFAULT_SYNDICATION_INPUTS.acquisition,
        capex_budget_total: 150000,
      },
      exit: {
        ...DEFAULT_SYNDICATION_INPUTS.exit,
        sale_month: 36,
        exit_cap_rate: 0.05,
      },
    },
  },
};

interface SyndicationContextType {
  inputs: SyndicationInputs;
  setInputs: React.Dispatch<React.SetStateAction<SyndicationInputs>>;
  updateInput: <K extends keyof SyndicationInputs>(
    section: K,
    field: keyof SyndicationInputs[K],
    value: any
  ) => void;
  results: SyndicationResults | null;
  runAnalysis: () => void;
  resetInputs: () => void;
  loadPreset: (presetId: keyof typeof SYNDICATION_PRESETS) => void;
  validation: ValidationResult;
  error: string | null;
  isCalculating: boolean;
}

const SyndicationContext = createContext<SyndicationContextType | null>(null);

const STORAGE_KEY = "syndication_inputs";
const RESULTS_KEY = "syndication_results";

function loadInputsFromStorage(): SyndicationInputs {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Deep merge to ensure all fields exist
      return {
        ...DEFAULT_SYNDICATION_INPUTS,
        ...parsed,
        acquisition: { ...DEFAULT_SYNDICATION_INPUTS.acquisition, ...parsed.acquisition },
        debt: { ...DEFAULT_SYNDICATION_INPUTS.debt, ...parsed.debt },
        equity: { ...DEFAULT_SYNDICATION_INPUTS.equity, ...parsed.equity },
        proforma: { ...DEFAULT_SYNDICATION_INPUTS.proforma, ...parsed.proforma },
        exit: { ...DEFAULT_SYNDICATION_INPUTS.exit, ...parsed.exit },
        waterfall: { ...DEFAULT_SYNDICATION_INPUTS.waterfall, ...parsed.waterfall },
      };
    }
  } catch (e) {
    console.error("Failed to load syndication inputs:", e);
  }
  return DEFAULT_SYNDICATION_INPUTS;
}

function saveInputsToStorage(inputs: SyndicationInputs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
  } catch (e) {
    console.error("Failed to save syndication inputs:", e);
  }
}

function loadResultsFromStorage(): SyndicationResults | null {
  try {
    const stored = localStorage.getItem(RESULTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load syndication results:", e);
  }
  return null;
}

function saveResultsToStorage(results: SyndicationResults): void {
  try {
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
  } catch (e) {
    console.error("Failed to save syndication results:", e);
  }
}

export function SyndicationProvider({ children }: { children: React.ReactNode }) {
  const [inputs, setInputs] = useState<SyndicationInputs>(loadInputsFromStorage);
  const [results, setResults] = useState<SyndicationResults | null>(loadResultsFromStorage);
  const [error, setError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Memoized validation
  const validation = useMemo(() => validateSyndicationInputs(inputs), [inputs]);

  const updateInput = useCallback(<K extends keyof SyndicationInputs>(
    section: K,
    field: keyof SyndicationInputs[K],
    value: any
  ) => {
    setInputs((prev) => {
      const sectionData = prev[section];
      if (typeof sectionData === 'object' && sectionData !== null) {
        const newInputs = {
          ...prev,
          [section]: {
            ...(sectionData as object),
            [field]: value,
          },
        };
        saveInputsToStorage(newInputs);
        return newInputs;
      }
      return prev;
    });
  }, []);

  const runAnalysis = useCallback(() => {
    // Block if validation errors exist
    if (!validation.isValid) {
      setError("Please fix validation errors before running analysis");
      return;
    }

    setIsCalculating(true);
    setError(null);
    try {
      const analysisResults = runSyndicationAnalysis(inputs);
      setResults(analysisResults);
      saveResultsToStorage(analysisResults);
      saveInputsToStorage(inputs);
    } catch (e: any) {
      setError(e?.message || "Calculation failed");
      setResults(null);
    } finally {
      setIsCalculating(false);
    }
  }, [inputs, validation.isValid]);

  const resetInputs = useCallback(() => {
    setInputs(DEFAULT_SYNDICATION_INPUTS);
    setResults(null);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(RESULTS_KEY);
  }, []);

  const loadPreset = useCallback((presetId: keyof typeof SYNDICATION_PRESETS) => {
    const preset = SYNDICATION_PRESETS[presetId];
    if (preset) {
      setInputs(preset.inputs);
      setResults(null);
      setError(null);
      saveInputsToStorage(preset.inputs);
      localStorage.removeItem(RESULTS_KEY);
    }
  }, []);

  return (
    <SyndicationContext.Provider
      value={{
        inputs,
        setInputs,
        updateInput,
        results,
        runAnalysis,
        resetInputs,
        loadPreset,
        validation,
        error,
        isCalculating,
      }}
    >
      {children}
    </SyndicationContext.Provider>
  );
}

export function useSyndication() {
  const context = useContext(SyndicationContext);
  if (!context) {
    throw new Error("useSyndication must be used within SyndicationProvider");
  }
  return context;
}
