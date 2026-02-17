import { useState, useCallback } from "react";
import type {
  LeaseTemplate,
  TemplateClause,
  TemplateDeviation,
  DocumentType,
  RiskLevel,
} from "@/lib/lease-redline/types";

const TEMPLATES_KEY = "lease-redline-templates";
const MAX_TEMPLATES = 20;

/**
 * Hook for managing lease templates and comparing incoming documents
 * against the user's standard form.
 */
export function useTemplateComparison() {
  const [templates, setTemplatesState] = useState<LeaseTemplate[]>(() => {
    try {
      const stored = localStorage.getItem(TEMPLATES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const persist = useCallback((next: LeaseTemplate[]) => {
    try {
      localStorage.setItem(TEMPLATES_KEY, JSON.stringify(next));
    } catch {
      // localStorage full
    }
  }, []);

  /**
   * Create a new template from raw text (manually or from document).
   * The user segments clauses themselves via the UI.
   */
  const createTemplate = useCallback(
    (
      name: string,
      documentType: DocumentType,
      clauses: Omit<TemplateClause, "id">[],
      jurisdiction?: string
    ): LeaseTemplate => {
      const template: LeaseTemplate = {
        id: `tmpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name,
        documentType,
        jurisdiction,
        clauses: clauses.map((c, i) => ({
          ...c,
          id: `tc_${Date.now()}_${i}`,
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const next = [template, ...templates].slice(0, MAX_TEMPLATES);
      setTemplatesState(next);
      persist(next);
      return template;
    },
    [templates, persist]
  );

  /**
   * Update an existing template.
   */
  const updateTemplate = useCallback(
    (templateId: string, updates: Partial<Omit<LeaseTemplate, "id" | "createdAt">>) => {
      const next = templates.map((t) =>
        t.id === templateId
          ? { ...t, ...updates, updatedAt: new Date().toISOString() }
          : t
      );
      setTemplatesState(next);
      persist(next);
    },
    [templates, persist]
  );

  /**
   * Delete a template.
   */
  const deleteTemplate = useCallback(
    (templateId: string) => {
      const next = templates.filter((t) => t.id !== templateId);
      setTemplatesState(next);
      persist(next);
    },
    [templates, persist]
  );

  /**
   * Get a template by ID.
   */
  const getTemplate = useCallback(
    (templateId: string): LeaseTemplate | null => {
      return templates.find((t) => t.id === templateId) || null;
    },
    [templates]
  );

  /**
   * Compare an incoming document's text against a template.
   * Finds where the incoming text deviates from the standard clauses.
   *
   * This is a client-side heuristic comparison. The AI agent can do
   * more sophisticated comparison when the template ID is passed to the analysis.
   */
  const compareAgainstTemplate = useCallback(
    (templateId: string, incomingText: string): TemplateDeviation[] => {
      const template = templates.find((t) => t.id === templateId);
      if (!template) return [];

      const deviations: TemplateDeviation[] = [];
      const lowerText = incomingText.toLowerCase();

      for (const clause of template.clauses) {
        const standardLower = clause.standardLanguage.toLowerCase().trim();
        // Extract first 40 chars as a search anchor
        const anchor = standardLower.slice(0, 40);

        const anchorIndex = lowerText.indexOf(anchor);

        if (anchorIndex === -1) {
          // Clause not found at all — either missing or substantially modified
          // Try to find by category keywords
          const categoryKeywords = getCategoryKeywords(clause.category);
          const hasCategory = categoryKeywords.some((kw) =>
            lowerText.includes(kw.toLowerCase())
          );

          if (hasCategory) {
            // Found the topic but language is different — modified
            const snippetStart = lowerText.indexOf(
              categoryKeywords.find((kw) => lowerText.includes(kw.toLowerCase()))!.toLowerCase()
            );
            const snippet = incomingText.slice(
              Math.max(0, snippetStart - 50),
              snippetStart + 300
            );
            deviations.push({
              templateClauseId: clause.id,
              templateClauseLabel: clause.label,
              category: clause.category,
              standardLanguage: clause.standardLanguage,
              incomingLanguage: snippet.trim(),
              deviationType: "modified",
              severity: "high",
              explanation: `Standard "${clause.label}" clause language not found. The incoming document appears to address this topic differently.`,
            });
          } else {
            // Topic not found — missing
            deviations.push({
              templateClauseId: clause.id,
              templateClauseLabel: clause.label,
              category: clause.category,
              standardLanguage: clause.standardLanguage,
              incomingLanguage: "",
              deviationType: "missing",
              severity: "critical",
              explanation: `Standard "${clause.label}" clause is missing entirely from the incoming document.`,
            });
          }
        } else {
          // Found the anchor — check if the full clause matches
          const incomingSlice = incomingText
            .slice(anchorIndex, anchorIndex + clause.standardLanguage.length + 200)
            .trim();

          const similarity = computeSimilarity(
            clause.standardLanguage,
            incomingSlice.slice(0, clause.standardLanguage.length + 100)
          );

          if (similarity < 0.85) {
            deviations.push({
              templateClauseId: clause.id,
              templateClauseLabel: clause.label,
              category: clause.category,
              standardLanguage: clause.standardLanguage,
              incomingLanguage: incomingSlice.slice(0, 500),
              deviationType: "modified",
              severity: similarity < 0.5 ? "high" : "medium",
              explanation: `"${clause.label}" clause has been modified (${Math.round(similarity * 100)}% similarity to standard).`,
            });
          }
        }
      }

      return deviations;
    },
    [templates]
  );

  return {
    templates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplate,
    compareAgainstTemplate,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────

function getCategoryKeywords(category: string): string[] {
  const map: Record<string, string[]> = {
    rent: ["base rent", "annual rent", "monthly rent", "rent escalation", "rent adjustment"],
    term: ["lease term", "commencement date", "expiration date", "renewal option"],
    TI: ["tenant improvement", "allowance", "construction", "build-out"],
    CAM: ["common area", "operating expenses", "maintenance", "CAM charges"],
    use: ["permitted use", "exclusive use", "use clause", "permitted purpose"],
    exclusive: ["exclusive", "radius restriction", "non-compete"],
    "co-tenancy": ["co-tenancy", "anchor tenant", "co-tenant"],
    assignment: ["assignment", "subletting", "sublease", "transfer"],
    default: ["default", "remedies", "cure period", "event of default"],
    guaranty: ["guaranty", "guarantor", "personal guarantee"],
    casualty: ["casualty", "condemnation", "fire", "damage", "destruction"],
    maintenance: ["maintenance", "repair", "upkeep"],
    insurance: ["insurance", "liability", "indemnification", "CGL"],
  };
  return map[category] || [category];
}

/**
 * Simple word-overlap similarity (Jaccard-like).
 */
function computeSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }
  return intersection / Math.max(wordsA.size, wordsB.size);
}
