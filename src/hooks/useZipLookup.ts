import { useState, useCallback, useRef, useEffect } from "react";

type ZipData = Record<string, { city: string; state: string }>;

let zipDataCache: ZipData | null = null;
let loadingPromise: Promise<ZipData> | null = null;

async function loadZipData(): Promise<ZipData> {
  if (zipDataCache) return zipDataCache;
  
  if (loadingPromise) return loadingPromise;
  
  // Dynamically import the npm package (lazy-loaded, ~1.3MB)
  // Note: The package has city/state swapped, so we fix it here
  loadingPromise = import("zip-code-to-usa-city-state")
    .then((module) => {
      const rawData = module.default as Record<string, { city: string; state: string }>;
      // The npm package has city and state swapped in the data
      // city field contains state code, state field contains city name
      // We need to fix this when reading
      const fixedData: ZipData = {};
      for (const [zip, value] of Object.entries(rawData)) {
        fixedData[zip] = {
          city: value.state, // state field actually contains city
          state: value.city, // city field actually contains state code
        };
      }
      zipDataCache = fixedData;
      return fixedData;
    })
    .catch((err) => {
      console.error("ZIP lookup failed:", err);
      loadingPromise = null;
      return {};
    });
  
  return loadingPromise;
}

interface UseZipLookupOptions {
  onAutoFill?: (city: string, state: string) => void;
  onNotFound?: () => void;
}

interface ZipLookupResult {
  lookupZip: (zipCode: string) => Promise<{ city: string; state: string } | null>;
  isLoading: boolean;
  notFound: boolean;
  markFieldAsUserEdited: (field: "city" | "state") => void;
  resetUserEdits: () => void;
  clearNotFound: () => void;
}

export function useZipLookup(options: UseZipLookupOptions = {}): ZipLookupResult {
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const lastAutoFilledZip = useRef<string | null>(null);
  const userEditedFields = useRef<Set<"city" | "state">>(new Set());
  const optionsRef = useRef(options);
  
  // Keep options ref updated
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const markFieldAsUserEdited = useCallback((field: "city" | "state") => {
    userEditedFields.current.add(field);
    // Clear not found when user manually edits
    setNotFound(false);
  }, []);

  const clearNotFound = useCallback(() => {
    setNotFound(false);
  }, []);

  const lookupZip = useCallback(
    async (zipCode: string): Promise<{ city: string; state: string } | null> => {
      // Extract first 5 digits (supports ZIP+4)
      const zip5 = zipCode.replace(/\D/g, "").slice(0, 5);
      
      // Clear not found state on any ZIP change
      setNotFound(false);
      
      // Only lookup if we have exactly 5 digits
      if (zip5.length !== 5) {
        return null;
      }

      // If this ZIP was already auto-filled and user edited fields, don't overwrite
      if (
        lastAutoFilledZip.current === zip5 &&
        userEditedFields.current.size > 0
      ) {
        return null;
      }

      setIsLoading(true);
      
      try {
        const data = await loadZipData();
        const result = data[zip5];
        
        if (result) {
          const { city, state } = result;
          lastAutoFilledZip.current = zip5;
          userEditedFields.current.clear(); // Reset user edits for new ZIP
          
          if (optionsRef.current.onAutoFill) {
            optionsRef.current.onAutoFill(city, state);
          }
          
          return { city, state };
        }
        
        // ZIP not found in dataset
        setNotFound(true);
        if (optionsRef.current.onNotFound) {
          optionsRef.current.onNotFound();
        }
        
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const resetUserEdits = useCallback(() => {
    userEditedFields.current.clear();
    lastAutoFilledZip.current = null;
    setNotFound(false);
  }, []);

  return {
    lookupZip,
    isLoading,
    notFound,
    markFieldAsUserEdited,
    resetUserEdits,
    clearNotFound,
  };
}
