/**
 * useKeyboardShortcuts — Keyboard-driven revision navigation and decisions.
 *
 * j/k        — Navigate between revisions
 * a          — Accept focused revision
 * r          — Reject focused revision
 * Shift+A    — Bulk accept all visible
 * Shift+R    — Bulk reject all visible
 * Escape     — Clear focus
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type { RevisionDecision } from "@/lib/lease-redline/types";

export interface KeyboardShortcutsOptions {
  /** Total number of revisions */
  revisionCount: number;
  /** Current decisions array */
  decisions: RevisionDecision[];
  /** Callback to update decisions */
  onDecisionsChange: (decisions: RevisionDecision[]) => void;
  /** Whether shortcuts are active (false when typing in input/textarea) */
  enabled: boolean;
  /** Indices of currently visible (filtered) revisions */
  visibleIndices?: number[];
}

export function useKeyboardShortcuts({
  revisionCount,
  decisions,
  onDecisionsChange,
  enabled,
  visibleIndices,
}: KeyboardShortcutsOptions) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const decisionsRef = useRef(decisions);
  decisionsRef.current = decisions;

  // Effective list of navigable indices (memoized to avoid new reference every render)
  const indices = useMemo(
    () => visibleIndices ?? Array.from({ length: revisionCount }, (_, i) => i),
    [visibleIndices, revisionCount]
  );

  const positionInList = focusedIndex !== null ? indices.indexOf(focusedIndex) : -1;

  /** Accept a single revision */
  const acceptRevision = useCallback(
    (index: number) => {
      const updated = [...decisionsRef.current];
      updated[index] = "accepted";
      onDecisionsChange(updated);
    },
    [onDecisionsChange]
  );

  /** Reject a single revision */
  const rejectRevision = useCallback(
    (index: number) => {
      const updated = [...decisionsRef.current];
      updated[index] = "rejected";
      onDecisionsChange(updated);
    },
    [onDecisionsChange]
  );

  /** Bulk accept all visible revisions that are still pending */
  const bulkAcceptVisible = useCallback(() => {
    const updated = [...decisionsRef.current];
    for (const idx of indices) {
      if (updated[idx] === "pending") {
        updated[idx] = "accepted";
      }
    }
    onDecisionsChange(updated);
  }, [indices, onDecisionsChange]);

  /** Bulk reject all visible revisions that are still pending */
  const bulkRejectVisible = useCallback(() => {
    const updated = [...decisionsRef.current];
    for (const idx of indices) {
      if (updated[idx] === "pending") {
        updated[idx] = "rejected";
      }
    }
    onDecisionsChange(updated);
  }, [indices, onDecisionsChange]);

  /** Bulk accept by risk level */
  const bulkAcceptByRisk = useCallback(
    (riskLevels: string[], revisions: { riskLevel?: string }[]) => {
      const updated = [...decisionsRef.current];
      for (let i = 0; i < revisions.length; i++) {
        if (
          updated[i] === "pending" &&
          riskLevels.includes(revisions[i].riskLevel || "")
        ) {
          updated[i] = "accepted";
        }
      }
      onDecisionsChange(updated);
    },
    [onDecisionsChange]
  );

  /** Bulk reject by risk level */
  const bulkRejectByRisk = useCallback(
    (riskLevels: string[], revisions: { riskLevel?: string }[]) => {
      const updated = [...decisionsRef.current];
      for (let i = 0; i < revisions.length; i++) {
        if (
          updated[i] === "pending" &&
          riskLevels.includes(revisions[i].riskLevel || "")
        ) {
          updated[i] = "rejected";
        }
      }
      onDecisionsChange(updated);
    },
    [onDecisionsChange]
  );

  /** Bulk accept by category */
  const bulkAcceptByCategory = useCallback(
    (categories: string[], revisions: { category?: string }[]) => {
      const updated = [...decisionsRef.current];
      for (let i = 0; i < revisions.length; i++) {
        if (
          updated[i] === "pending" &&
          categories.includes(revisions[i].category || "")
        ) {
          updated[i] = "accepted";
        }
      }
      onDecisionsChange(updated);
    },
    [onDecisionsChange]
  );

  /** Bulk reject by category */
  const bulkRejectByCategory = useCallback(
    (categories: string[], revisions: { category?: string }[]) => {
      const updated = [...decisionsRef.current];
      for (let i = 0; i < revisions.length; i++) {
        if (
          updated[i] === "pending" &&
          categories.includes(revisions[i].category || "")
        ) {
          updated[i] = "rejected";
        }
      }
      onDecisionsChange(updated);
    },
    [onDecisionsChange]
  );

  /** Reset all decisions to pending */
  const resetAllDecisions = useCallback(() => {
    onDecisionsChange(Array(revisionCount).fill("pending"));
  }, [revisionCount, onDecisionsChange]);

  /** Navigate to next revision */
  const navigateNext = useCallback(() => {
    if (indices.length === 0) return;
    if (positionInList < 0 || positionInList >= indices.length - 1) {
      setFocusedIndex(indices[0]);
    } else {
      setFocusedIndex(indices[positionInList + 1]);
    }
  }, [indices, positionInList]);

  /** Navigate to previous revision */
  const navigatePrev = useCallback(() => {
    if (indices.length === 0) return;
    if (positionInList <= 0) {
      setFocusedIndex(indices[indices.length - 1]);
    } else {
      setFocusedIndex(indices[positionInList - 1]);
    }
  }, [indices, positionInList]);

  /** Clear focus */
  const clearFocus = useCallback(() => {
    setFocusedIndex(null);
  }, []);

  // Keyboard event listener
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      // Ignore when user is typing in an input/textarea/contenteditable
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;

      switch (e.key) {
        case "j":
          e.preventDefault();
          navigateNext();
          break;
        case "k":
          e.preventDefault();
          navigatePrev();
          break;
        case "A": // Shift+A (e.key is uppercase when Shift held)
          e.preventDefault();
          bulkAcceptVisible();
          break;
        case "R": // Shift+R
          e.preventDefault();
          bulkRejectVisible();
          break;
        case "a":
          if (focusedIndex !== null) {
            e.preventDefault();
            acceptRevision(focusedIndex);
            navigateNext();
          }
          break;
        case "r":
          if (focusedIndex !== null) {
            e.preventDefault();
            rejectRevision(focusedIndex);
            navigateNext();
          }
          break;
        case "Escape":
          e.preventDefault();
          clearFocus();
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    enabled,
    focusedIndex,
    navigateNext,
    navigatePrev,
    acceptRevision,
    rejectRevision,
    bulkAcceptVisible,
    bulkRejectVisible,
    clearFocus,
  ]);

  // Scroll focused revision into view
  useEffect(() => {
    if (focusedIndex === null) return;
    const el = document.querySelector(`[data-revision-index="${focusedIndex}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusedIndex]);

  return {
    focusedIndex,
    setFocusedIndex,
    acceptRevision,
    rejectRevision,
    bulkAcceptVisible,
    bulkRejectVisible,
    bulkAcceptByRisk,
    bulkRejectByRisk,
    bulkAcceptByCategory,
    bulkRejectByCategory,
    resetAllDecisions,
    navigateNext,
    navigatePrev,
    clearFocus,
  };
}
