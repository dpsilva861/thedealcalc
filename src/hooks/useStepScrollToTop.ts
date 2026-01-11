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
 * Why this works:
 * - Runs on `step` change (after DOM commit), not in click handlers.
 * - Blurs the active element to prevent browsers from keeping the clicked button in view.
 * - Uses an anchor `scrollIntoView()` so it works with custom scroll containers.
 * - Double-ticks (rAF + timeout) to defeat scroll restoration quirks (notably iOS).
 * - Preserves initial hash-anchor behavior by skipping the first run when a hash exists.
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

    const scrollNow = () => {
      const anchor = topRef.current;
      const scrollParent = getScrollParent(anchor);

      // If the wizard lives in a scroll container, reset it.
      if (scrollParent) scrollParent.scrollTop = 0;

      // Prefer anchor scrolling (works inside scroll containers).
      if (anchor) {
        anchor.scrollIntoView({ block: "start", behavior: "auto" });
      }

      // Hard fallbacks for iOS/scroll restoration weirdness.
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      const se = document.scrollingElement as HTMLElement | null;
      if (se) se.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      // Ensure container (if any) ended at top.
      if (scrollParent) scrollParent.scrollTop = 0;
    };

    // Immediate attempt (may be overridden by browser scroll restoration).
    scrollNow();

    // Multiple delayed ticks to defeat scroll restoration on iOS Safari + Chrome.
    let t1: number | undefined;
    let t2: number | undefined;
    let t3: number | undefined;

    const rafId = requestAnimationFrame(() => {
      scrollNow();
      t1 = window.setTimeout(scrollNow, 50);
      t2 = window.setTimeout(scrollNow, 150);
      t3 = window.setTimeout(scrollNow, 300);
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (t1) window.clearTimeout(t1);
      if (t2) window.clearTimeout(t2);
      if (t3) window.clearTimeout(t3);
    };
  }, [step]);

  return topRef;
}
