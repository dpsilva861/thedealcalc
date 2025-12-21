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
}

// Track if AdSense script has been loaded globally
let adSenseScriptLoaded = false;
let adSenseScriptLoading = false;

// Track initialized slots to prevent duplicate initialization
const initializedSlots = new Set<string>();

/**
 * Load AdSense script once globally
 */
const loadAdSenseScript = (clientId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (adSenseScriptLoaded) {
      resolve();
      return;
    }

    if (adSenseScriptLoading) {
      // Wait for existing load to complete
      const checkLoaded = setInterval(() => {
        if (adSenseScriptLoaded) {
          clearInterval(checkLoaded);
          resolve();
        }
      }, 100);
      return;
    }

    adSenseScriptLoading = true;

    const script = document.createElement("script");
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    script.async = true;
    script.crossOrigin = "anonymous";

    script.onload = () => {
      adSenseScriptLoaded = true;
      adSenseScriptLoading = false;
      resolve();
    };

    script.onerror = () => {
      adSenseScriptLoading = false;
      reject(new Error("Failed to load AdSense script"));
    };

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
}: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const adRef = useRef<HTMLModElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Unique key for this ad instance
  const slotKey = `${slotId}-${format}`;

  // Intersection Observer for lazy loading
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "200px", // Start loading 200px before visible
        threshold: 0,
      }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  // Initialize ad when visible
  const initializeAd = useCallback(async () => {
    if (!isVisible || isInitialized || provider !== "adsense") return;
    if (initializedSlots.has(slotKey)) return;

    try {
      await loadAdSenseScript(clientId);
      
      // Push ad to AdSense
      if (window.adsbygoogle && adRef.current) {
        initializedSlots.add(slotKey);
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setIsInitialized(true);
      }
    } catch (err) {
      setError("Ad failed to load");
      console.error("AdSlot initialization error:", err);
    }
  }, [isVisible, isInitialized, provider, clientId, slotKey]);

  useEffect(() => {
    initializeAd();
  }, [initializeAd]);

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

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex flex-col items-center",
        "p-4", // Padding to prevent accidental clicks
        className
      )}
      role="complementary"
      aria-label="Advertisement"
    >
      {/* Sponsored label - clearly distinguishes from content */}
      <span
        className={cn(
          "text-xs font-medium text-muted-foreground/70 uppercase tracking-wider mb-2",
          "select-none"
        )}
        aria-hidden="true"
      >
        {labelText}
      </span>

      {/* Ad container with reserved space */}
      <div
        className={cn(
          "relative flex items-center justify-center",
          "bg-muted/30 rounded-lg border border-border/50",
          "overflow-hidden"
        )}
        style={{
          ...getFormatStyles(),
          minHeight: `${minHeight}px`,
        }}
      >
        {provider === "placeholder" || error ? (
          // Placeholder for development or error state
          <div className="flex flex-col items-center justify-center text-muted-foreground/50 p-4 text-center">
            <div className="text-2xl mb-2">📢</div>
            <span className="text-xs">
              {error || "Ad Placeholder"}
            </span>
            {!error && (
              <span className="text-xs mt-1 text-muted-foreground/30">
                {format} • {slotId}
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
              ...getFormatStyles(),
            }}
            data-ad-client={clientId}
            data-ad-slot={slotId}
            data-ad-format={format === "auto" ? "auto" : undefined}
            data-full-width-responsive={format === "auto" ? "true" : undefined}
          />
        ) : (
          // Loading skeleton
          <div className="animate-pulse bg-muted/50 w-full h-full rounded" />
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
