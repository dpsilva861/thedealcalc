import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { adConfig, AdFormat, AdProvider } from "@/config/ads";
import { isAdAllowedRoute } from "@/config/adRoutes";
import { useAdSense } from "@/components/ads/AdSenseLoader";
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

// Track initialized slots to prevent duplicate initialization
const initializedSlots = new Set<string>();

// Track failed slots to prevent retry loops
const failedSlots = new Set<string>();

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
  const location = useLocation();
  const { hasConsent, isLoaded: adSenseLoaded, isCheckingConsent } = useAdSense();
  
  // Check if ads are allowed on this route (AdSense compliance)
  const isContentPage = isAdAllowedRoute(location.pathname);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const adRef = useRef<HTMLModElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Unique key for this ad instance
  const slotKey = `${slotId}-${format}`;

  // Validation - dev-only warnings
  useEffect(() => {
    if (import.meta.env.DEV) {
      if (!slotId) {
        console.warn("[AdSlot] slotId is missing or empty. Check adConfig.slots or env vars.");
      }
      if (provider === "adsense" && !clientId) {
        console.warn("[AdSlot] clientId is missing for AdSense provider. Check VITE_ADSENSE_CLIENT_ID.");
      }
      if (provider === "adsense" && typeof window !== "undefined" && !window.adsbygoogle && isVisible) {
        console.warn("[AdSlot] window.adsbygoogle not found. AdSense script may not be loaded.");
      }
    }
    
    // Production error handling
    if (!slotId) {
      setError("Configuration error");
    }
    if (provider === "adsense" && !clientId) {
      setError("Configuration error");
    }
  }, [slotId, clientId, provider, isVisible]);

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

  // Initialize ad when visible and consent granted
  const initializeAd = useCallback(() => {
    // Guard clauses
    if (!isVisible || isInitialized || provider !== "adsense") return;
    if (!adSenseLoaded || !hasConsent) return; // Wait for consent and script
    if (initializedSlots.has(slotKey)) return;
    if (failedSlots.has(slotKey)) return;
    if (!clientId || !slotId) return;

    setIsLoading(true);

    try {
      // Verify window.adsbygoogle is available (script loaded from index.html)
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
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      setIsInitialized(true);
      setError(null);
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
  }, [isVisible, isInitialized, provider, clientId, slotId, slotKey, adSenseLoaded, hasConsent]);

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

  // Don't render if ads are disabled, route is blocked, or no consent
  if (!adConfig.enabled || !isContentPage) {
    if (import.meta.env.DEV && !isContentPage) {
      console.info(`[AdSlot] Ads blocked on route: ${location.pathname} (not a content page)`);
    }
    return null;
  }

  // Show loading state while checking consent
  if (isCheckingConsent) {
    return (
      <div
        className={cn("relative flex flex-col items-center p-4", className)}
        style={{ minHeight: `${minHeight}px` }}
      >
        <div className="animate-pulse bg-muted/30 w-full h-full rounded-lg" />
      </div>
    );
  }

  // Don't render if consent was denied (CMP present but no consent)
  if (!hasConsent && !adSenseLoaded) {
    if (import.meta.env.DEV) {
      console.info(`[AdSlot] Ads blocked: consent not granted`);
    }
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
            data-adtest={import.meta.env.DEV ? "on" : undefined}
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
