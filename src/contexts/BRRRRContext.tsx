import React, { createContext, useContext, useState, useCallback } from "react";
import { 
  BRRRRInputs, 
  BRRRRResults,
  getDefaultBRRRRInputs,
  runBRRRRAnalysis,
  BRRRR_PRESETS,
  BRRRRPreset,
} from "@/lib/calculators/brrrr";
import { devLog } from "@/lib/devLogger";

export interface BRRRRPropertyAddress {
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface BRRRRContextType {
  inputs: BRRRRInputs;
  results: BRRRRResults | null;
  propertyAddress: BRRRRPropertyAddress;
  selectedPreset: string | null;
  updateInputs: (updates: Partial<BRRRRInputs>) => void;
  updateAcquisition: (updates: Partial<BRRRRInputs["acquisition"]>) => void;
  updateBridgeFinancing: (updates: Partial<BRRRRInputs["bridgeFinancing"]>) => void;
  updateAfterRepairValue: (updates: Partial<BRRRRInputs["afterRepairValue"]>) => void;
  updateRefinance: (updates: Partial<BRRRRInputs["refinance"]>) => void;
  updateRentalOperations: (updates: Partial<BRRRRInputs["rentalOperations"]>) => void;
  updatePropertyAddress: (updates: Partial<BRRRRPropertyAddress>) => void;
  loadPreset: (presetId: string) => void;
  runAnalysis: () => void;
  resetInputs: () => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

const BRRRRContext = createContext<BRRRRContextType | undefined>(undefined);

const getDefaultPropertyAddress = (): BRRRRPropertyAddress => ({
  address: "",
  city: "",
  state: "",
  zipCode: "",
});

// Standardized storage keys matching other calculators
const STORAGE_KEY = "dealcalc:brrrr:state";
const RESULTS_KEY = "dealcalc:brrrr:results";

// Legacy keys for migration
const LEGACY_STORAGE_KEY = "brrrr_state";
const LEGACY_RESULTS_KEY = "brrrr_results";

const loadFromStorage = (): { inputs: BRRRRInputs; address: BRRRRPropertyAddress } | null => {
  try {
    // Try new key first, then legacy
    let stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      stored = localStorage.getItem(LEGACY_STORAGE_KEY);
      // Migrate to new key if found
      if (stored) {
        localStorage.setItem(STORAGE_KEY, stored);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    }
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (err) {
    console.error("[BRRRR] Failed to load state from storage:", err);
    // Clear corrupted data
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }
  return null;
};

const loadResultsFromStorage = (): BRRRRResults | null => {
  try {
    // Try new key first, then legacy
    let stored = localStorage.getItem(RESULTS_KEY);
    if (!stored) {
      stored = localStorage.getItem(LEGACY_RESULTS_KEY);
      // Migrate to new key if found
      if (stored) {
        localStorage.setItem(RESULTS_KEY, stored);
        localStorage.removeItem(LEGACY_RESULTS_KEY);
      }
    }
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate that we have the expected structure
      if (parsed && parsed.metrics && typeof parsed.metrics === 'object') {
        return parsed;
      }
    }
  } catch (err) {
    console.error("[BRRRR] Failed to load results from storage:", err);
    // Clear corrupted data
    localStorage.removeItem(RESULTS_KEY);
    localStorage.removeItem(LEGACY_RESULTS_KEY);
  }
  return null;
};

const saveToStorage = (inputs: BRRRRInputs, address: BRRRRPropertyAddress) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ inputs, address }));
  } catch (err) {
    console.error("[BRRRR] Failed to save state:", err);
  }
};

const saveResultsToStorage = (results: BRRRRResults | null) => {
  try {
    if (results) {
      localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
    } else {
      localStorage.removeItem(RESULTS_KEY);
    }
  } catch (err) {
    console.error("[BRRRR] Failed to save results:", err);
  }
};

