import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { SyndicationInputs, SyndicationResults, DEFAULT_SYNDICATION_INPUTS } from "@/lib/calculators/syndication/types";
import { runSyndicationAnalysis } from "@/lib/calculators/syndication";
import { validateSyndicationInputs, ValidationResult } from "@/lib/calculators/syndication/validation";
import { devLog } from "@/lib/devLogger";
import { toast } from "sonner";

export const SYNDICATION_PRESETS: Record<string, { name: string; description: string; inputs: SyndicationInputs }> = {
  default: { name: "Default 5-Year Hold", description: "Standard 60-month hold, 70/30 LTV, 8% pref", inputs: DEFAULT_SYNDICATION_INPUTS },
  conservative: { name: "Conservative", description: "Lower leverage, higher reserves", inputs: { ...DEFAULT_SYNDICATION_INPUTS, debt: { ...DEFAULT_SYNDICATION_INPUTS.debt, ltv_or_ltc_pct: 0.60 }, acquisition: { ...DEFAULT_SYNDICATION_INPUTS.acquisition, initial_reserves: 75000 }, waterfall: { ...DEFAULT_SYNDICATION_INPUTS.waterfall, pref_rate_annual: 0.10 } } },
  aggressive: { name: "Value-Add", description: "Higher LTV, larger capex, shorter hold", inputs: { ...DEFAULT_SYNDICATION_INPUTS, hold_period_months: 36, debt: { ...DEFAULT_SYNDICATION_INPUTS.debt, ltv_or_ltc_pct: 0.75, financing_type: "bridge_interest_only" as const }, acquisition: { ...DEFAULT_SYNDICATION_INPUTS.acquisition, capex_budget_total: 150000 }, exit: { ...DEFAULT_SYNDICATION_INPUTS.exit, sale_month: 36, exit_cap_rate: 0.05 } } },
};

interface SyndicationContextType {
  inputs: SyndicationInputs; results: SyndicationResults | null; currentStep: number; selectedPreset: string | null; validation: ValidationResult; error: string | null; isCalculating: boolean;
  setInputs: React.Dispatch<React.SetStateAction<SyndicationInputs>>;
  updateAcquisition: (updates: Partial<SyndicationInputs["acquisition"]>) => void;
  updateDebt: (updates: Partial<SyndicationInputs["debt"]>) => void;
  updateEquity: (updates: Partial<SyndicationInputs["equity"]>) => void;
  updateProforma: (updates: Partial<SyndicationInputs["proforma"]>) => void;
  updateExit: (updates: Partial<SyndicationInputs["exit"]>) => void;
  updateWaterfall: (updates: Partial<SyndicationInputs["waterfall"]>) => void;
  updateHoldPeriod: (months: number) => void;
  setCurrentStep: (step: number) => void;
  loadPreset: (presetId: string) => void;
  loadPresetAndRun: (presetId: string) => SyndicationResults | null;
  runAnalysis: () => void;
  resetInputs: () => void;
}

const SyndicationContext = createContext<SyndicationContextType | null>(null);
const STORAGE_KEY = "dealcalc:syndication:state";
const RESULTS_KEY = "dealcalc:syndication:results";

function loadInputsFromStorage(): SyndicationInputs {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("syndication_inputs");
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SYNDICATION_INPUTS, ...parsed, acquisition: { ...DEFAULT_SYNDICATION_INPUTS.acquisition, ...parsed.acquisition }, debt: { ...DEFAULT_SYNDICATION_INPUTS.debt, ...parsed.debt }, equity: { ...DEFAULT_SYNDICATION_INPUTS.equity, ...parsed.equity }, proforma: { ...DEFAULT_SYNDICATION_INPUTS.proforma, ...parsed.proforma }, exit: { ...DEFAULT_SYNDICATION_INPUTS.exit, ...parsed.exit }, waterfall: { ...DEFAULT_SYNDICATION_INPUTS.waterfall, ...parsed.waterfall } };
    }
  } catch (e) { console.error("[Syndication] Load failed:", e); }
  return DEFAULT_SYNDICATION_INPUTS;
}

function saveInputsToStorage(inputs: SyndicationInputs): void { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs)); } catch (e) { console.error("[Syndication] Save failed:", e); } }

function loadResultsFromStorage(): SyndicationResults | null {
  try {
    const stored = localStorage.getItem(RESULTS_KEY) || localStorage.getItem("syndication_results");
    if (stored) { const parsed = JSON.parse(stored); if (parsed?.metrics && parsed?.sources_and_uses) return parsed; }
  } catch (e) { console.error("[Syndication] Results load failed:", e); }
  return null;
}

function saveResultsToStorage(results: SyndicationResults | null): void { try { if (results) localStorage.setItem(RESULTS_KEY, JSON.stringify(results)); else localStorage.removeItem(RESULTS_KEY); } catch (e) { console.error("[Syndication] Results save failed:", e); } }

