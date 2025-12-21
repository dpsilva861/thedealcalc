import React, { createContext, useContext, useState, useCallback } from "react";
import {
  SyndicationInputs,
  SyndicationResults,
  DEFAULT_SYNDICATION_INPUTS,
} from "@/lib/calculators/syndication/types";
import { runSyndicationAnalysis } from "@/lib/calculators/syndication";

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
      return { ...DEFAULT_SYNDICATION_INPUTS, ...JSON.parse(stored) };
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
  }, [inputs]);

  const resetInputs = useCallback(() => {
    setInputs(DEFAULT_SYNDICATION_INPUTS);
    setResults(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(RESULTS_KEY);
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