export function BRRRRProvider({ children }: { children: React.ReactNode }) {
  const stored = loadFromStorage();
  const storedResults = loadResultsFromStorage();
  const [inputs, setInputs] = useState<BRRRRInputs>(stored?.inputs || getDefaultBRRRRInputs());
  const [results, setResults] = useState<BRRRRResults | null>(storedResults);
  const [currentStep, setCurrentStep] = useState(0);
  const [propertyAddress, setPropertyAddress] = useState<BRRRRPropertyAddress>(stored?.address || getDefaultPropertyAddress());
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // Helper to save inputs whenever they change
  const saveInputs = useCallback((newInputs: BRRRRInputs, address: BRRRRPropertyAddress) => {
    saveToStorage(newInputs, address);
  }, []);

  const updateInputs = useCallback((updates: Partial<BRRRRInputs>) => {
    setInputs(prev => {
      const next = { ...prev, ...updates };
      saveInputs(next, propertyAddress);
      return next;
    });
    setSelectedPreset(null);
  }, [propertyAddress, saveInputs]);

  const updateAcquisition = useCallback((updates: Partial<BRRRRInputs["acquisition"]>) => {
    setInputs(prev => {
      const next = { ...prev, acquisition: { ...prev.acquisition, ...updates } };
      saveInputs(next, propertyAddress);
      return next;
    });
    setSelectedPreset(null);
  }, [propertyAddress, saveInputs]);

  const updateBridgeFinancing = useCallback((updates: Partial<BRRRRInputs["bridgeFinancing"]>) => {
    setInputs(prev => {
      const next = { ...prev, bridgeFinancing: { ...prev.bridgeFinancing, ...updates } };
      saveInputs(next, propertyAddress);
      return next;
    });
    setSelectedPreset(null);
  }, [propertyAddress, saveInputs]);

  const updateAfterRepairValue = useCallback((updates: Partial<BRRRRInputs["afterRepairValue"]>) => {
    setInputs(prev => {
      const next = { ...prev, afterRepairValue: { ...prev.afterRepairValue, ...updates } };
      saveInputs(next, propertyAddress);
      return next;
    });
    setSelectedPreset(null);
  }, [propertyAddress, saveInputs]);

  const updateRefinance = useCallback((updates: Partial<BRRRRInputs["refinance"]>) => {
    setInputs(prev => {
      const next = { ...prev, refinance: { ...prev.refinance, ...updates } };
      saveInputs(next, propertyAddress);
      return next;
    });
    setSelectedPreset(null);
  }, [propertyAddress, saveInputs]);

  const updateRentalOperations = useCallback((updates: Partial<BRRRRInputs["rentalOperations"]>) => {
    setInputs(prev => {
      const next = { ...prev, rentalOperations: { ...prev.rentalOperations, ...updates } };
      saveInputs(next, propertyAddress);
      return next;
    });
    setSelectedPreset(null);
  }, [propertyAddress, saveInputs]);

  const updatePropertyAddress = useCallback((updates: Partial<BRRRRPropertyAddress>) => {
    setPropertyAddress(prev => {
      const next = { ...prev, ...updates };
      saveToStorage(inputs, next);
      return next;
    });
  }, [inputs]);

  const loadPreset = useCallback((presetId: string) => {
    const preset = BRRRR_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setInputs(preset.inputs);
      setSelectedPreset(presetId);
      setResults(null);
      saveResultsToStorage(null);
    }
  }, []);

  const runAnalysis = useCallback(() => {
    try {
      const analysisResults = runBRRRRAnalysis(inputs);
      if (analysisResults && analysisResults.metrics) {
        // Save results FIRST before any state updates
        saveResultsToStorage(analysisResults);
        saveToStorage(inputs, propertyAddress);
        
        // Also save timestamp for debugging
        localStorage.setItem("dealcalc:brrrr:lastUpdatedAt", new Date().toISOString());
        
        // Dev logging
        devLog.resultsSaved("BRRRR", RESULTS_KEY);
        
        // Then update state
        setResults(analysisResults);
      } else {
        console.error("[BRRRR] Analysis returned invalid results");
        setResults(null);
      }
    } catch (err) {
      console.error("[BRRRR] Analysis failed:", err);
      setResults(null);
      saveResultsToStorage(null);
    }
  }, [inputs, propertyAddress]);

  const resetInputs = useCallback(() => {
    const defaultInputs = getDefaultBRRRRInputs();
    const defaultAddress = getDefaultPropertyAddress();
    setInputs(defaultInputs);
    setResults(null);
    setCurrentStep(0);
    setPropertyAddress(defaultAddress);
    setSelectedPreset(null);
    // Clear all storage keys (new and legacy)
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(RESULTS_KEY);
    localStorage.removeItem("brrrr_state");
    localStorage.removeItem("brrrr_results");
    localStorage.removeItem("dealcalc:brrrr:lastUpdatedAt");
  }, []);

  return (
    <BRRRRContext.Provider
      value={{
        inputs,
        results,
        propertyAddress,
        selectedPreset,
        updateInputs,
        updateAcquisition,
        updateBridgeFinancing,
        updateAfterRepairValue,
        updateRefinance,
        updateRentalOperations,
        updatePropertyAddress,
        loadPreset,
        runAnalysis,
        resetInputs,
        currentStep,
        setCurrentStep,
      }}
    >
      {children}
    </BRRRRContext.Provider>
  );
}

export function useBRRRR() {
  const context = useContext(BRRRRContext);
  if (context === undefined) {
    throw new Error("useBRRRR must be used within a BRRRRProvider");
  }
  return context;
}
