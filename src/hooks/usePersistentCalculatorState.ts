/**
 * Persistent Calculator State Hook
 * 
 * Shared hook for safely persisting calculator state to localStorage
 * with versioning, validation, and SSR-safety.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

interface StorageSchema<T> {
  version: number;
  data: T;
  savedAt: string;
}

interface UsePersistentCalculatorStateOptions<T> {
  /** Unique storage key */
  key: string;
  /** Default values if nothing stored */
  defaults: T;
  /** Schema version - increment when structure changes */
  version?: number;
  /** Validator function - returns true if data is valid */
  validate?: (data: unknown) => data is T;
  /** Migration function for old versions */
  migrate?: (oldData: unknown, oldVersion: number) => T | null;
}

interface UsePersistentCalculatorStateReturn<T> {
  state: T;
  setState: (updater: T | ((prev: T) => T)) => void;
  resetState: () => void;
  lastSavedAt: Date | null;
  isLoaded: boolean;
}

/**
 * Check if running in browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

/**
 * Safely parse JSON from localStorage
 */
function safeGetItem<T>(key: string): StorageSchema<T> | null {
  if (!isBrowser()) return null;
  
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'version' in parsed && 'data' in parsed) {
      return parsed as StorageSchema<T>;
    }
    
    // Handle legacy format (no version wrapper)
    return {
      version: 0,
      data: parsed as T,
      savedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`[usePersistentCalculatorState] Failed to parse ${key}:`, err);
    // Remove corrupted data
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore removal errors
    }
    return null;
  }
}

/**
 * Safely save to localStorage
 */
function safeSaveItem<T>(key: string, data: T, version: number): void {
  if (!isBrowser()) return;
  
  try {
    const schema: StorageSchema<T> = {
      version,
      data,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(schema));
  } catch (err) {
    console.error(`[usePersistentCalculatorState] Failed to save ${key}:`, err);
  }
}

/**
 * Default validator - accepts any non-null object
 */
function defaultValidator<T>(data: unknown): data is T {
  return data !== null && typeof data === 'object';
}

/**
 * Hook for persisting calculator state with validation and versioning
 */
export function usePersistentCalculatorState<T extends object>({
  key,
  defaults,
  version = 1,
  validate = defaultValidator,
  migrate,
}: UsePersistentCalculatorStateOptions<T>): UsePersistentCalculatorStateReturn<T> {
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const initRef = useRef(false);
  
  // Initialize state with defaults (SSR-safe)
  const [state, setStateInternal] = useState<T>(defaults);

  // Load from storage on mount (client-side only)
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const stored = safeGetItem<T>(key);
    
    if (stored) {
      const { version: storedVersion, data, savedAt } = stored;
      
      // Check version compatibility
      if (storedVersion === version) {
        // Same version - validate and use
        if (validate(data)) {
          // Merge with defaults to handle new fields
          const merged = { ...defaults, ...data };
          setStateInternal(merged);
          setLastSavedAt(new Date(savedAt));
          if (import.meta.env.DEV) console.log(`[usePersistentCalculatorState] ${key} loaded`);
        } else {
          // Invalid data - reset to defaults
          if (import.meta.env.DEV) console.log(`[usePersistentCalculatorState] ${key} invalid, reset`);
          safeSaveItem(key, defaults, version);
        }
      } else if (migrate && storedVersion < version) {
        // Attempt migration
        const migrated = migrate(data, storedVersion);
        if (migrated && validate(migrated)) {
          setStateInternal(migrated);
          safeSaveItem(key, migrated, version);
          if (import.meta.env.DEV) console.log(`[usePersistentCalculatorState] ${key} migrated v${storedVersion}→v${version}`);
        } else {
          // Migration failed - use defaults
          if (import.meta.env.DEV) console.log(`[usePersistentCalculatorState] ${key} migration failed, reset`);
          safeSaveItem(key, defaults, version);
        }
      } else {
        // Version mismatch without migration - use defaults
        if (import.meta.env.DEV) console.log(`[usePersistentCalculatorState] ${key} version mismatch, reset`);
        safeSaveItem(key, defaults, version);
      }
    } else {
      if (import.meta.env.DEV) console.log(`[usePersistentCalculatorState] ${key} new`);
    }
    
    setIsLoaded(true);
  }, [key, version, defaults, validate, migrate]);

  // Update state and persist
  const setState = useCallback((updater: T | ((prev: T) => T)) => {
    setStateInternal((prev) => {
      const next = typeof updater === 'function' ? (updater as (prev: T) => T)(prev) : updater;
      safeSaveItem(key, next, version);
      setLastSavedAt(new Date());
      return next;
    });
  }, [key, version]);

  // Reset to defaults
  const resetState = useCallback(() => {
    setStateInternal(defaults);
    safeSaveItem(key, defaults, version);
    setLastSavedAt(null);
    if (import.meta.env.DEV) console.log(`[usePersistentCalculatorState] ${key} reset`);
  }, [key, version, defaults]);

  return {
    state,
    setState,
    resetState,
    lastSavedAt,
    isLoaded,
  };
}

/**
 * Helper to create a type-safe validator for a specific shape
 */
export function createValidator<T extends object>(
  requiredKeys: (keyof T)[]
): (data: unknown) => data is T {
  return (data: unknown): data is T => {
    if (!data || typeof data !== 'object') return false;
    for (const key of requiredKeys) {
      if (!(key in data)) return false;
    }
    return true;
  };
}
