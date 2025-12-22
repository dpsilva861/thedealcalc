import { AdSlot } from "./AdSlot";
import { adConfig } from "@/config/ads";
import { cn } from "@/lib/utils";

export interface MobileAdProps {
  /** Slot ID to use */
  slotId?: string;
  /** Additional CSS classes */
  className?: string;
  /** Minimum height for the ad slot */
  minHeight?: number;
  /** Custom label text */
  labelText?: string;
  /** Whether to show border dividers */
  showBorder?: boolean;
  /** Whether to show background */
  showBackground?: boolean;
  /** Breakpoint at which to hide (default: lg) */
  hideAt?: "md" | "lg" | "xl";
  /** Custom container padding */
  containerPadding?: string;
}

/**
 * Mobile-only ad component for placing between content sections
 * Hidden on large screens where AdRail is used instead
 * Automatically uses responsive ad format optimized for mobile devices
 */
export function MobileAd({
  slotId = adConfig.slots?.mobileInContent,
  className,
  minHeight = 100,
  labelText = "Sponsored",
  showBorder = true,
  showBackground = true,
  hideAt = "lg",
  containerPadding = "py-6",
}: MobileAdProps) {
  // Don't render if ads are disabled
  if (!adConfig.enabled) {
    return null;
  }

  // Validate slot configuration
  if (!slotId) {
    console.warn("MobileAd: No slot ID configured for mobileInContent");
    return null;
  }

  // Map breakpoint to Tailwind class
  const hideClass = {
    md: "md:hidden",
    lg: "lg:hidden",
    xl: "xl:hidden",
  }[hideAt];

  return (
    <div
      className={cn(
        // Only visible on mobile/tablet
        hideClass,
        "w-full",
        containerPadding,
        showBorder && "border-y border-border/50",
        showBackground && "bg-muted/20",
        className,
      )}
      role="complementary"
      aria-label="Mobile advertisement"
    >
      <div className="container mx-auto px-4">
        <AdSlot
          slotId={slotId}
          format="auto"
          minHeight={minHeight}
          labelText={labelText}
          aria-label="Mobile advertisement content"
        />
      </div>
    </div>
  );
}
