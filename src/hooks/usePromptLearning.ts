/**
 * usePromptLearning — Tracks prompt suggestion usage and success over time.
 *
 * Learning loop:
 * 1. User uploads document → suggestions appear (sorted by past success)
 * 2. User selects suggestions → selection is tracked
 * 3. User may type custom instructions → stored for pattern mining
 * 4. Analysis runs, user accepts/rejects revisions
 * 5. On reset → stats updated: which suggestions led to good accept rates
 * 6. Custom instructions that produce good results become new suggestions
 * 7. Next analysis → suggestions ranked by proven success, custom ones included
 */

import { useState, useCallback, useRef } from "react";
import type { DocumentType } from "@/lib/lease-redline/types";
import type { PromptSuggestion } from "@/lib/lease-redline/prompt-suggestions";

// ── Types ──────────────────────────────────────────────────────────────

export interface SuggestionStats {
  selectCount: number;
  /** How many analyses it was active in */
  analysisCount: number;
  /** Total revisions accepted in analyses where this suggestion was active */
  acceptedRevisions: number;
  /** Total revisions in analyses where this suggestion was active */
  totalRevisions: number;
  lastUsedAt: string;
}

export interface LearnedPromptSuggestion {
  id: string;
  label: string;
  instruction: string;
  category: PromptSuggestion["category"];
  /** How many times this instruction was used */
  usageCount: number;
  /** Accept rate when this was active (0-1) */
  successScore: number;
  /** Document types this has been used with */
  documentTypes: DocumentType[];
  createdAt: string;
  lastUsedAt: string;
}

interface InstructionHistoryEntry {
  text: string;
  documentType: DocumentType;
  timestamp: string;
  /** Filled in after analysis completes */
  acceptRate?: number;
}

interface PromptLearningData {
  builtInStats: Record<string, SuggestionStats>;
  customSuggestions: LearnedPromptSuggestion[];
  instructionHistory: InstructionHistoryEntry[];
}

// ── Constants ──────────────────────────────────────────────────────────

const STORAGE_KEY = "lease-redline-prompt-learning";
const MAX_HISTORY = 50;
const MAX_CUSTOM_SUGGESTIONS = 30;
/** Minimum accept rate for a custom instruction to become a learned suggestion */
const MIN_SUCCESS_RATE = 0.4;
/** Minimum uses before a custom instruction can become a suggestion */
const MIN_USAGE_FOR_PROMOTION = 2;
/** Similarity threshold for grouping similar custom instructions */
const INSTRUCTION_SIMILARITY_THRESHOLD = 0.5;

// ── Helpers ────────────────────────────────────────────────────────────

function loadData(): PromptLearningData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw
      ? JSON.parse(raw)
      : { builtInStats: {}, customSuggestions: [], instructionHistory: [] };
  } catch {
    return { builtInStats: {}, customSuggestions: [], instructionHistory: [] };
  }
}

function saveData(data: PromptLearningData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable
  }
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((t) => t.length > 2)
  );
}

function textSimilarity(a: string, b: string): number {
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let overlap = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) overlap++;
  }
  return (2 * overlap) / (tokensA.size + tokensB.size);
}

/**
 * Extract a short label from an instruction string.
 * Takes the first meaningful phrase or clause topic mentioned.
 */
