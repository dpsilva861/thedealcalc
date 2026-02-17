import { useState, useCallback } from "react";
import type { CustomClause, DocumentType } from "@/lib/lease-redline/types";

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

  return {
    clauses,
    addClause,
    updateClause,
    deleteClause,
    getClausesByCategory,
    getClausesForDocument,
    importClause,
    exportClauses,
  };
}
