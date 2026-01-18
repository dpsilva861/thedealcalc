/**
 * Saved Scenarios Hook for BRRRR Calculator
 * 
 * Manages save/load/delete of named scenarios in localStorage.
 */

import { useState, useCallback, useEffect } from 'react';
import { BRRRRInputs, getDefaultBRRRRInputs } from '@/lib/calculators/brrrr';
import { validateBRRRRInputs } from '@/lib/calculators/brrrr/validation';
import { toast } from 'sonner';

const STORAGE_KEY = 'dealcalc:brrrr:scenarios';
const MAX_SCENARIOS = 25;

export interface SavedBRRRRScenario {
  id: string;
  name: string;
  savedAt: string;
  inputs: BRRRRInputs;
}

interface StoredScenarios {
  version: number;
  scenarios: SavedBRRRRScenario[];
}

function generateId(): string {
  return `brrrr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function loadScenarios(): SavedBRRRRScenario[] {
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
    console.error('[BRRRR Scenarios] Failed to load:', err);
    return [];
  }
}

function saveScenarios(scenarios: SavedBRRRRScenario[]): void {
  try {
    const stored: StoredScenarios = {
      version: 1,
      scenarios,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (err) {
    console.error('[BRRRR Scenarios] Failed to save:', err);
    toast.error('Failed to save scenario');
  }
}

function sanitizeBRRRRInputs(inputs: BRRRRInputs): BRRRRInputs {
  const defaults = getDefaultBRRRRInputs();
  return {
    acquisition: { ...defaults.acquisition, ...inputs.acquisition },
    bridgeFinancing: { ...defaults.bridgeFinancing, ...inputs.bridgeFinancing },
    afterRepairValue: { ...defaults.afterRepairValue, ...inputs.afterRepairValue },
    refinance: { ...defaults.refinance, ...inputs.refinance },
    rentalOperations: { ...defaults.rentalOperations, ...inputs.rentalOperations },
  };
}

export function useBRRRRScenarios(
  currentInputs: BRRRRInputs,
  onLoadScenario: (inputs: BRRRRInputs) => void
) {
  const [scenarios, setScenarios] = useState<SavedBRRRRScenario[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setScenarios(loadScenarios());
    setIsLoaded(true);
  }, []);

  const saveScenario = useCallback((name?: string) => {
    const scenarioName = name?.trim() || `Scenario ${new Date().toLocaleString()}`;
    
    const validation = validateBRRRRInputs(currentInputs);
    if (!validation.isValid) {
      toast.error('Cannot save: fix input errors first');
      return null;
    }
    
    const newScenario: SavedBRRRRScenario = {
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
    
    const sanitized = sanitizeBRRRRInputs(scenario.inputs);
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
