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

const loadFromStorage = (): { inputs: BRRRRInputs; address: BRRRRPropertyAddress } | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return null;
};

const saveToStorage = (inputs: BRRRRInputs, address: BRRRRPropertyAddress) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ inputs, address }));
  } catch { /* ignore */ }
};

export function BRRRRProvider({ children }: { children: React.ReactNode }) {
  const stored = loadFromStorage();
  const [inputs, setInputs] = useState<BRRRRInputs>(stored?.inputs || getDefaultBRRRRInputs());
  const [results, setResults] = useState<BRRRRResults | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [propertyAddress, setPropertyAddress] = useState<BRRRRPropertyAddress>(stored?.address || getDefaultPropertyAddress());
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const updateInputs = useCallback((updates: Partial<BRRRRInputs>) => {
    setInputs(prev => {
      const next = { ...prev, ...updates };
      saveToStorage(next, propertyAddress);
      return next;
    });
    setSelectedPreset(null);
  }, [propertyAddress]);

  const updateAcquisition = useCallback((updates: Partial<BRRRRInputs["acquisition"]>) => {
    setInputs(prev => ({
      ...prev,
      acquisition: { ...prev.acquisition, ...updates }
    }));
    setSelectedPreset(null);
  }, []);

  const updateBridgeFinancing = useCallback((updates: Partial<BRRRRInputs["bridgeFinancing"]>) => {
    setInputs(prev => ({
      ...prev,
      bridgeFinancing: { ...prev.bridgeFinancing, ...updates }
    }));
    setSelectedPreset(null);
  }, []);

  const updateAfterRepairValue = useCallback((updates: Partial<BRRRRInputs["afterRepairValue"]>) => {
    setInputs(prev => ({
      ...prev,
      afterRepairValue: { ...prev.afterRepairValue, ...updates }
    }));
    setSelectedPreset(null);
  }, []);

  const updateRefinance = useCallback((updates: Partial<BRRRRInputs["refinance"]>) => {
    setInputs(prev => ({
      ...prev,
      refinance: { ...prev.refinance, ...updates }
    }));
    setSelectedPreset(null);
  }, []);

  const updateRentalOperations = useCallback((updates: Partial<BRRRRInputs["rentalOperations"]>) => {
    setInputs(prev => ({
      ...prev,
      rentalOperations: { ...prev.rentalOperations, ...updates }
    }));
    setSelectedPreset(null);
  }, []);

  const updatePropertyAddress = useCallback((updates: Partial<BRRRRPropertyAddress>) => {
    setPropertyAddress(prev => ({ ...prev, ...updates }));
  }, []);

  const loadPreset = useCallback((presetId: string) => {
    const preset = BRRRR_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setInputs(preset.inputs);
      setSelectedPreset(presetId);
      setResults(null);
    }
  }, []);

  const runAnalysis = useCallback(() => {
    try {
      const analysisResults = runBRRRRAnalysis(inputs);
      setResults(analysisResults);
    } catch (err) {
      console.error("BRRRR analysis failed:", err);
      setResults(null);
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
