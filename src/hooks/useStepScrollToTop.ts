import { useLayoutEffect, useRef } from "react";

/**
 * Deterministic, instant scroll-to-top for state-based wizard step transitions.
 * - Runs after DOM commit (useLayoutEffect).
 * - Blurs active element so the browser doesn't keep the clicked button in view.
 * - Temporarily forces scroll-behavior:auto (defeats global smooth scrolling).
 * - Uses simple window.scrollTo - avoids getComputedStyle to prevent forced reflow.
 */
export function useStepScrollToTop(step: unknown) {
  const topRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    // Prevent focus "keep in view" behavior
    (document.activeElement as HTMLElement | null)?.blur?.();

    // Force instant snap even if global smooth scroll exists
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.scrollBehavior;
    const prevBody = body.style.scrollBehavior;

    html.style.scrollBehavior = "auto";
    body.style.scrollBehavior = "auto";

    const doScroll = () => {
      // Use simple scroll methods - avoid layout-triggering APIs
      window.scrollTo(0, 0);
      html.scrollTop = 0;
      body.scrollTop = 0;
    };

    // After paint/commit - single rAF, no nested loops
    const raf = requestAnimationFrame(() => {
      doScroll();
      
      // Single fallback check after a frame
      requestAnimationFrame(() => {
        if (window.scrollY > 8) doScroll();
        
        // Restore styles
        html.style.scrollBehavior = prevHtml;
        body.style.scrollBehavior = prevBody;
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      html.style.scrollBehavior = prevHtml;
      body.style.scrollBehavior = prevBody;
    };
  }, [step]);

  return topRef;
}
