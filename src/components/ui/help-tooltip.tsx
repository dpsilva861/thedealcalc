import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { HelpCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";

interface HelpTooltipProps {
  content: React.ReactNode;
  title?: string;
  className?: string;
  iconClassName?: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
}

/**
 * Mobile-friendly help tooltip that:
 * - Desktop: shows tooltip on hover
 * - Mobile/touch: opens bottom drawer on tap
 */
export function HelpTooltip({
  content,
  title = "Help",
  className,
  iconClassName,
  side = "top",
  align = "center",
}: HelpTooltipProps) {
  const [open, setOpen] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [isTouchDevice, setIsTouchDevice] = React.useState(false);

  // Detect touch/coarse pointer device
  React.useEffect(() => {
    const checkTouchDevice = () => {
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const maxWidth = window.matchMedia("(max-width: 768px)").matches;
      setIsTouchDevice(coarse || maxWidth);
    };
    
    checkTouchDevice();
    
    const coarseQuery = window.matchMedia("(pointer: coarse)");
    const widthQuery = window.matchMedia("(max-width: 768px)");
    
    const handler = () => checkTouchDevice();
    coarseQuery.addEventListener("change", handler);
    widthQuery.addEventListener("change", handler);
    
    return () => {
      coarseQuery.removeEventListener("change", handler);
      widthQuery.removeEventListener("change", handler);
    };
  }, []);

  const handleTriggerClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (isTouchDevice) {
      e.preventDefault();
      e.stopPropagation();
      setDrawerOpen(true);
    }
  };

  // On mobile, render a button that opens a drawer
  if (isTouchDevice) {
    return (
      <>
        <button
          type="button"
          aria-label="Help"
          className={cn(
            "inline-flex items-center justify-center pointer-events-auto min-w-[44px] min-h-[44px] -m-2.5 p-2.5",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full",
            className
          )}
          onClick={handleTriggerClick}
        >
          <HelpCircle
            className={cn(
              "h-5 w-5 text-muted-foreground",
              iconClassName
            )}
          />
        </button>
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent>
            <DrawerHeader className="relative">
              <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>
              <DrawerClose asChild>
                <button
                  className="absolute right-4 top-4 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-muted"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </DrawerClose>
            </DrawerHeader>
            <div className="px-4 pb-8 text-muted-foreground">
              {content}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // On desktop, use standard tooltip with hover
  return (
    <TooltipPrimitive.Provider delayDuration={100}>
      <TooltipPrimitive.Root open={open} onOpenChange={setOpen}>
        <TooltipPrimitive.Trigger asChild>
          <button
            type="button"
            aria-label="Help"
            className={cn(
              "inline-flex items-center justify-center pointer-events-auto",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full",
              className
            )}
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
