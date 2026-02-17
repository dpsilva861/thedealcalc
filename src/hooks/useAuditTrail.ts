import { useState, useCallback } from "react";
import type { AuditAction, AuditEntry } from "@/lib/lease-redline/types";

const AUDIT_KEY = "lease-redline-audit-trail";
const MAX_AUDIT_ENTRIES = 500;

/**
 * Local-first audit trail for compliance and review.
 * Logs every significant action taken on analyses.
 */
export function useAuditTrail() {
  const [entries, setEntriesState] = useState<AuditEntry[]>(() => {
    try {
      const stored = localStorage.getItem(AUDIT_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const persist = useCallback((next: AuditEntry[]) => {
    try {
      localStorage.setItem(AUDIT_KEY, JSON.stringify(next));
    } catch {
      // localStorage full
    }
  }, []);

  /**
   * Log an audit event.
   */
  const logAction = useCallback(
    (
      action: AuditAction,
      analysisId?: string,
      details?: Record<string, unknown>
    ) => {
      const entry: AuditEntry = {
        id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        analysisId,
        userId: "local", // Will be replaced with actual user ID when auth is active
        action,
        details,
        createdAt: new Date().toISOString(),
      };

      setEntriesState((prev) => {
        const next = [entry, ...prev].slice(0, MAX_AUDIT_ENTRIES);
        persist(next);
        return next;
      });

      return entry;
    },
    [persist]
  );

  /**
   * Get audit entries for a specific analysis.
   */
  const getEntriesForAnalysis = useCallback(
    (analysisId: string): AuditEntry[] => {
      return entries.filter((e) => e.analysisId === analysisId);
    },
    [entries]
  );

  /**
   * Get audit entries by action type.
   */
  const getEntriesByAction = useCallback(
    (action: AuditAction): AuditEntry[] => {
      return entries.filter((e) => e.action === action);
    },
    [entries]
  );

  /**
   * Get recent entries (last N).
   */
  const getRecentEntries = useCallback(
    (count = 50): AuditEntry[] => {
      return entries.slice(0, count);
    },
    [entries]
  );

  /**
   * Export audit trail as CSV.
   */
  const exportAsCsv = useCallback((): string => {
    const header = "Timestamp,Action,Analysis ID,User ID,Details";
    const rows = entries.map((e) => {
      const details = e.details ? JSON.stringify(e.details).replace(/"/g, '""') : "";
      return `"${e.createdAt}","${e.action}","${e.analysisId || ""}","${e.userId}","${details}"`;
    });
    return [header, ...rows].join("\n");
  }, [entries]);

  /**
   * Clear audit trail (with confirmation).
   */
  const clearAuditTrail = useCallback(() => {
    setEntriesState([]);
    persist([]);
  }, [persist]);

  return {
    entries,
    logAction,
    getEntriesForAnalysis,
    getEntriesByAction,
    getRecentEntries,
    exportAsCsv,
    clearAuditTrail,
  };
}
