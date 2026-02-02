/**
 * Header Leaderboard Ad Component
 * 
 * Desktop-only 728x90 leaderboard ad that displays above main content.
 * Reserved height prevents CLS (Cumulative Layout Shift).
 * Only renders when consent is granted and ads are enabled.
 */

import { AdSlot } from "./AdSlot";
import { adConfig } from "@/config/ads";
import { useAdSense } from "./AdSenseLoader";
import { cn } from "@/lib/utils";

export interface HeaderLeaderboardProps {
  /** Additional CSS classes */
  className?: string;
  /** Slot ID override */
  slotId?: string;
}

// Fixed dimensions for leaderboard ad
const LEADERBOARD_WIDTH = 728;
const LEADERBOARD_HEIGHT = 90;

export function HeaderLeaderboard({
  className,
  slotId = adConfig.slots?.homeBetweenSections,
}: HeaderLeaderboardProps) {
  const { hasConsent, isCheckingConsent, adsEnabled } = useAdSense();

  // Don't render if ads disabled
  if (!adsEnabled) {
    return null;
  }

  // Show placeholder while checking consent or if no consent
  const showPlaceholder = isCheckingConsent || !hasConsent;

  return (
    <div
      className={cn(
        // Desktop only - hidden on mobile/tablet
        "hidden lg:flex",
        "w-full justify-center",
        "py-4",
        className,
      )}
      role="complementary"
      aria-label="Header advertisement"
    >
      <div
        className={cn(
          "flex items-center justify-center",
          "rounded-lg border border-border/30",
          "bg-muted/20",
          "overflow-hidden",
        )}
        style={{
          width: `${LEADERBOARD_WIDTH}px`,
          minHeight: `${LEADERBOARD_HEIGHT}px`,
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
            format="horizontal"
            minHeight={LEADERBOARD_HEIGHT}
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
  );
}
