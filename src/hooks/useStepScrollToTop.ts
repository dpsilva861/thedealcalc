import { useLayoutEffect, useRef } from "react";

function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  let p = el?.parentElement ?? null;
  while (p) {
    const style = window.getComputedStyle(p);
    const overflowY = style.overflowY;
    if ((overflowY === "auto" || overflowY === "scroll") && p.scrollHeight > p.clientHeight) {
      return p;
    }
    p = p.parentElement;
  }
  return null;
}

/**
 * Deterministic, instant scroll-to-top for state-based wizard step transitions.
 * - Runs after DOM commit (useLayoutEffect).
 * - Blurs active element so the browser doesn't keep the clicked button in view.
 * - Temporarily forces scroll-behavior:auto (defeats global smooth scrolling).
 * - Uses ONE scroll mechanism: either scrollParent.scrollTop or window scroll.
 * - Only ONE fallback tick (no multiple timeouts that cause "creeping").
 */
export function useStepScrollToTop(step: unknown) {
  const topRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const anchor = topRef.current;
    const scrollParent = getScrollParent(anchor);

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
      if (scrollParent) {
        scrollParent.scrollTop = 0;
      } else {
        window.scrollTo(0, 0);
        const se = document.scrollingElement as HTMLElement | null;
        if (se) se.scrollTop = 0;
        html.scrollTop = 0;
        body.scrollTop = 0;
      }
    };

    // After paint/commit
    const raf1 = requestAnimationFrame(() => {
      doScroll();

      // Single fallback only if not at top
      const raf2 = requestAnimationFrame(() => {
        const winTop = window.scrollY || html.scrollTop || body.scrollTop || 0;
        const parentTop = scrollParent ? scrollParent.scrollTop : 0;

        if (winTop > 8 || parentTop > 8) doScroll();

        // Restore styles
        html.style.scrollBehavior = prevHtml;
        body.style.scrollBehavior = prevBody;
      });

      return () => cancelAnimationFrame(raf2);
    });

    return () => {
      cancelAnimationFrame(raf1);
      html.style.scrollBehavior = prevHtml;
      body.style.scrollBehavior = prevBody;
    };
  }, [step]);

  return topRef;
}
