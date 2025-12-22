import { AdSlot } from "./AdSlot";
import { adConfig } from "@/config/ads";
import { cn } from "@/lib/utils";

interface AdRailProps {
  /** Additional CSS classes */
  className?: string;
  /** Show secondary ad slot */
  showSecondary?: boolean;
  /** Custom top offset for sticky positioning (default: 96px for header) */
  topOffset?: number;
  /** Maximum slots to show (1-2) */
  maxSlots?: 1 | 2;
}

/**
 * Right-side ad rail for desktop layouts
 * Sticky within viewport after scrolling past header
 * Hidden on mobile - use inline AdSlot instead
 */
export function AdRail({
  className,
  showSecondary = true,
  topOffset = 96, // 24 * 4 = 96px (top-24 in Tailwind)
  maxSlots = 2,
}: AdRailProps) {
  // Don't render if ads are disabled
  if (!adConfig.enabled) {
    return null;
  }

  // Validate slot configuration
  if (!adConfig.slots?.rightRail) {
    console.warn("AdRail: Primary slot ID (rightRail) not configured");
    return null;
  }

  if (showSecondary && maxSlots > 1 && !adConfig.slots?.rightRailSecondary) {
    console.warn("AdRail: Secondary slot ID (rightRailSecondary) not configured");
  }

  const shouldShowSecondary = showSecondary && maxSlots > 1 && adConfig.slots?.rightRailSecondary;

  return (
    <aside
      className={cn(
        // Hidden on mobile/tablet, visible on large screens
        "hidden lg:block",
        // Fixed width for rail
        "w-[336px] flex-shrink-0",
        className,
      )}
      role="complementary"
      aria-label="Sponsored content"
    >
      <div
        className="space-y-6"
        style={{
          position: "sticky",
          top: `${topOffset}px`,
          maxHeight: `calc(100vh - ${topOffset + 32}px)`, // 32px for bottom padding
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {/* Primary ad slot */}
        <AdSlot
          slotId={adConfig.slots.rightRail}
          format="rectangle"
          minHeight={250}
          className="bg-card rounded-xl border border-border shadow-card"
          aria-label="Primary advertisement"
        />

        {/* Secondary ad slot with spacing */}
        {shouldShowSecondary && (
          <AdSlot
            slotId={adConfig.slots.rightRailSecondary}
            format="rectangle"
            minHeight={250}
            className="bg-card rounded-xl border border-border shadow-card"
            aria-label="Secondary advertisement"
          />
        )}
      </div>
    </aside>
  );
}