function extractLabel(instruction: string): string {
  // Look for common clause topics
  const topics: [RegExp, string][] = [
    [/\bcam\b/i, "CAM focus"],
    [/\bti\b|tenant\s+improve/i, "TI focus"],
    [/\brent\b.*\bescalat/i, "Rent escalation"],
    [/\bco[\s-]?tenancy/i, "Co-tenancy"],
    [/\bguaranty/i, "Guaranty focus"],
    [/\bassign/i, "Assignment focus"],
    [/\bdefault/i, "Default provisions"],
    [/\binsurance/i, "Insurance review"],
    [/\bcasualty/i, "Casualty review"],
    [/\bexclusive/i, "Exclusive use"],
    [/\bmaintenance/i, "Maintenance"],
    [/\bsignage/i, "Signage rights"],
    [/\bparking/i, "Parking review"],
    [/\bsubordination|snda/i, "SNDA review"],
    [/\bholdover/i, "Holdover terms"],
    [/\bforce\s+majeure/i, "Force majeure"],
    [/\benvironmental|hazardous/i, "Environmental"],
    [/\brelocat/i, "Relocation clause"],
    [/\brenewal|extension/i, "Renewal options"],
    [/\btermination/i, "Termination rights"],
  ];

  for (const [pattern, label] of topics) {
    if (pattern.test(instruction)) return label;
  }

  // Fallback: first 3-4 significant words
  const words = instruction
    .replace(/[^a-zA-Z\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 4);
  if (words.length > 0) {
    return words.join(" ").slice(0, 30);
  }

  return "Custom focus";
}

/**
 * Guess a category from instruction text.
 */
function guessCategory(instruction: string): PromptSuggestion["category"] {
  const lower = instruction.toLowerCase();
  if (/risk|liab|default|casualty|guarantee|guaranty|environmental|hazardous/.test(lower)) return "risk";
  if (/rent|cam|ti|noi|financ|cost|fee|escala|abatement|percentage/.test(lower)) return "financial";
  if (/use|exclusive|maintenance|signage|parking|hours|kitchen|ventilation/.test(lower)) return "operations";
  if (/assign|sublet|insurance|indemnif|subordinat|snda|holdover|force majeure|waiver/.test(lower)) return "legal";
  return "strategy";
}

// ── Hook ───────────────────────────────────────────────────────────────

export function usePromptLearning() {
  const [data, setDataState] = useState<PromptLearningData>(loadData);
  const dataRef = useRef(data);
  dataRef.current = data;

  const persist = useCallback((updated: PromptLearningData) => {
    dataRef.current = updated;
    setDataState(updated);
    saveData(updated);
  }, []);

  /**
   * Get success score for a built-in suggestion (0-1).
   * Used to rank suggestions — higher = more proven.
   */
  const getSuccessScore = useCallback(
    (suggestionId: string): number => {
      const stats = dataRef.current.builtInStats[suggestionId];
      if (!stats || stats.totalRevisions === 0) return 0;
      const acceptRate = stats.acceptedRevisions / stats.totalRevisions;
      // Weight by usage — more data = more confidence
      const usageWeight = Math.min(1, stats.analysisCount / 5);
      return acceptRate * usageWeight;
    },
    []
  );

  /**
   * Get usage count for a built-in suggestion.
   */
  const getUsageCount = useCallback(
    (suggestionId: string): number => {
      return dataRef.current.builtInStats[suggestionId]?.selectCount || 0;
    },
    []
  );

  /**
   * Record that suggestions were selected for an analysis.
   */
  const recordSuggestionSelections = useCallback(
    (selectedIds: string[]) => {
      const updated = { ...dataRef.current };
      updated.builtInStats = { ...updated.builtInStats };
      const now = new Date().toISOString();

      for (const id of selectedIds) {
        const existing = updated.builtInStats[id] || {
          selectCount: 0,
          analysisCount: 0,
          acceptedRevisions: 0,
          totalRevisions: 0,
          lastUsedAt: now,
        };
        updated.builtInStats[id] = {
          ...existing,
          selectCount: existing.selectCount + 1,
          analysisCount: existing.analysisCount + 1,
          lastUsedAt: now,
        };
      }

      persist(updated);
    },
    [persist]
  );

  /**
   * Record custom instruction text for pattern mining.
   */
  const recordCustomInstruction = useCallback(
    (text: string, documentType: DocumentType) => {
      if (!text.trim() || text.trim().length < 20) return;

      const updated = { ...dataRef.current };
      updated.instructionHistory = [
        {
          text: text.trim(),
          documentType,
          timestamp: new Date().toISOString(),
        },
        ...updated.instructionHistory,
      ].slice(0, MAX_HISTORY);

      persist(updated);
    },
    [persist]
  );

  /**
   * Feed back analysis results to update suggestion success scores.
   * Call this when the user finishes reviewing (on reset).
   *
   * @param activeSuggestionIds - IDs of suggestions that were active during this analysis
   * @param totalRevisions - Total number of revisions in the analysis
   * @param acceptedCount - Number of revisions the user accepted
   * @param customInstructionText - Any custom instruction text the user typed
   * @param documentType - The document type analyzed
   */
  const recordAnalysisResults = useCallback(
    (
      activeSuggestionIds: string[],
      totalRevisions: number,
      acceptedCount: number,
      customInstructionText?: string,
      documentType?: DocumentType
    ) => {
      const updated = { ...dataRef.current };
      updated.builtInStats = { ...updated.builtInStats };

      // Update built-in suggestion stats with accept/reject data
      for (const id of activeSuggestionIds) {
        const existing = updated.builtInStats[id];
        if (existing) {
          updated.builtInStats[id] = {
            ...existing,
            acceptedRevisions: existing.acceptedRevisions + acceptedCount,
            totalRevisions: existing.totalRevisions + totalRevisions,
          };
        }
      }

      // Update instruction history with accept rate
      if (customInstructionText && totalRevisions > 0) {
        const acceptRate = acceptedCount / totalRevisions;
        // Find the most recent matching history entry and update it
        updated.instructionHistory = updated.instructionHistory.map((entry) => {
          if (
            entry.acceptRate === undefined &&
            textSimilarity(entry.text, customInstructionText) > 0.8
          ) {
            return { ...entry, acceptRate };
          }
          return entry;
        });
      }

      // Try to mine new custom suggestions from instruction history
      updated.customSuggestions = mineCustomSuggestions(
        updated.instructionHistory,
        updated.customSuggestions,
        documentType
      );

      persist(updated);
    },
    [persist]
  );

  /**
   * Get all custom/learned suggestions.
   */
  const getLearnedSuggestions = useCallback(
    (documentType?: DocumentType): LearnedPromptSuggestion[] => {
      return dataRef.current.customSuggestions
        .filter(
          (s) =>
            !documentType ||
            s.documentTypes.length === 0 ||
            s.documentTypes.includes(documentType)
        )
        .sort((a, b) => b.successScore - a.successScore);
    },
    []
  );

  /**
   * Delete a learned suggestion.
   */
  const deleteLearnedSuggestion = useCallback(
    (id: string) => {
      const updated = { ...dataRef.current };
      updated.customSuggestions = updated.customSuggestions.filter(
        (s) => s.id !== id
      );
      persist(updated);
    },
    [persist]
  );

  /**
   * Manually promote a custom instruction into a learned suggestion.
   */
  const promoteInstruction = useCallback(
    (instruction: string, category: PromptSuggestion["category"], documentType?: DocumentType) => {
      const updated = { ...dataRef.current };
      const id = `learned_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();

      // Check if similar already exists
      const existing = updated.customSuggestions.find(
        (s) => textSimilarity(s.instruction, instruction) > INSTRUCTION_SIMILARITY_THRESHOLD
      );
      if (existing) {
        existing.usageCount++;
        existing.lastUsedAt = now;
        persist(updated);
        return;
      }

      updated.customSuggestions = [
        {
          id,
          label: extractLabel(instruction),
          instruction,
          category,
          usageCount: 1,
          successScore: 0.5, // Start neutral
          documentTypes: documentType ? [documentType] : [],
          createdAt: now,
          lastUsedAt: now,
        },
        ...updated.customSuggestions,
      ].slice(0, MAX_CUSTOM_SUGGESTIONS);

      persist(updated);
    },
    [persist]
  );

  /**
   * Reset all learning data.
   */
  const clearLearning = useCallback(() => {
    const empty: PromptLearningData = {
      builtInStats: {},
      customSuggestions: [],
      instructionHistory: [],
    };
    persist(empty);
  }, [persist]);

  return {
    /** Stats for built-in suggestions */
    builtInStats: data.builtInStats,
    /** Custom/learned suggestions */
    customSuggestions: data.customSuggestions,
    /** Instruction history */
    instructionHistory: data.instructionHistory,
    /** Get success score for a built-in suggestion */
    getSuccessScore,
    /** Get usage count */
    getUsageCount,
    /** Record suggestion selections when analysis is submitted */
    recordSuggestionSelections,
    /** Record custom instruction text */
    recordCustomInstruction,
    /** Feed back analysis results (call on reset) */
    recordAnalysisResults,
    /** Get learned suggestions filtered by document type */
    getLearnedSuggestions,
    /** Delete a learned suggestion */
    deleteLearnedSuggestion,
    /** Manually promote an instruction to a suggestion */
    promoteInstruction,
    /** Clear all learning data */
    clearLearning,
  };
}

// ── Custom Suggestion Mining ───────────────────────────────────────────

/**
 * Mine instruction history for recurring patterns that produce good results.
 * When a user types similar custom instructions across multiple analyses
 * and those analyses have good accept rates, promote to a suggestion.
 */
function mineCustomSuggestions(
  history: InstructionHistoryEntry[],
  existingSuggestions: LearnedPromptSuggestion[],
  documentType?: DocumentType
): LearnedPromptSuggestion[] {
  const updated = [...existingSuggestions];

  // Only look at entries that have accept rate data
  const rated = history.filter(
    (h) => h.acceptRate !== undefined && h.acceptRate >= MIN_SUCCESS_RATE
  );

  // Group similar instructions
  const groups: { entries: InstructionHistoryEntry[]; representative: string }[] = [];

  for (const entry of rated) {
    let matched = false;
    for (const group of groups) {
      if (textSimilarity(entry.text, group.representative) > INSTRUCTION_SIMILARITY_THRESHOLD) {
        group.entries.push(entry);
        matched = true;
        break;
      }
    }
    if (!matched) {
      groups.push({ entries: [entry], representative: entry.text });
    }
  }

  // Promote groups that meet threshold
  for (const group of groups) {
    if (group.entries.length < MIN_USAGE_FOR_PROMOTION) continue;

    const instruction = group.representative;

    // Check if already exists as a custom suggestion
    const existingIdx = updated.findIndex(
      (s) => textSimilarity(s.instruction, instruction) > INSTRUCTION_SIMILARITY_THRESHOLD
    );

    const avgAcceptRate =
      group.entries.reduce((sum, e) => sum + (e.acceptRate || 0), 0) / group.entries.length;

    if (existingIdx >= 0) {
      // Update existing
      updated[existingIdx] = {
        ...updated[existingIdx],
        usageCount: group.entries.length,
        successScore: avgAcceptRate,
        lastUsedAt: group.entries[0].timestamp,
      };
    } else {
      // Create new
      const id = `learned_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const docTypes = [...new Set(group.entries.map((e) => e.documentType))];

      updated.push({
        id,
        label: extractLabel(instruction),
        instruction,
        category: guessCategory(instruction),
        usageCount: group.entries.length,
        successScore: avgAcceptRate,
        documentTypes: docTypes,
        createdAt: group.entries[group.entries.length - 1].timestamp,
        lastUsedAt: group.entries[0].timestamp,
      });
    }
  }

  // Also update success scores for existing custom suggestions
  // by checking if any recent history entries used similar instructions
  for (const suggestion of updated) {
    const matchingEntries = history.filter(
      (h) =>
        h.acceptRate !== undefined &&
        textSimilarity(h.text, suggestion.instruction) > INSTRUCTION_SIMILARITY_THRESHOLD
    );
    if (matchingEntries.length > 0) {
      const avgRate =
        matchingEntries.reduce((sum, e) => sum + (e.acceptRate || 0), 0) /
        matchingEntries.length;
      suggestion.successScore = avgRate;
      suggestion.usageCount = Math.max(suggestion.usageCount, matchingEntries.length);
    }
  }

  return updated.slice(0, MAX_CUSTOM_SUGGESTIONS);
}
