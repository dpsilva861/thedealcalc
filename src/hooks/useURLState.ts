/**
 * URL State Encoding Hook
 * 
 * Encodes calculator inputs into URL query params for shareable links
 * and decodes on page load.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

interface UseURLStateOptions<T> {
  /** Fields to encode in URL */
  fields: (keyof T)[];
  /** Current state */
  state: T;
  /** Function to update state */
  onLoadFromURL: (updates: Partial<T>) => void;
  /** Prefix for URL params (e.g., 'npv_') */
  prefix?: string;
  /** Type converters for specific fields */
  converters?: {
    [K in keyof T]?: {
      encode: (value: T[K]) => string;
      decode: (value: string) => T[K];
    };
  };
}

/**
 * Default converters for common types
 */
const defaultConverters = {
  number: {
    encode: (v: number) => String(v),
    decode: (v: string) => parseFloat(v),
  },
  boolean: {
    encode: (v: boolean) => (v ? '1' : '0'),
    decode: (v: string) => v === '1' || v === 'true',
  },
  array: {
    encode: (v: number[]) => v.join(','),
    decode: (v: string) => v.split(',').map(Number).filter(n => !isNaN(n)),
  },
};

/**
 * Hook for syncing state with URL query parameters
 */
export function useURLState<T extends Record<string, unknown>>({
  fields,
  state,
  onLoadFromURL,
  prefix = '',
  converters = {},
}: UseURLStateOptions<T>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const loadedRef = useRef(false);

  // Load from URL on mount (once)
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const updates: Partial<T> = {};
    let hasUpdates = false;

    for (const field of fields) {
      const paramKey = prefix + String(field);
      const paramValue = searchParams.get(paramKey);

      if (paramValue !== null) {
        try {
          const converter = converters[field];
          if (converter) {
            updates[field] = converter.decode(paramValue);
          } else {
            // Auto-detect type from current state
            const currentValue = state[field];
            if (typeof currentValue === 'number') {
              updates[field] = defaultConverters.number.decode(paramValue) as T[typeof field];
            } else if (typeof currentValue === 'boolean') {
              updates[field] = defaultConverters.boolean.decode(paramValue) as T[typeof field];
            } else if (Array.isArray(currentValue)) {
              updates[field] = defaultConverters.array.decode(paramValue) as T[typeof field];
            } else {
              updates[field] = paramValue as T[typeof field];
            }
          }
          hasUpdates = true;
        } catch (err) {
          console.warn(`[useURLState] Failed to decode ${paramKey}:`, err);
        }
      }
    }

    if (hasUpdates) {
      onLoadFromURL(updates);
    }
  }, []); // Only on mount

  // Generate shareable URL
  const generateShareableURL = useCallback(() => {
    const url = new URL(window.location.href);
    
    // Clear existing params for our fields
    for (const field of fields) {
      url.searchParams.delete(prefix + String(field));
    }

    // Add current state
    for (const field of fields) {
      const value = state[field];
      const paramKey = prefix + String(field);

      if (value !== null && value !== undefined) {
        const converter = converters[field];
        let encoded: string;

        if (converter) {
          encoded = converter.encode(value);
        } else if (typeof value === 'number') {
          encoded = defaultConverters.number.encode(value);
        } else if (typeof value === 'boolean') {
          encoded = defaultConverters.boolean.encode(value);
        } else if (Array.isArray(value)) {
          encoded = defaultConverters.array.encode(value as number[]);
        } else {
          encoded = String(value);
        }

        url.searchParams.set(paramKey, encoded);
      }
    }

    return url.toString();
  }, [fields, state, prefix, converters]);

  // Update URL without navigation
  const updateURL = useCallback(() => {
    const newParams = new URLSearchParams(searchParams);

    for (const field of fields) {
      const value = state[field];
      const paramKey = prefix + String(field);

      if (value !== null && value !== undefined) {
        const converter = converters[field];
        let encoded: string;

        if (converter) {
          encoded = converter.encode(value);
        } else if (typeof value === 'number') {
          encoded = defaultConverters.number.encode(value);
        } else if (typeof value === 'boolean') {
          encoded = defaultConverters.boolean.encode(value);
        } else if (Array.isArray(value)) {
          encoded = defaultConverters.array.encode(value as number[]);
        } else {
          encoded = String(value);
        }

        newParams.set(paramKey, encoded);
      } else {
        newParams.delete(paramKey);
      }
    }

    setSearchParams(newParams, { replace: true });
  }, [fields, state, prefix, converters, searchParams, setSearchParams]);

  // Clear URL params
  const clearURLParams = useCallback(() => {
    const newParams = new URLSearchParams(searchParams);
    for (const field of fields) {
      newParams.delete(prefix + String(field));
    }
    setSearchParams(newParams, { replace: true });
  }, [fields, prefix, searchParams, setSearchParams]);

  // Copy shareable link to clipboard
  const copyShareableLink = useCallback(async () => {
    const url = generateShareableURL();
    try {
      await navigator.clipboard.writeText(url);
      return { success: true, url };
    } catch (err) {
      console.error('[useURLState] Failed to copy:', err);
      return { success: false, url };
    }
  }, [generateShareableURL]);

  return {
    generateShareableURL,
    updateURL,
    clearURLParams,
    copyShareableLink,
  };
}

/**
 * Minimal URL state - just generate/copy link without sync
 */
export function useShareableLink<T extends Record<string, unknown>>(
  state: T,
  fields: (keyof T)[]
) {
  const generateLink = useCallback(() => {
    const url = new URL(window.location.origin + window.location.pathname);
    
    for (const field of fields) {
      const value = state[field];
      if (value !== null && value !== undefined) {
        let encoded: string;
        if (typeof value === 'number') {
          encoded = String(value);
        } else if (typeof value === 'boolean') {
          encoded = value ? '1' : '0';
        } else if (Array.isArray(value)) {
          encoded = (value as number[]).join(',');
        } else {
          encoded = String(value);
        }
        url.searchParams.set(String(field), encoded);
      }
    }

    return url.toString();
  }, [state, fields]);

  const copyLink = useCallback(async () => {
    const url = generateLink();
    try {
      await navigator.clipboard.writeText(url);
      return { success: true, url };
    } catch {
      return { success: false, url };
    }
  }, [generateLink]);

  return { generateLink, copyLink };
}
