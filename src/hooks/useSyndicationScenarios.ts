/**
 * Saved Scenarios Hook for Syndication Calculator
 * 
 * Manages save/load/delete of named scenarios in localStorage.
 */

import { useState, useCallback, useEffect } from 'react';
import { SyndicationInputs, DEFAULT_SYNDICATION_INPUTS } from '@/lib/calculators/syndication/types';
import { validateSyndicationInputs } from '@/lib/calculators/syndication/validation';
import { toast } from 'sonner';

const STORAGE_KEY = 'dealcalc:syndication:scenarios';
const MAX_SCENARIOS = 25;

export interface SavedSyndicationScenario {
  id: string;
  name: string;
  savedAt: string;
  inputs: SyndicationInputs;
}

interface StoredScenarios {
  version: number;
  scenarios: SavedSyndicationScenario[];
}

function generateId(): string {
  return `syndication_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function loadScenarios(): SavedSyndicationScenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    
    const parsed: StoredScenarios = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.scenarios)) {
      return parsed.scenarios;
    }
    
    if (Array.isArray(parsed)) {
      return parsed;
    }
    
    return [];
  } catch (err) {
    console.error('[Syndication Scenarios] Failed to load:', err);
    return [];
  }
}

function saveScenarios(scenarios: SavedSyndicationScenario[]): void {
  try {
    const stored: StoredScenarios = {
      version: 1,
      scenarios,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (err) {
    console.error('[Syndication Scenarios] Failed to save:', err);
    toast.error('Failed to save scenario');
  }
}

function sanitizeSyndicationInputs(inputs: SyndicationInputs): SyndicationInputs {
  return {
    ...DEFAULT_SYNDICATION_INPUTS,
    ...inputs,
    acquisition: { ...DEFAULT_SYNDICATION_INPUTS.acquisition, ...inputs.acquisition },
    debt: { ...DEFAULT_SYNDICATION_INPUTS.debt, ...inputs.debt },
    equity: { ...DEFAULT_SYNDICATION_INPUTS.equity, ...inputs.equity },
    proforma: { ...DEFAULT_SYNDICATION_INPUTS.proforma, ...inputs.proforma },
    exit: { ...DEFAULT_SYNDICATION_INPUTS.exit, ...inputs.exit },
    waterfall: { ...DEFAULT_SYNDICATION_INPUTS.waterfall, ...inputs.waterfall },
  };
}

export function useSyndicationScenarios(
  currentInputs: SyndicationInputs,
  onLoadScenario: (inputs: SyndicationInputs) => void
) {
  const [scenarios, setScenarios] = useState<SavedSyndicationScenario[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setScenarios(loadScenarios());
    setIsLoaded(true);
  }, []);

  const saveScenario = useCallback((name?: string) => {
    const scenarioName = name?.trim() || `Scenario ${new Date().toLocaleString()}`;
    
    const validation = validateSyndicationInputs(currentInputs);
    if (!validation.isValid) {
      toast.error('Cannot save: fix input errors first');
      return null;
    }
    
    const newScenario: SavedSyndicationScenario = {
      id: generateId(),
      name: scenarioName,
      savedAt: new Date().toISOString(),
      inputs: { ...currentInputs },
    };
    
    setScenarios(prev => {
      const updated = [newScenario, ...prev].slice(0, MAX_SCENARIOS);
      saveScenarios(updated);
      return updated;
    });
    
    toast.success(`Saved "${scenarioName}"`);
    return newScenario;
  }, [currentInputs]);

  const loadScenario = useCallback((id: string) => {
    const scenario = scenarios.find(s => s.id === id);
    if (!scenario) {
      toast.error('Scenario not found');
      return;
    }
    
    const sanitized = sanitizeSyndicationInputs(scenario.inputs);
    onLoadScenario(sanitized);
    toast.success(`Loaded "${scenario.name}"`);
  }, [scenarios, onLoadScenario]);

  const deleteScenario = useCallback((id: string) => {
    setScenarios(prev => {
      const updated = prev.filter(s => s.id !== id);
      saveScenarios(updated);
      return updated;
    });
    toast.success('Scenario deleted');
  }, []);

  return {
    scenarios,
    isLoaded,
    saveScenario,
    loadScenario,
    deleteScenario,
  };
}
