import { useEffect, useRef, useState, useCallback } from "react";
import { adConfig, AdFormat, AdProvider } from "@/config/ads";
import { cn } from "@/lib/utils";

interface AdSlotProps {
  /** Ad provider type */
  provider?: AdProvider;
  /** Google AdSense client ID */
  clientId?: string;
  /** Google AdSense slot ID */
  slotId: string;
  /** Ad format */
  format?: AdFormat;
  /** Minimum height to prevent layout shift */
  minHeight?: number;
  /** Label text displayed above the ad */
  labelText?: string;
  /** Additional CSS classes */
  className?: string;
  /** ARIA label for accessibility */
  "aria-label"?: string;
  /** Intersection observer root margin for lazy loading */
  lazyLoadMargin?: string;
}

// Track if AdSense script has been loaded globally
let adSenseScriptLoaded = false;
let adSenseScriptLoading = false;
const scriptLoadPromise: Promise<void> | null = null;

// Track initialized slots to prevent duplicate initialization
const initializedSlots = new Set<string>();

// Track failed slots to prevent retry loops
const failedSlots = new Set<string>();

/**
 * Load AdSense script once globally with proper promise caching
 */
const loadAdSenseScript = (clientId: string): Promise<void> => {
  // Return cached promise if already loading
  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  if (adSenseScriptLoaded) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    // Check if script already exists in DOM
    const existingScript = document.querySelector(`script[src*="adsbygoogle.js"][src*="${clientId}"]`);

    if (existingScript) {
      adSenseScriptLoaded = true;
      resolve();
      return;
    }

    adSenseScriptLoading = true;

    const script = document.createElement("script");
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-ad-client", clientId);

    const cleanup = () => {
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
    };

    const onLoad = () => {
      adSenseScriptLoaded = true;
      adSenseScriptLoading = false;
      cleanup();
      resolve();
    };

    const onError = (error: ErrorEvent) => {
      adSenseScriptLoading = false;
      cleanup();
      console.error("Failed to load AdSense script:", error);
      reject(new Error("Failed to load AdSense script"));
    };

    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);

    document.head.appendChild(script);
  });
};

export function AdSlot({
  provider = adConfig.provider,
  clientId = adConfig.clientId,
  slotId,
  format = "auto",
  minHeight = 100,
  labelText = "Sponsored",
  className,
  "aria-label": ariaLabel = "Advertisement",
  lazyLoadMargin = "200px",
}: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const adRef = useRef<HTMLModElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Unique key for this ad instance
  const slotKey = `${slotId}-${format}`;

  // Validation
  useEffect(() => {
    if (!slotId) {
      console.error("AdSlot: slotId is required");
      setError("Configuration error");
    }
    if (provider === "adsense" && !clientId) {
      console.error("AdSlot: clientId is required for AdSense provider");
      setError("Configuration error");
    }
  }, [slotId, clientId, provider]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isVisible) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observerRef.current?.disconnect();
          observerRef.current = null;
        }
      },
      {
        rootMargin: lazyLoadMargin,
        threshold: 0,
      },
    );

    observerRef.current.observe(container);

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [isVisible, lazyLoadMargin]);

  // Initialize ad when visible
  const initializeAd = useCallback(async () => {
    // Guard clauses
    if (!isVisible || isInitialized || provider !== "adsense") return;
    if (initializedSlots.has(slotKey)) return;
    if (failedSlots.has(slotKey)) return;
    if (!clientId || !slotId) return;

    setIsLoading(true);

    try {
      await loadAdSenseScript(clientId);

      // Verify window.adsbygoogle is available
      if (!window.adsbygoogle) {
        throw new Error("AdSense global object not available");
      }

      // Ensure ad element exists
      if (!adRef.current) {
        throw new Error("Ad element ref not available");
      }

      // Mark as initialized before pushing to prevent race conditions
      initializedSlots.add(slotKey);

      // Push ad to AdSense queue
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setIsInitialized(true);
        setError(null);
      } catch (pushError) {
        console.error("AdSense push error:", pushError);
        throw pushError;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ad failed to load";
      setError(errorMessage);
      failedSlots.add(slotKey);
      initializedSlots.delete(slotKey); // Allow retry on remount
      console.error("AdSlot initialization error:", {
        slotKey,
        error: err,
        clientId,
        slotId,
      });
    } finally {
      setIsLoading(false);
    }
  }, [isVisible, isInitialized, provider, clientId, slotId, slotKey]);

  useEffect(() => {
    initializeAd();
  }, [initializeAd]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, []);

  // Don't render if ads are disabled
  if (!adConfig.enabled) {
    return null;
  }

  // Get responsive style based on format
  const getFormatStyles = (): React.CSSProperties => {
    switch (format) {
      case "rectangle":
        return { width: "300px", height: "250px" };
      case "horizontal":
        return { width: "100%", height: "90px" };
      case "vertical":
        return { width: "160px", height: "600px" };
      default:
        return { width: "100%", minHeight: `${minHeight}px` };
    }
  };

  const formatStyles = getFormatStyles();

  return (
    <div
      ref={containerRef}
      className={cn("relative flex flex-col items-center", "p-4", className)}
      role="complementary"
      aria-label={ariaLabel}
    >
      {/* Sponsored label */}
      <span
        className={cn("text-xs font-medium text-muted-foreground/70 uppercase tracking-wider mb-2", "select-none")}
        aria-hidden="true"
      >
        {labelText}
      </span>

      {/* Ad container with reserved space */}
      <div
        className={cn(
          "relative flex items-center justify-center",
          "bg-muted/30 rounded-lg border border-border/50",
          "overflow-hidden transition-all duration-200",
          isLoading && "animate-pulse",
        )}
        style={{
          ...formatStyles,
          minHeight: `${minHeight}px`,
        }}
      >
        {provider === "placeholder" || error ? (
          // Placeholder for development or error state
          <div
            className="flex flex-col items-center justify-center text-muted-foreground/50 p-4 text-center"
            role="status"
            aria-live="polite"
          >
            <div className="text-2xl mb-2" aria-hidden="true">
              {error ? "⚠️" : "📢"}
            </div>
            <span className="text-xs">{error || "Ad Placeholder"}</span>
            {!error && (
              <span className="text-xs mt-1 text-muted-foreground/30">
                {format} • {slotId.substring(0, 12)}...
              </span>
            )}
          </div>
        ) : isVisible ? (
          // Real AdSense ad
          <ins
            ref={adRef}
            className="adsbygoogle"
            style={{
              display: "block",
              ...formatStyles,
            }}
            data-ad-client={clientId}
            data-ad-slot={slotId}
            data-ad-format={format === "auto" ? "auto" : undefined}
            data-full-width-responsive={format === "auto" ? "true" : undefined}
            data-adtest={process.env.NODE_ENV === "development" ? "on" : undefined}
          />
        ) : (
          // Loading skeleton
          <div
            className="animate-pulse bg-muted/50 w-full h-full rounded"
            role="status"
            aria-label="Loading advertisement"
          />
        )}
      </div>
    </div>
  );
}

// TypeScript declaration for AdSense
declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}
