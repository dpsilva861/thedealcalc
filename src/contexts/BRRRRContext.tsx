import React, { createContext, useContext, useState, useCallback } from "react";
import { 
  BRRRRInputs, 
  BRRRRResults,
  getDefaultBRRRRInputs,
  runBRRRRAnalysis,
  BRRRR_PRESETS,
  BRRRRPreset,
} from "@/lib/calculators/brrrr";

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

const STORAGE_KEY = "brrrr_state";
const RESULTS_KEY = "brrrr_results";

const loadFromStorage = (): { inputs: BRRRRInputs; address: BRRRRPropertyAddress } | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return null;
};

const loadResultsFromStorage = (): BRRRRResults | null => {
  try {
    const stored = localStorage.getItem(RESULTS_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return null;
};

const saveToStorage = (inputs: BRRRRInputs, address: BRRRRPropertyAddress) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ inputs, address }));
  } catch { /* ignore */ }
};

const saveResultsToStorage = (results: BRRRRResults | null) => {
  try {
    if (results) {
      localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
    } else {
      localStorage.removeItem(RESULTS_KEY);
    }
  } catch { /* ignore */ }
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
        setResults(analysisResults);
        saveResultsToStorage(analysisResults);
        // Also save inputs and timestamp for debugging
        localStorage.setItem("dealcalc:brrrr:lastInputs", JSON.stringify(inputs));
        localStorage.setItem("dealcalc:brrrr:lastUpdatedAt", new Date().toISOString());
        console.log("[BRRRR] Analysis complete, results saved to localStorage");
      } else {
        console.error("[BRRRR] Analysis returned invalid results");
        setResults(null);
      }
    } catch (err) {
      console.error("[BRRRR] Analysis failed:", err);
      setResults(null);
      saveResultsToStorage(null);
    }
  }, [inputs]);

  const resetInputs = useCallback(() => {
    const defaultInputs = getDefaultBRRRRInputs();
    const defaultAddress = getDefaultPropertyAddress();
    setInputs(defaultInputs);
    setResults(null);
    setCurrentStep(0);
    setPropertyAddress(defaultAddress);
    setSelectedPreset(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(RESULTS_KEY);
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
