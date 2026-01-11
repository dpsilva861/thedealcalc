import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Global scroll-to-top on route changes.
 * Ignores hash changes to preserve anchor behavior.
 */
export function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Reset scroll on pathname or search change
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0; // iOS fallback
  }, [pathname, search]);

  return null;
}
