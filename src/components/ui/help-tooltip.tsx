import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  content: React.ReactNode;
  className?: string;
  iconClassName?: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
}

/**
 * Mobile-friendly help tooltip that opens on click/tap on touch devices
 * and on hover on desktop devices.
 */
export function HelpTooltip({
  content,
  className,
  iconClassName,
  side = "top",
  align = "center",
}: HelpTooltipProps) {
  const [open, setOpen] = React.useState(false);
  const [isTouchDevice, setIsTouchDevice] = React.useState(false);

  // Detect touch/coarse pointer device
  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(pointer: coarse)");
    setIsTouchDevice(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsTouchDevice(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Close on click outside for touch devices
  React.useEffect(() => {
    if (!isTouchDevice || !open) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking the tooltip content itself
      if (target.closest("[data-radix-popper-content-wrapper]")) return;
      setOpen(false);
    };

    // Small delay to prevent immediate close on the opening click
    const timeout = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isTouchDevice, open]);

  const handleTriggerClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (isTouchDevice) {
      e.preventDefault();
      e.stopPropagation();
      setOpen((prev) => !prev);
    }
  };

  return (
    <TooltipPrimitive.Provider delayDuration={isTouchDevice ? 0 : 100}>
      <TooltipPrimitive.Root open={isTouchDevice ? open : undefined} onOpenChange={isTouchDevice ? setOpen : undefined}>
        <TooltipPrimitive.Trigger asChild>
          <button
            type="button"
            aria-label="Help"
            className={cn(
              "inline-flex items-center justify-center pointer-events-auto",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full",
              className
            )}
            onClick={handleTriggerClick}
            onTouchEnd={isTouchDevice ? handleTriggerClick : undefined}
          >
            <HelpCircle
              className={cn(
                "h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors",
                iconClassName
              )}
            />
          </button>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={4}
            className={cn(
              "z-50 overflow-hidden rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md",
              "max-w-xs",
              "animate-in fade-in-0 zoom-in-95",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
              "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
              "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
            )}
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
