import { AdSlot } from "./AdSlot";
import { adConfig } from "@/config/ads";
import { cn } from "@/lib/utils";

interface InlineAdProps {
  /** Slot ID to use */
  slotId?: string;
  /** Additional CSS classes */
  className?: string;
  /** Format - defaults to horizontal on desktop, auto on mobile */
  format?: "auto" | "horizontal";
}

/**
 * Inline ad component for placing between content sections
 * Responsive: shows appropriate format for screen size
 */
export function InlineAd({ 
  slotId = adConfig.slots.homeBetweenSections,
  className,
  format = "horizontal",
}: InlineAdProps) {
  // Don't render if ads are disabled
  if (!adConfig.enabled) {
    return null;
  }

  return (
    <div
      className={cn(
        "w-full py-8",
        "border-y border-border/50",
        "bg-muted/20",
        className
      )}
      role="complementary"
      aria-label="Advertisement"
    >
      <div className="container mx-auto px-4">
        <AdSlot
          slotId={slotId}
          format={format}
          minHeight={90}
          className="max-w-4xl mx-auto"
        />
      </div>
    </div>
  );
}
