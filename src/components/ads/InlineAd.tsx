import { AdSlot } from "./AdSlot";
import { adConfig } from "@/config/ads";
import { cn } from "@/lib/utils";

export interface InlineAdProps {
  /** Slot ID to use */
  slotId?: string;
  /** Additional CSS classes */
  className?: string;
  /** Format - defaults to horizontal on desktop, auto on mobile */
  format?: "auto" | "horizontal";
  /** Minimum height for the ad slot */
  minHeight?: number;
  /** Custom label text */
  labelText?: string;
  /** Max width constraint (Tailwind class or CSS value) */
  maxWidth?: string;
  /** Whether to show border dividers */
  showBorder?: boolean;
  /** Whether to show background */
  showBackground?: boolean;
  /** Custom container padding */
  containerPadding?: string;
}

/**
 * Inline ad component for placing between content sections
 * Responsive: shows appropriate format for screen size
 * Typically used between article sections, calculator results, or list items
 */
export function InlineAd({
  slotId = adConfig.slots?.homeBetweenSections,
  className,
  format = "horizontal",
  minHeight = 90,
  labelText = "Sponsored",
  maxWidth = "max-w-4xl",
  showBorder = true,
  showBackground = true,
  containerPadding = "py-8",
}: InlineAdProps) {
  // Don't render if ads are disabled
  if (!adConfig.enabled) {
    return null;
  }

  // Validate slot configuration
  if (!slotId) {
    console.warn("InlineAd: No slot ID configured for homeBetweenSections");
    return null;
  }

  return (
    <div
      className={cn(
        "w-full",
        containerPadding,
        showBorder && "border-y border-border/50",
        showBackground && "bg-muted/20",
        className,
      )}
      role="complementary"
      aria-label="Inline advertisement"
    >
      <div className="container mx-auto px-4">
        <AdSlot
          slotId={slotId}
          format={format}
          minHeight={minHeight}
          labelText={labelText}
          className={cn(maxWidth, "mx-auto")}
          aria-label="Inline advertisement content"
        />
      </div>
    </div>
  );
}
