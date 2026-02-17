import { useState, useCallback } from "react";
import type {
  AnalysisVersion,
  LeaseRedlineRevision,
  RevisionDecision,
} from "@/lib/lease-redline/types";

const VERSIONS_KEY = "lease-redline-versions";
const MAX_VERSIONS_PER_ANALYSIS = 20;

/**
 * Local-first version history tracking.
 * Saves snapshots of analysis state so users can compare across negotiation rounds.
 */
export function useVersionHistory() {
  const [versions, setVersionsState] = useState<Record<string, AnalysisVersion[]>>(
    () => {
      try {
        const stored = localStorage.getItem(VERSIONS_KEY);
        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    }
  );

  const persist = useCallback((next: Record<string, AnalysisVersion[]>) => {
    try {
      localStorage.setItem(VERSIONS_KEY, JSON.stringify(next));
    } catch {
      // localStorage full
    }
  }, []);

  /**
   * Save a version snapshot for an analysis.
   */
  const saveVersion = useCallback(
    (
      analysisId: string,
      revisions: LeaseRedlineRevision[],
      decisions: RevisionDecision[],
      summary?: string,
      riskFlags?: string[],
      label?: string
    ): AnalysisVersion => {
      const existing = versions[analysisId] || [];
      const versionNumber = existing.length + 1;

      const version: AnalysisVersion = {
        id: `ver_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        analysisId,
        versionNumber,
        revisions: revisions.map((r) => ({ ...r })),
        decisions: [...decisions],
        summary,
        riskFlags: riskFlags || [],
        createdAt: new Date().toISOString(),
        label: label || `Round ${versionNumber}`,
      };

      const next = {
        ...versions,
        [analysisId]: [...existing, version].slice(-MAX_VERSIONS_PER_ANALYSIS),
      };
      setVersionsState(next);
      persist(next);
      return version;
    },
    [versions, persist]
  );

  /**
   * Get all versions for an analysis.
   */
  const getVersions = useCallback(
    (analysisId: string): AnalysisVersion[] => {
      return versions[analysisId] || [];
    },
    [versions]
  );

  /**
   * Compare two versions and return the differences.
   */
  const compareVersions = useCallback(
    (
      analysisId: string,
      versionA: number,
      versionB: number
    ): VersionDiff | null => {
      const versionList = versions[analysisId];
      if (!versionList) return null;

      const a = versionList.find((v) => v.versionNumber === versionA);
      const b = versionList.find((v) => v.versionNumber === versionB);
      if (!a || !b) return null;

      const addedRevisions: LeaseRedlineRevision[] = [];
      const removedRevisions: LeaseRedlineRevision[] = [];
      const changedDecisions: {
        clauseNumber: number;
        from: RevisionDecision;
        to: RevisionDecision;
      }[] = [];

      // Find revisions in B but not in A (by clauseNumber)
      const aClauseNums = new Set(a.revisions.map((r) => r.clauseNumber));
      const bClauseNums = new Set(b.revisions.map((r) => r.clauseNumber));

      for (const rev of b.revisions) {
        if (!aClauseNums.has(rev.clauseNumber)) {
          addedRevisions.push(rev);
        }
      }

      for (const rev of a.revisions) {
        if (!bClauseNums.has(rev.clauseNumber)) {
          removedRevisions.push(rev);
        }
      }

      // Compare decisions for matching clauses
      for (let i = 0; i < Math.min(a.decisions.length, b.decisions.length); i++) {
        if (a.decisions[i] !== b.decisions[i]) {
          changedDecisions.push({
            clauseNumber: a.revisions[i]?.clauseNumber || i + 1,
            from: a.decisions[i],
            to: b.decisions[i],
          });
        }
      }

      return {
        versionA: a,
        versionB: b,
        addedRevisions,
        removedRevisions,
        changedDecisions,
        riskFlagsDiff: {
          added: b.riskFlags.filter((f) => !a.riskFlags.includes(f)),
          removed: a.riskFlags.filter((f) => !b.riskFlags.includes(f)),
        },
      };
    },
    [versions]
  );

  /**
   * Delete a specific version.
   */
  const deleteVersion = useCallback(
    (analysisId: string, versionId: string) => {
      const existing = versions[analysisId] || [];
      const next = {
        ...versions,
        [analysisId]: existing.filter((v) => v.id !== versionId),
      };
      setVersionsState(next);
      persist(next);
    },
    [versions, persist]
  );

  return {
    versions,
    saveVersion,
    getVersions,
    compareVersions,
    deleteVersion,
  };
}

export interface VersionDiff {
  versionA: AnalysisVersion;
  versionB: AnalysisVersion;
  addedRevisions: LeaseRedlineRevision[];
  removedRevisions: LeaseRedlineRevision[];
  changedDecisions: {
    clauseNumber: number;
    from: RevisionDecision;
    to: RevisionDecision;
  }[];
  riskFlagsDiff: {
    added: string[];
    removed: string[];
  };
}
