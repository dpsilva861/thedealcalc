import { AdSlot } from "./AdSlot";
import { adConfig } from "@/config/ads";
import { cn } from "@/lib/utils";

interface MobileAdProps {
  /** Slot ID to use */
  slotId?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Mobile-only ad component for placing between content sections
 * Hidden on large screens where AdRail is used instead
 */
export function MobileAd({ 
  slotId = adConfig.slots.mobileInContent,
  className,
}: MobileAdProps) {
  // Don't render if ads are disabled
  if (!adConfig.enabled) {
    return null;
  }

  return (
    <div
      className={cn(
        // Only visible on mobile/tablet
        "lg:hidden",
        "w-full py-6",
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
          format="auto"
          minHeight={100}
        />
      </div>
    </div>
  );
}