export function SyndicationProvider({ children }: { children: React.ReactNode }) {
  const [inputs, setInputs] = useState<SyndicationInputs>(loadInputsFromStorage);
  const [results, setResults] = useState<SyndicationResults | null>(loadResultsFromStorage);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const validation = useMemo(() => validateSyndicationInputs(inputs), [inputs]);

  const updateAcquisition = useCallback((updates: Partial<SyndicationInputs["acquisition"]>) => { setInputs(prev => { const next = { ...prev, acquisition: { ...prev.acquisition, ...updates } }; saveInputsToStorage(next); return next; }); setSelectedPreset(null); }, []);
  const updateDebt = useCallback((updates: Partial<SyndicationInputs["debt"]>) => { setInputs(prev => { const next = { ...prev, debt: { ...prev.debt, ...updates } }; saveInputsToStorage(next); return next; }); setSelectedPreset(null); }, []);
  const updateEquity = useCallback((updates: Partial<SyndicationInputs["equity"]>) => { setInputs(prev => { const next = { ...prev, equity: { ...prev.equity, ...updates } }; saveInputsToStorage(next); return next; }); setSelectedPreset(null); }, []);
  const updateProforma = useCallback((updates: Partial<SyndicationInputs["proforma"]>) => { setInputs(prev => { const next = { ...prev, proforma: { ...prev.proforma, ...updates } }; saveInputsToStorage(next); return next; }); setSelectedPreset(null); }, []);
  const updateExit = useCallback((updates: Partial<SyndicationInputs["exit"]>) => { setInputs(prev => { const next = { ...prev, exit: { ...prev.exit, ...updates } }; saveInputsToStorage(next); return next; }); setSelectedPreset(null); }, []);
  const updateWaterfall = useCallback((updates: Partial<SyndicationInputs["waterfall"]>) => { setInputs(prev => { const next = { ...prev, waterfall: { ...prev.waterfall, ...updates } }; saveInputsToStorage(next); return next; }); setSelectedPreset(null); }, []);
  const updateHoldPeriod = useCallback((months: number) => { setInputs(prev => { const next = { ...prev, hold_period_months: months }; saveInputsToStorage(next); return next; }); setSelectedPreset(null); }, []);

  const loadPreset = useCallback((presetId: string) => { const preset = SYNDICATION_PRESETS[presetId]; if (preset) { devLog.presetLoaded("Syndication", presetId, false); setInputs(preset.inputs); setSelectedPreset(presetId); saveInputsToStorage(preset.inputs); setResults(null); saveResultsToStorage(null); toast.success(`Loaded ${preset.name} preset`); } }, []);

  const loadPresetAndRun = useCallback((presetId: string): SyndicationResults | null => {
    const preset = SYNDICATION_PRESETS[presetId]; if (!preset) return null;
    devLog.scenarioSelected("Syndication", preset.name); devLog.analysisStarted("Syndication");
    setInputs(preset.inputs); setSelectedPreset(presetId); saveInputsToStorage(preset.inputs);
    try { const analysisResults = runSyndicationAnalysis(preset.inputs); if (analysisResults?.metrics && analysisResults?.sources_and_uses) { saveResultsToStorage(analysisResults); localStorage.setItem("dealcalc:syndication:lastUpdatedAt", new Date().toISOString()); devLog.resultsSaved("Syndication", RESULTS_KEY); setResults(analysisResults); toast.success("Analysis complete!"); return analysisResults; } } catch (err) { console.error("[Syndication] Analysis failed:", err); toast.error("Analysis failed."); }
    return null;
  }, []);

  const runAnalysis = useCallback(() => {
    if (!validation.isValid) { validation.errors.forEach(e => toast.error(e.message)); return; }
    setIsCalculating(true); setError(null);
    try { devLog.analysisStarted("Syndication"); const analysisResults = runSyndicationAnalysis(inputs); if (!analysisResults?.metrics || !analysisResults?.sources_and_uses) throw new Error("Analysis returned incomplete results"); saveResultsToStorage(analysisResults); saveInputsToStorage(inputs); localStorage.setItem("dealcalc:syndication:lastUpdatedAt", new Date().toISOString()); devLog.resultsSaved("Syndication", RESULTS_KEY); setResults(analysisResults); toast.success("Analysis complete!"); }
    catch (e: any) { console.error("[Syndication] Analysis error:", e); setError(e?.message || "Calculation failed."); toast.error(e?.message || "Calculation failed"); setResults(null); saveResultsToStorage(null); }
    finally { setIsCalculating(false); }
  }, [inputs, validation]);

  const resetInputs = useCallback(() => { setInputs(DEFAULT_SYNDICATION_INPUTS); setResults(null); setCurrentStep(0); setSelectedPreset(null); setError(null); localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(RESULTS_KEY); localStorage.removeItem("syndication_inputs"); localStorage.removeItem("syndication_results"); localStorage.removeItem("dealcalc:syndication:lastUpdatedAt"); toast.success("Inputs reset"); }, []);

  return (<SyndicationContext.Provider value={{ inputs, results, currentStep, selectedPreset, validation, error, isCalculating, setInputs, updateAcquisition, updateDebt, updateEquity, updateProforma, updateExit, updateWaterfall, updateHoldPeriod, setCurrentStep, loadPreset, loadPresetAndRun, runAnalysis, resetInputs }}>{children}</SyndicationContext.Provider>);
}

export function useSyndication() { const context = useContext(SyndicationContext); if (!context) throw new Error("useSyndication must be used within SyndicationProvider"); return context; }
