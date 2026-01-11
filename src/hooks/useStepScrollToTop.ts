import { useEffect, useLayoutEffect, useRef } from "react";

function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  if (!el) return null;

  let parent: HTMLElement | null = el.parentElement;
  while (parent) {
    const style = window.getComputedStyle(parent);
    const overflowY = style.overflowY;
    const isScrollableY =
      (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
      parent.scrollHeight > parent.clientHeight;

    if (isScrollableY) return parent;
    parent = parent.parentElement;
  }

  return null;
}

/**
 * Deterministic scroll-to-top for state-based wizard step transitions.
 *
 * Two-phase approach:
 * 1. Primary: scroll immediately after DOM commit (via rAF).
 * 2. Fallback: if scroll didn't land near top, retry once at 150ms.
 *
 * This avoids the "creeping" multi-scroll effect while still handling
 * iOS Safari scroll restoration quirks.
 */
export function useStepScrollToTop(step: unknown) {
  const topRef = useRef<HTMLDivElement | null>(null);
  const hasRunRef = useRef(false);

  useEffect(() => {
    // Disable browser scroll restoration while on a wizard page.
    const hist = window.history as History & { scrollRestoration?: ScrollRestoration };
    const prev = hist.scrollRestoration;

    if ("scrollRestoration" in hist) {
      hist.scrollRestoration = "manual";
    }

    return () => {
      if ("scrollRestoration" in hist) {
        hist.scrollRestoration = prev ?? "auto";
      }
    };
  }, []);

  useLayoutEffect(() => {
    // Preserve default hash-anchor behavior on initial mount.
    if (!hasRunRef.current && window.location.hash) {
      hasRunRef.current = true;
      return;
    }
    hasRunRef.current = true;

    // Blur immediately to prevent browser from keeping clicked button in view.
    (document.activeElement as HTMLElement | null)?.blur?.();

    const anchor = topRef.current;
    const scrollParent = getScrollParent(anchor);

    const doScroll = () => {
      // Reset scroll container if present.
      if (scrollParent) scrollParent.scrollTop = 0;

      // Focus anchor with preventScroll to avoid focus-induced scrolling.
      if (anchor) {
        (anchor as HTMLElement).focus?.({ preventScroll: true });
        anchor.scrollIntoView({ block: "start", behavior: "auto" });
      }

      // Hard fallbacks for all browsers.
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      const se = document.scrollingElement as HTMLElement | null;
      if (se) se.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      // Ensure container ended at top.
      if (scrollParent) scrollParent.scrollTop = 0;
    };

    const needsFallback = (): boolean => {
      const parentTop = scrollParent ? scrollParent.scrollTop : 0;
      const winTop = window.scrollY;
      return winTop > 8 || parentTop > 8;
    };

    let fallbackTimeout: number | undefined;
    let rafId2: number | undefined;

    const rafId = requestAnimationFrame(() => {
      doScroll();

      // Check if scroll succeeded after next frame.
      rafId2 = requestAnimationFrame(() => {
        if (needsFallback()) {
          // One fallback attempt only.
          fallbackTimeout = window.setTimeout(doScroll, 150);
        }
      });
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (rafId2) cancelAnimationFrame(rafId2);
      if (fallbackTimeout) window.clearTimeout(fallbackTimeout);
    };
  }, [step]);

  return topRef;
}
