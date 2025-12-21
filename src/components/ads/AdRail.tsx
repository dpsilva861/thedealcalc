import { AdSlot } from "./AdSlot";
import { adConfig } from "@/config/ads";
import { cn } from "@/lib/utils";

interface AdRailProps {
  /** Additional CSS classes */
  className?: string;
  /** Show secondary ad slot */
  showSecondary?: boolean;
}

/**
 * Right-side ad rail for desktop layouts
 * Sticky within viewport after scrolling past header
 * Hidden on mobile - use inline AdSlot instead
 */
export function AdRail({ className, showSecondary = true }: AdRailProps) {
  // Don't render if ads are disabled
  if (!adConfig.enabled) {
    return null;
  }

  return (
    <aside
      className={cn(
        // Hidden on mobile/tablet, visible on large screens
        "hidden lg:block",
        // Fixed width for rail
        "w-[336px] flex-shrink-0",
        className
      )}
      role="complementary"
      aria-label="Sponsored content"
    >
      <div
        className={cn(
          // Sticky positioning
          "sticky top-24", // Account for header height
          "space-y-6",
          // Prevent covering content
          "max-h-[calc(100vh-8rem)]",
          "overflow-hidden"
        )}
      >
        {/* Primary ad slot */}
        <AdSlot
          slotId={adConfig.slots.rightRail}
          format="rectangle"
          minHeight={250}
          className="bg-card rounded-xl border border-border shadow-card"
        />

        {/* Secondary ad slot with spacing */}
        {showSecondary && (
          <AdSlot
            slotId={adConfig.slots.rightRailSecondary}
            format="rectangle"
            minHeight={250}
            className="bg-card rounded-xl border border-border shadow-card"
          />
        )}
      </div>
    </aside>
  );
}
