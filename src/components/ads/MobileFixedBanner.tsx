/**
 * Mobile Fixed Banner Ad Component
 * 
 * Mobile-only 320x50 banner fixed at the bottom of the screen.
 * Reserved height prevents CLS (Cumulative Layout Shift).
 * Only renders when consent is granted and ads are enabled.
 */

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { AdSlot } from "./AdSlot";
import { adConfig } from "@/config/ads";
import { useAdSense } from "./AdSenseLoader";
import { cn } from "@/lib/utils";

export interface MobileFixedBannerProps {
  /** Additional CSS classes */
  className?: string;
  /** Slot ID override */
  slotId?: string;
  /** Whether the banner can be dismissed */
  dismissible?: boolean;
  /** Session storage key for dismissed state */
  dismissKey?: string;
}

// Fixed dimensions for mobile banner
const BANNER_WIDTH = 320;
const BANNER_HEIGHT = 50;

export function MobileFixedBanner({
  className,
  slotId = adConfig.slots?.mobileInContent,
  dismissible = true,
  dismissKey = "tdc_mobile_ad_dismissed",
}: MobileFixedBannerProps) {
  const { hasConsent, isCheckingConsent, adsEnabled } = useAdSense();
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if previously dismissed this session
  useEffect(() => {
    if (dismissible) {
      const dismissed = sessionStorage.getItem(dismissKey);
      if (dismissed === "true") {
        setIsDismissed(true);
      }
    }
  }, [dismissible, dismissKey]);

  // Don't render if ads disabled or dismissed
  if (!adsEnabled || isDismissed) {
    return null;
  }

  // Show placeholder while checking consent or if no consent
  const showPlaceholder = isCheckingConsent || !hasConsent;

  const handleDismiss = () => {
    setIsDismissed(true);
    if (dismissible) {
      sessionStorage.setItem(dismissKey, "true");
    }
  };

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed banner */}
      <div
        className="lg:hidden"
        style={{ height: `${BANNER_HEIGHT + 16}px` }}
        aria-hidden="true"
      />

      {/* Fixed banner */}
      <div
        className={cn(
          // Mobile only - hidden on desktop
          "fixed bottom-0 left-0 right-0 lg:hidden",
          "z-40",
          "flex justify-center",
          "py-2 px-4",
          "bg-background/95 backdrop-blur-sm",
          "border-t border-border/50",
          "safe-area-bottom",
          className,
        )}
        role="complementary"
        aria-label="Mobile banner advertisement"
      >
        <div className="relative flex items-center justify-center">
          <div
            className={cn(
              "flex items-center justify-center",
              "rounded border border-border/30",
              "bg-muted/20",
              "overflow-hidden",
            )}
            style={{
              width: `${BANNER_WIDTH}px`,
              minHeight: `${BANNER_HEIGHT}px`,
            }}
          >
            {showPlaceholder ? (
              // Placeholder with reserved space
              <div className="flex items-center justify-center text-muted-foreground/40 text-center w-full h-full">
                <span className="text-xs uppercase tracking-wider font-medium">
                  Advertisement
                </span>
              </div>
            ) : slotId ? (
              // Real ad
              <AdSlot
                slotId={slotId}
                format="horizontal"
                minHeight={BANNER_HEIGHT}
                labelText=""
                className="p-0"
              />
            ) : (
              // Config missing placeholder
              <div className="flex items-center justify-center text-muted-foreground/40 text-center w-full h-full">
                <span className="text-xs uppercase tracking-wider font-medium">
                  Advertisement
                </span>
              </div>
            )}
          </div>

          {/* Dismiss button */}
          {dismissible && !showPlaceholder && (
            <button
              onClick={handleDismiss}
              className={cn(
                "absolute -top-2 -right-2",
                "w-6 h-6 rounded-full",
                "flex items-center justify-center",
                "bg-background border border-border",
                "text-muted-foreground hover:text-foreground",
                "transition-colors",
                "shadow-sm",
              )}
              aria-label="Dismiss advertisement"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
