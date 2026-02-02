/**
 * Sidebar Skyscraper Ad Component
 * 
 * Desktop-only 300x600 skyscraper ad for results/content pages.
 * Sticky positioning with reserved height for CLS prevention.
 * Only renders when consent is granted and ads are enabled.
 */

import { AdSlot } from "./AdSlot";
import { adConfig } from "@/config/ads";
import { useAdSense } from "./AdSenseLoader";
import { cn } from "@/lib/utils";

export interface SidebarSkyscraperProps {
  /** Additional CSS classes */
  className?: string;
  /** Slot ID override */
  slotId?: string;
  /** Top offset for sticky positioning (default: 96px for header) */
  topOffset?: number;
}

// Fixed dimensions for skyscraper ad
const SKYSCRAPER_WIDTH = 300;
const SKYSCRAPER_HEIGHT = 600;

export function SidebarSkyscraper({
  className,
  slotId = adConfig.slots?.rightRail,
  topOffset = 96,
}: SidebarSkyscraperProps) {
  const { hasConsent, isCheckingConsent, adsEnabled } = useAdSense();

  // Don't render if ads disabled
  if (!adsEnabled) {
    return null;
  }

  // Show placeholder while checking consent or if no consent
  const showPlaceholder = isCheckingConsent || !hasConsent;

  return (
    <aside
      className={cn(
        // Desktop only - hidden on mobile/tablet
        "hidden lg:block",
        "flex-shrink-0",
        className,
      )}
      style={{
        width: `${SKYSCRAPER_WIDTH}px`,
      }}
      role="complementary"
      aria-label="Sidebar advertisement"
    >
      <div
        className="sticky"
        style={{
          top: `${topOffset}px`,
          maxHeight: `calc(100vh - ${topOffset + 32}px)`,
        }}
      >
        <div
          className={cn(
            "flex items-center justify-center",
            "rounded-lg border border-border/30",
            "bg-muted/20",
            "overflow-hidden",
          )}
          style={{
            width: `${SKYSCRAPER_WIDTH}px`,
            minHeight: `${SKYSCRAPER_HEIGHT}px`,
          }}
        >
          {showPlaceholder ? (
            // Placeholder with reserved space
            <div className="flex flex-col items-center justify-center text-muted-foreground/40 p-4 text-center w-full h-full">
              <span className="text-xs uppercase tracking-wider font-medium">
                Advertisement
              </span>
            </div>
          ) : slotId ? (
            // Real ad
            <AdSlot
              slotId={slotId}
              format="vertical"
              minHeight={SKYSCRAPER_HEIGHT}
              labelText=""
              className="p-0"
            />
          ) : (
            // Config missing placeholder
            <div className="flex flex-col items-center justify-center text-muted-foreground/40 p-4 text-center w-full h-full">
              <span className="text-xs uppercase tracking-wider font-medium">
                Advertisement
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
