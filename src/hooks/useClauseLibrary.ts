import { useState, useCallback, useRef } from "react";
import type { CustomClause, DocumentType } from "@/lib/lease-redline/types";
import {
  extractClauseCandidates,
  clauseSimilarity,
  type ClauseCandidate,
} from "@/lib/lease-redline/learning-engine";

const CLAUSES_KEY = "lease-redline-clause-library";
const MAX_CLAUSES = 200;

/**
 * Local-first hook for managing a custom clause library.
 * Stores clauses in localStorage for quick access across sessions.
 */
export function useClauseLibrary() {
  const [clauses, setClausesState] = useState<CustomClause[]>(() => {
    try {
      const stored = localStorage.getItem(CLAUSES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist clauses to localStorage
  const persistClauses = (next: CustomClause[]): CustomClause[] => {
    try {
      localStorage.setItem(CLAUSES_KEY, JSON.stringify(next));
    } catch {
      // localStorage full or unavailable
    }
    return next;
  };

  // Add a new custom clause
  const addClause = useCallback(
    (
      category: string,
      label: string,
      language: string,
      jurisdiction?: string,
      documentTypes?: DocumentType[]
    ): string => {
      const id = `clause_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const now = new Date().toISOString();

      const newClause: CustomClause = {
        id,
        category,
        label,
        language,
        jurisdiction,
        documentTypes: documentTypes ?? [],
        isDefault: false,
        createdAt: now,
        updatedAt: now,
      };

      setClausesState((prev) => {
        const next = [newClause, ...prev].slice(0, MAX_CLAUSES);
        return persistClauses(next);
      });

      return id;
    },
    []
  );

  // Update fields on an existing clause
  const updateClause = useCallback(
    (clauseId: string, updates: Partial<CustomClause>) => {
      setClausesState((prev) => {
        const next = prev.map((clause) =>
          clause.id === clauseId
            ? { ...clause, ...updates, id: clause.id, updatedAt: new Date().toISOString() }
            : clause
        );
        return persistClauses(next);
      });
    },
    []
  );

  // Delete a clause
  const deleteClause = useCallback((clauseId: string) => {
    setClausesState((prev) => {
      const next = prev.filter((clause) => clause.id !== clauseId);
      return persistClauses(next);
    });
  }, []);

  // Get all clauses in a specific category
  const getClausesByCategory = useCallback(
    (category: string): CustomClause[] => {
      return clauses.filter((clause) => clause.category === category);
    },
    [clauses]
  );

  // Get clauses matching a document type and optionally a jurisdiction
  const getClausesForDocument = useCallback(
    (documentType: DocumentType, jurisdiction?: string): CustomClause[] => {
      return clauses.filter((clause) => {
        // Match if the clause has no documentTypes restriction or includes this type
        const matchesType =
          clause.documentTypes.length === 0 ||
          clause.documentTypes.includes(documentType);

        // Match if no jurisdiction filter, or clause has no jurisdiction, or they match
        const matchesJurisdiction =
          !jurisdiction ||
          !clause.jurisdiction ||
          clause.jurisdiction === jurisdiction;

        return matchesType && matchesJurisdiction;
      });
    },
    [clauses]
  );

  // Import a clause (e.g. from a shared backup)
  const importClause = useCallback(
    (clause: Omit<CustomClause, "id" | "createdAt" | "updatedAt">): string => {
      const id = `clause_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const now = new Date().toISOString();

      const imported: CustomClause = {
        ...clause,
        id,
        createdAt: now,
        updatedAt: now,
      };

      setClausesState((prev) => {
        const next = [imported, ...prev].slice(0, MAX_CLAUSES);
        return persistClauses(next);
      });

      return id;
    },
    []
  );

  // Export all clauses as a JSON string for backup
  const exportClauses = useCallback((): string => {
    return JSON.stringify(clauses, null, 2);
  }, [clauses]);

  /**
   * Similarity threshold — if an existing clause is this similar,
   * we boost its acceptance count instead of creating a duplicate.
   */
  const SIMILARITY_THRESHOLD = 0.7;

  /**
   * Auto-learn clauses from accepted revisions.
   *
   * When the user accepts a revision with substantial replacement text,
   * this extracts it as a clause candidate. If a similar clause already
   * exists, its acceptanceCount is incremented. If not, a new "learned"
   * clause is added to the library.
   *
   * Returns the number of clauses created or updated.
   */
  const learnFromDecisions = useCallback(
    (
      revisions: { category?: string; clauseNumber: number; riskLevel?: string; reason: string; cleanReplacement: string }[],
      decisions: string[]
    ): number => {
      const candidates = extractClauseCandidates(revisions, decisions);
      if (candidates.length === 0) return 0;

      let changes = 0;

      setClausesState((prev) => {
        let updated = [...prev];

        for (const candidate of candidates) {
          // Check if a similar clause already exists
          const existing = updated.find(
            (c) =>
              c.category.toLowerCase() === candidate.category.toLowerCase() &&
              clauseSimilarity(c.language, candidate.language) >= SIMILARITY_THRESHOLD
          );

          if (existing) {
            // Boost existing clause's acceptance count
            existing.acceptanceCount = (existing.acceptanceCount || 0) + 1;
            existing.updatedAt = new Date().toISOString();
            changes++;
          } else {
            // Create new learned clause
            const id = `clause_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
            const now = new Date().toISOString();
            updated = [
              {
                id,
                category: candidate.category,
                label: candidate.label,
                language: candidate.language,
                documentTypes: [],
                isDefault: false,
                source: "learned" as const,
                acceptanceCount: 1,
                learnedFromReason: candidate.reason,
                createdAt: now,
                updatedAt: now,
              },
              ...updated,
            ].slice(0, MAX_CLAUSES);
            changes++;
          }
        }

        return persistClauses(updated);
      });

      return changes;
    },
    []
  );

  /**
   * Get clauses relevant for AI prompt injection.
   * Returns clauses sorted by acceptance count — most-proven first.
   */
  const getClausesForPrompt = useCallback(
    (documentType?: DocumentType, jurisdiction?: string): CustomClause[] => {
      return clauses
        .filter((c) => {
          const matchesType =
            !documentType ||
            c.documentTypes.length === 0 ||
            c.documentTypes.includes(documentType);
          const matchesJurisdiction =
            !jurisdiction ||
            !c.jurisdiction ||
            c.jurisdiction === jurisdiction;
          return matchesType && matchesJurisdiction;
        })
        .sort((a, b) => (b.acceptanceCount || 0) - (a.acceptanceCount || 0));
    },
    [clauses]
  );

  return {
    clauses,
    addClause,
    updateClause,
    deleteClause,
    getClausesByCategory,
    getClausesForDocument,
    getClausesForPrompt,
    importClause,
    exportClauses,
    learnFromDecisions,
  };
}
