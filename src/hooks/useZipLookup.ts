import { useState, useCallback, useRef } from "react";

type ZipData = Record<string, [string, string]>;

let zipDataCache: ZipData | null = null;
let loadingPromise: Promise<ZipData> | null = null;

async function loadZipData(): Promise<ZipData> {
  if (zipDataCache) return zipDataCache;
  
  if (loadingPromise) return loadingPromise;
  
  loadingPromise = fetch("/us-zip-city-state.min.json")
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load ZIP data");
      return res.json();
    })
    .then((data: ZipData) => {
      zipDataCache = data;
      return data;
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
}

export function useZipLookup(options: UseZipLookupOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const lastAutoFilledZip = useRef<string | null>(null);
  const userEditedFields = useRef<Set<"city" | "state">>(new Set());

  const markFieldAsUserEdited = useCallback((field: "city" | "state") => {
    userEditedFields.current.add(field);
  }, []);

  const lookupZip = useCallback(
    async (zipCode: string): Promise<{ city: string; state: string } | null> => {
      // Extract first 5 digits (supports ZIP+4)
      const zip5 = zipCode.replace(/\D/g, "").slice(0, 5);
      
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
          const [city, state] = result;
          lastAutoFilledZip.current = zip5;
          userEditedFields.current.clear(); // Reset user edits for new ZIP
          
          if (options.onAutoFill) {
            options.onAutoFill(city, state);
          }
          
          return { city, state };
        }
        
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [options]
  );

  const resetUserEdits = useCallback(() => {
    userEditedFields.current.clear();
    lastAutoFilledZip.current = null;
  }, []);

  return {
    lookupZip,
    isLoading,
    markFieldAsUserEdited,
    resetUserEdits,
  };
}
