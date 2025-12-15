import React, { createContext, useContext, useState, useCallback } from "react";
import { 
  UnderwritingInputs, 
  UnderwritingResults, 
  getDefaultInputs, 
  runUnderwriting 
} from "@/lib/underwriting";

interface UnderwritingContextType {
  inputs: UnderwritingInputs;
  results: UnderwritingResults | null;
  updateInputs: (updates: Partial<UnderwritingInputs>) => void;
  updateAcquisition: (updates: Partial<UnderwritingInputs["acquisition"]>) => void;
  updateIncome: (updates: Partial<UnderwritingInputs["income"]>) => void;
  updateExpenses: (updates: Partial<UnderwritingInputs["expenses"]>) => void;
  updateRenovation: (updates: Partial<UnderwritingInputs["renovation"]>) => void;
  updateFinancing: (updates: Partial<UnderwritingInputs["financing"]>) => void;
  updateTax: (updates: Partial<UnderwritingInputs["tax"]>) => void;
  runAnalysis: () => void;
  resetInputs: () => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

const UnderwritingContext = createContext<UnderwritingContextType | undefined>(undefined);

export function UnderwritingProvider({ children }: { children: React.ReactNode }) {
  const [inputs, setInputs] = useState<UnderwritingInputs>(getDefaultInputs());
  const [results, setResults] = useState<UnderwritingResults | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const updateInputs = useCallback((updates: Partial<UnderwritingInputs>) => {
    setInputs(prev => ({ ...prev, ...updates }));
  }, []);

  const updateAcquisition = useCallback((updates: Partial<UnderwritingInputs["acquisition"]>) => {
    setInputs(prev => ({
      ...prev,
      acquisition: { ...prev.acquisition, ...updates }
    }));
  }, []);

  const updateIncome = useCallback((updates: Partial<UnderwritingInputs["income"]>) => {
    setInputs(prev => ({
      ...prev,
      income: { ...prev.income, ...updates }
    }));
  }, []);

  const updateExpenses = useCallback((updates: Partial<UnderwritingInputs["expenses"]>) => {
    setInputs(prev => ({
      ...prev,
      expenses: { ...prev.expenses, ...updates }
    }));
  }, []);

  const updateRenovation = useCallback((updates: Partial<UnderwritingInputs["renovation"]>) => {
    setInputs(prev => ({
      ...prev,
      renovation: { ...prev.renovation, ...updates }
    }));
  }, []);

  const updateFinancing = useCallback((updates: Partial<UnderwritingInputs["financing"]>) => {
    setInputs(prev => ({
      ...prev,
      financing: { ...prev.financing, ...updates }
    }));
  }, []);

  const updateTax = useCallback((updates: Partial<UnderwritingInputs["tax"]>) => {
    setInputs(prev => ({
      ...prev,
      tax: { ...prev.tax, ...updates }
    }));
  }, []);

  const runAnalysis = useCallback(() => {
    const analysisResults = runUnderwriting(inputs);
    setResults(analysisResults);
  }, [inputs]);

  const resetInputs = useCallback(() => {
    setInputs(getDefaultInputs());
    setResults(null);
    setCurrentStep(0);
  }, []);

  return (
    <UnderwritingContext.Provider
      value={{
        inputs,
        results,
        updateInputs,
        updateAcquisition,
        updateIncome,
        updateExpenses,
        updateRenovation,
        updateFinancing,
        updateTax,
        runAnalysis,
        resetInputs,
        currentStep,
        setCurrentStep,
      }}
    >
      {children}
    </UnderwritingContext.Provider>
  );
}

export function useUnderwriting() {
  const context = useContext(UnderwritingContext);
  if (context === undefined) {
    throw new Error("useUnderwriting must be used within an UnderwritingProvider");
  }
  return context;
}
