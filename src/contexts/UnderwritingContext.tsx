import React, { createContext, useContext, useState, useCallback } from "react";
import { 
  UnderwritingInputs, 
  UnderwritingResults, 
  getDefaultInputs, 
  runUnderwriting 
} from "@/lib/underwriting";

export interface PropertyAddress {
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface UnderwritingContextType {
  inputs: UnderwritingInputs;
  results: UnderwritingResults | null;
  propertyAddress: PropertyAddress;
  updateInputs: (updates: Partial<UnderwritingInputs>) => void;
  updateAcquisition: (updates: Partial<UnderwritingInputs["acquisition"]>) => void;
  updateIncome: (updates: Partial<UnderwritingInputs["income"]>) => void;
  updateExpenses: (updates: Partial<UnderwritingInputs["expenses"]>) => void;
  updateRenovation: (updates: Partial<UnderwritingInputs["renovation"]>) => void;
  updateFinancing: (updates: Partial<UnderwritingInputs["financing"]>) => void;
  updateTax: (updates: Partial<UnderwritingInputs["tax"]>) => void;
  updatePropertyAddress: (updates: Partial<PropertyAddress>) => void;
  runAnalysis: () => void;
  resetInputs: () => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

const UnderwritingContext = createContext<UnderwritingContextType | undefined>(undefined);

const getDefaultPropertyAddress = (): PropertyAddress => ({
  address: "",
  city: "",
  state: "",
  zipCode: "",
});

// Standardized storage keys
const STORAGE_KEY = "dealcalc:underwrite:state";
const RESULTS_KEY = "dealcalc:underwrite:results";

// Load inputs from localStorage with defensive parsing
const loadFromStorage = (): { inputs: UnderwritingInputs; address: PropertyAddress } | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.inputs && typeof parsed.inputs === 'object') {
        // Deep merge with defaults to ensure all fields exist
        const defaults = getDefaultInputs();
        return {
          inputs: {
            ...defaults,
            ...parsed.inputs,
            acquisition: { ...defaults.acquisition, ...parsed.inputs.acquisition },
            income: { ...defaults.income, ...parsed.inputs.income },
            expenses: { ...defaults.expenses, ...parsed.inputs.expenses },
            renovation: { ...defaults.renovation, ...parsed.inputs.renovation },
            financing: { ...defaults.financing, ...parsed.inputs.financing },
            tax: { ...defaults.tax, ...parsed.inputs.tax },
          },
          address: parsed.address || getDefaultPropertyAddress(),
        };
      }
    }
  } catch (err) {
    console.error("[Underwriting] Failed to load state from storage:", err);
    localStorage.removeItem(STORAGE_KEY);
  }
  return null;
};

// Load results from localStorage with validation
const loadResultsFromStorage = (): UnderwritingResults | null => {
  try {
    const stored = localStorage.getItem(RESULTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate that we have the expected structure
      if (parsed && parsed.metrics && typeof parsed.metrics === 'object') {
        return parsed;
      }
    }
  } catch (err) {
    console.error("[Underwriting] Failed to load results from storage:", err);
    localStorage.removeItem(RESULTS_KEY);
  }
  return null;
};

// Save inputs to localStorage
const saveToStorage = (inputs: UnderwritingInputs, address: PropertyAddress) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ inputs, address }));
  } catch (err) {
    console.error("[Underwriting] Failed to save state:", err);
  }
};

// Save results to localStorage
const saveResultsToStorage = (results: UnderwritingResults | null) => {
  try {
    if (results) {
      localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
    } else {
      localStorage.removeItem(RESULTS_KEY);
    }
  } catch (err) {
    console.error("[Underwriting] Failed to save results:", err);
  }
};

