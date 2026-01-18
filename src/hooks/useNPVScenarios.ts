/**
 * Saved Scenarios Hook for NPV Calculator
 * 
 * Manages save/load/delete of named scenarios in localStorage.
 */

import { useState, useCallback, useEffect } from 'react';
import { NPVInputs, DEFAULT_NPV_INPUTS } from '@/lib/calculators/npv/types';
import { validateNPVInputs, sanitizeNPVInputs } from '@/lib/calculators/npv/validation';
import { toast } from 'sonner';

const STORAGE_KEY = 'dealcalc:npv:scenarios';
const MAX_SCENARIOS = 10;

export interface SavedNPVScenario {
  id: string;
  name: string;
  savedAt: string;
  inputs: NPVInputs;
}

interface StoredScenarios {
  version: number;
  scenarios: SavedNPVScenario[];
}

function generateId(): string {
  return `npv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function loadScenarios(): SavedNPVScenario[] {
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
    console.error('[NPV Scenarios] Failed to load:', err);
    return [];
  }
}

function saveScenarios(scenarios: SavedNPVScenario[]): void {
  try {
    const stored: StoredScenarios = {
      version: 1,
      scenarios,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (err) {
    console.error('[NPV Scenarios] Failed to save:', err);
    toast.error('Failed to save scenario');
  }
}

export function useNPVScenarios(
  currentInputs: NPVInputs,
  onLoadScenario: (inputs: NPVInputs) => void
) {
  const [scenarios, setScenarios] = useState<SavedNPVScenario[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load on mount
  useEffect(() => {
    setScenarios(loadScenarios());
    setIsLoaded(true);
  }, []);

  const saveScenario = useCallback((name?: string) => {
    const scenarioName = name?.trim() || `Scenario ${new Date().toLocaleString()}`;
    
    // Validate inputs before saving
    const validation = validateNPVInputs(currentInputs);
    if (!validation.isValid) {
      toast.error('Cannot save: fix input errors first');
      return null;
    }
    
    const newScenario: SavedNPVScenario = {
      id: generateId(),
      name: scenarioName,
      savedAt: new Date().toISOString(),
      inputs: { ...currentInputs },
    };
    
    setScenarios(prev => {
      // Limit to MAX_SCENARIOS (remove oldest if over)
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
    
    // Sanitize and validate before loading
    const sanitized = sanitizeNPVInputs(scenario.inputs);
    const validation = validateNPVInputs(sanitized);
    
    if (!validation.isValid) {
      toast.error('Scenario data is invalid');
      return;
    }
    
    // Merge with defaults to handle any missing fields
    const merged = { ...DEFAULT_NPV_INPUTS, ...sanitized };
    onLoadScenario(merged);
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

  const renameScenario = useCallback((id: string, newName: string) => {
    setScenarios(prev => {
      const updated = prev.map(s => 
        s.id === id ? { ...s, name: newName.trim() || s.name } : s
      );
      saveScenarios(updated);
      return updated;
    });
  }, []);

  return {
    scenarios,
    isLoaded,
    saveScenario,
    loadScenario,
    deleteScenario,
    renameScenario,
  };
}
