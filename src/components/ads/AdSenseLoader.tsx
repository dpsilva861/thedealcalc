/**
 * AdSense Loader Component
 * 
 * Manages consent-gated loading of the AdSense script.
 * Only loads AdSense after marketing consent is obtained from the CMP.
 * 
 * This component should be rendered once at the app root level,
 * inside the ConsentProvider.
 */

import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { useConsent } from "@/components/cmp";
import { adConfig } from "@/config/ads";

interface AdSenseContextValue {
  /** Whether AdSense script has been loaded */
  isLoaded: boolean;
  /** Whether marketing consent has been granted */
  hasConsent: boolean;
  /** Whether consent check is in progress */
  isCheckingConsent: boolean;
  /** Whether ads are enabled in config */
  adsEnabled: boolean;
}

const AdSenseContext = createContext<AdSenseContextValue>({
  isLoaded: false,
  hasConsent: false,
  isCheckingConsent: true,
  adsEnabled: false,
});

export function useAdSense(): AdSenseContextValue {
  return useContext(AdSenseContext);
}

interface AdSenseLoaderProps {
  children: ReactNode;
}

const ADSENSE_SCRIPT_ID = "google-adsense-script";
const ADSENSE_SCRIPT_URL = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adConfig.clientId}`;

export function AdSenseLoader({ children }: AdSenseLoaderProps) {
  const { hasMarketing, isLoading: isCheckingConsent } = useConsent();
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Don't load if:
    // - Ads disabled in config
    // - Still checking consent
    // - No marketing consent granted
    // - Already loaded
    if (!adConfig.enabled || isCheckingConsent || isLoaded) {
      return;
    }

    // If no marketing consent, don't load AdSense
    if (!hasMarketing) {
      if (import.meta.env.DEV) {
        console.log("[AdSenseLoader] Marketing consent not granted, skipping AdSense load");
      }
      return;
    }

    // Check if script already exists
    const existingScript = document.getElementById(ADSENSE_SCRIPT_ID);
    if (existingScript) {
      setIsLoaded(true);
      return;
    }

    // Also check if adsbygoogle is already defined
    if (typeof window !== "undefined" && window.adsbygoogle) {
      setIsLoaded(true);
      return;
    }

    // Dynamically inject AdSense script
    const script = document.createElement("script");
    script.id = ADSENSE_SCRIPT_ID;
    script.src = ADSENSE_SCRIPT_URL;
    script.async = true;
    script.crossOrigin = "anonymous";

    script.onload = () => {
      setIsLoaded(true);
      setLoadError(null);
      if (import.meta.env.DEV) {
        console.log("[AdSenseLoader] AdSense script loaded successfully after consent");
      }
    };

    script.onerror = () => {
      setLoadError("Failed to load AdSense script");
      console.error("[AdSenseLoader] Failed to load AdSense script");
    };

    document.head.appendChild(script);

    if (import.meta.env.DEV) {
      console.log("[AdSenseLoader] Injecting AdSense script after marketing consent");
    }

    return () => {
      // Don't remove on unmount - AdSense doesn't like being removed
    };
  }, [hasMarketing, isCheckingConsent, isLoaded]);

  const contextValue: AdSenseContextValue = {
    isLoaded,
    hasConsent: hasMarketing,
    isCheckingConsent,
    adsEnabled: adConfig.enabled,
  };

  // Log state changes in dev
  useEffect(() => {
    if (import.meta.env.DEV && !isCheckingConsent) {
      console.log("[AdSenseLoader] State:", {
        hasMarketing,
        isLoaded,
        adsEnabled: adConfig.enabled,
        loadError,
      });
    }
  }, [hasMarketing, isLoaded, isCheckingConsent, loadError]);

  return (
    <AdSenseContext.Provider value={contextValue}>
      {children}
    </AdSenseContext.Provider>
  );
}

/**
 * Hook to check if AdSense is ready to serve ads
 */
export function useAdSenseReady(): boolean {
  const { isLoaded, hasConsent, adsEnabled } = useAdSense();
  return adsEnabled && hasConsent && isLoaded;
}