export function UnderwritingProvider({ children }: { children: React.ReactNode }) {
  const stored = loadFromStorage();
  const storedResults = loadResultsFromStorage();
  
  const [inputs, setInputs] = useState<UnderwritingInputs>(stored?.inputs || getDefaultInputs());
  const [results, setResults] = useState<UnderwritingResults | null>(storedResults);
  const [currentStep, setCurrentStep] = useState(0);
  const [propertyAddress, setPropertyAddress] = useState<PropertyAddress>(stored?.address || getDefaultPropertyAddress());

  const updateInputs = useCallback((updates: Partial<UnderwritingInputs>) => {
    setInputs(prev => {
      const next = { ...prev, ...updates };
      saveToStorage(next, propertyAddress);
      return next;
    });
  }, [propertyAddress]);

  const updateAcquisition = useCallback((updates: Partial<UnderwritingInputs["acquisition"]>) => {
    setInputs(prev => {
      const next = { ...prev, acquisition: { ...prev.acquisition, ...updates } };
      saveToStorage(next, propertyAddress);
      return next;
    });
  }, [propertyAddress]);

  const updateIncome = useCallback((updates: Partial<UnderwritingInputs["income"]>) => {
    setInputs(prev => {
      const next = { ...prev, income: { ...prev.income, ...updates } };
      saveToStorage(next, propertyAddress);
      return next;
    });
  }, [propertyAddress]);

  const updateExpenses = useCallback((updates: Partial<UnderwritingInputs["expenses"]>) => {
    setInputs(prev => {
      const next = { ...prev, expenses: { ...prev.expenses, ...updates } };
      saveToStorage(next, propertyAddress);
      return next;
    });
  }, [propertyAddress]);

  const updateRenovation = useCallback((updates: Partial<UnderwritingInputs["renovation"]>) => {
    setInputs(prev => {
      const next = { ...prev, renovation: { ...prev.renovation, ...updates } };
      saveToStorage(next, propertyAddress);
      return next;
    });
  }, [propertyAddress]);

  const updateFinancing = useCallback((updates: Partial<UnderwritingInputs["financing"]>) => {
    setInputs(prev => {
      const next = { ...prev, financing: { ...prev.financing, ...updates } };
      saveToStorage(next, propertyAddress);
      return next;
    });
  }, [propertyAddress]);

  const updateTax = useCallback((updates: Partial<UnderwritingInputs["tax"]>) => {
    setInputs(prev => {
      const next = { ...prev, tax: { ...prev.tax, ...updates } };
      saveToStorage(next, propertyAddress);
      return next;
    });
  }, [propertyAddress]);

  const updatePropertyAddress = useCallback((updates: Partial<PropertyAddress>) => {
    setPropertyAddress(prev => {
      const next = { ...prev, ...updates };
      saveToStorage(inputs, next);
      return next;
    });
  }, [inputs]);

  const runAnalysis = useCallback(() => {
    try {
      const analysisResults = runUnderwriting(inputs);
      if (analysisResults && analysisResults.metrics) {
        // Save results FIRST before any state updates
        saveResultsToStorage(analysisResults);
        saveToStorage(inputs, propertyAddress);
        localStorage.setItem("dealcalc:underwrite:lastUpdatedAt", new Date().toISOString());
        
        // Then update state
        setResults(analysisResults);
        console.log("[Underwriting] Analysis complete, results saved to localStorage");
      } else {
        console.error("[Underwriting] Analysis returned invalid results");
        setResults(null);
      }
    } catch (err) {
      console.error("[Underwriting] Analysis failed:", err);
      setResults(null);
      saveResultsToStorage(null);
    }
  }, [inputs, propertyAddress]);

  const resetInputs = useCallback(() => {
    const defaultInputs = getDefaultInputs();
    const defaultAddress = getDefaultPropertyAddress();
    setInputs(defaultInputs);
    setResults(null);
    setCurrentStep(0);
    setPropertyAddress(defaultAddress);
    // Clear all storage
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(RESULTS_KEY);
    localStorage.removeItem("dealcalc:underwrite:lastUpdatedAt");
  }, []);

  return (
    <UnderwritingContext.Provider
      value={{
        inputs,
        results,
        propertyAddress,
        updateInputs,
        updateAcquisition,
        updateIncome,
        updateExpenses,
        updateRenovation,
        updateFinancing,
        updateTax,
        updatePropertyAddress,
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