/**
 * Saved Scenarios Hook for Underwrite Calculator
 * 
 * Manages save/load/delete of named scenarios in localStorage.
 */

import { useState, useCallback, useEffect } from 'react';
import { UnderwritingInputs, getDefaultInputs } from '@/lib/underwriting';
import { validateInputs } from '@/lib/validation';
import { toast } from 'sonner';

const STORAGE_KEY = 'dealcalc:underwrite:scenarios';
const MAX_SCENARIOS = 25;

export interface SavedUnderwriteScenario {
  id: string;
  name: string;
  savedAt: string;
  inputs: UnderwritingInputs;
}

interface StoredScenarios {
  version: number;
  scenarios: SavedUnderwriteScenario[];
}

function generateId(): string {
  return `underwrite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function loadScenarios(): SavedUnderwriteScenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    
    const parsed: StoredScenarios = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.scenarios)) {
      return parsed.scenarios;
    }
    
    // Legacy format - just an array
    if (Array.isArray(parsed)) {
      return parsed;
    }
    
    return [];
  } catch (err) {
    console.error('[Underwrite Scenarios] Failed to load:', err);
    return [];
  }
}

function saveScenarios(scenarios: SavedUnderwriteScenario[]): void {
  try {
    const stored: StoredScenarios = {
      version: 1,
      scenarios,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (err) {
    console.error('[Underwrite Scenarios] Failed to save:', err);
    toast.error('Failed to save scenario');
  }
}

function sanitizeUnderwriteInputs(inputs: UnderwritingInputs): UnderwritingInputs {
  const defaults = getDefaultInputs();
  return {
    ...defaults,
    ...inputs,
    acquisition: { ...defaults.acquisition, ...inputs.acquisition },
    income: { ...defaults.income, ...inputs.income },
    expenses: { ...defaults.expenses, ...inputs.expenses },
    renovation: { ...defaults.renovation, ...inputs.renovation },
    financing: { ...defaults.financing, ...inputs.financing },
    tax: { ...defaults.tax, ...inputs.tax },
  };
}

export function useUnderwriteScenarios(
  currentInputs: UnderwritingInputs,
  onLoadScenario: (inputs: UnderwritingInputs) => void
) {
  const [scenarios, setScenarios] = useState<SavedUnderwriteScenario[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load on mount
  useEffect(() => {
    setScenarios(loadScenarios());
    setIsLoaded(true);
  }, []);

  const saveScenario = useCallback((name?: string) => {
    const scenarioName = name?.trim() || `Scenario ${new Date().toLocaleString()}`;
    
    // Validate inputs before saving
    const validation = validateInputs(currentInputs);
    if (!validation.isValid) {
      toast.error('Cannot save: fix input errors first');
      return null;
    }
    
    const newScenario: SavedUnderwriteScenario = {
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
    
    // Sanitize before loading
    const sanitized = sanitizeUnderwriteInputs(scenario.inputs);
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
