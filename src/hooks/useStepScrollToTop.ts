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

    (document.activeElement as HTMLElement | null)?.blur?.();

    const scrollNow = () => {
      const anchor = topRef.current;
      const scrollParent = getScrollParent(anchor);

      // If the wizard lives in a scroll container, reset it.
      if (scrollParent) scrollParent.scrollTop = 0;

      // Prefer anchor scrolling (works inside scroll containers).
      if (anchor) {
        anchor.scrollIntoView({ block: "start", behavior: "auto" });
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }

      // Hard fallback for iOS/scroll restoration weirdness.
      const se = document.scrollingElement as HTMLElement | null;
      if (se) se.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      // Ensure container (if any) ended at top.
      if (scrollParent) scrollParent.scrollTop = 0;
    };

    let timeoutId: number | undefined;
    const rafId = requestAnimationFrame(() => {
      scrollNow();
      timeoutId = window.setTimeout(scrollNow, 50);
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [step]);

  return topRef;
}
