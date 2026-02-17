import { useState, useEffect, useCallback } from "react";
import type {
  UserPreferences,
  ChatMessage,
  RevisionDecision,
  LeaseRedlineResponse,
} from "@/lib/lease-redline/types";

const PREFS_KEY = "lease-redline-preferences";
const HISTORY_KEY = "lease-redline-history";
const MAX_HISTORY_ITEMS = 20;

interface AnalysisHistoryItem {
  id: string;
  title: string;
  documentType: string;
  outputMode: string;
  revisionsCount: number;
  criticalCount: number;
  chatMessageCount: number;
  decisions: RevisionDecision[];
  createdAt: string;
}

/**
 * Local-first memory hook for the lease redline agent.
 * Stores user preferences and analysis history in localStorage.
 * Can be extended to sync with Supabase when authenticated.
 */
export function useLeaseMemory() {
  const [preferences, setPreferencesState] = useState<UserPreferences>(() => {
    try {
      const stored = localStorage.getItem(PREFS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [history, setHistoryState] = useState<AnalysisHistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist preferences to localStorage
  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setPreferencesState((prev) => {
      const next = { ...prev, ...updates, lastUsed: Date.now() };
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch {
        // localStorage full or unavailable
      }
      return next;
    });
  }, []);

  // Save an analysis to history
  const saveToHistory = useCallback(
    (
      response: LeaseRedlineResponse,
      decisions: RevisionDecision[],
      chatMessages: ChatMessage[]
    ) => {
      const item: AnalysisHistoryItem = {
        id: `analysis_${Date.now()}`,
        title: `${response.documentType} analysis`,
        documentType: response.documentType,
        outputMode: response.outputMode,
        revisionsCount: response.revisions.length,
        criticalCount: response.revisions.filter(
          (r) => r.riskLevel === "critical"
        ).length,
        chatMessageCount: chatMessages.length,
        decisions,
        createdAt: new Date().toISOString(),
      };

      setHistoryState((prev) => {
        const next = [item, ...prev].slice(0, MAX_HISTORY_ITEMS);
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        } catch {
          // localStorage full
        }
        return next;
      });

      // Learn from decisions — update preferences based on patterns
      const acceptedCategories = response.revisions
        .filter((_, i) => decisions[i] === "accepted")
        .map((r) => r.category)
        .filter(Boolean);
      const rejectedCategories = response.revisions
        .filter((_, i) => decisions[i] === "rejected")
        .map((r) => r.category)
        .filter(Boolean);

      // If user consistently uses the same doc type, remember it
      const docTypeCounts = new Map<string, number>();
      for (const h of [item, ...history].slice(0, 10)) {
        docTypeCounts.set(
          h.documentType,
          (docTypeCounts.get(h.documentType) || 0) + 1
        );
      }
      const preferredDocTypes = [...docTypeCounts.entries()]
        .filter(([, count]) => count >= 2)
        .map(([type]) => type);

      if (preferredDocTypes.length > 0) {
        updatePreferences({
          preferredDocTypes: preferredDocTypes as UserPreferences["preferredDocTypes"],
        });
      }
    },
    [history, updatePreferences]
  );

  // Get suggestions based on history
  const getContextualSuggestions = useCallback((): string[] => {
    const suggestions: string[] = [];

    if (history.length === 0) {
      suggestions.push("Upload your first lease document to get started");
      return suggestions;
    }

    // Recent analysis patterns
    const recentCritical = history
      .slice(0, 5)
      .reduce((sum, h) => sum + h.criticalCount, 0);
    if (recentCritical > 3) {
      suggestions.push(
        "Your recent documents have had multiple critical issues. Consider requesting more conservative initial terms."
      );
    }

    // If user has been rejecting many revisions
    const recentDecisions = history.slice(0, 3).flatMap((h) => h.decisions);
    const rejectedPct =
      recentDecisions.filter((d) => d === "rejected").length /
      Math.max(recentDecisions.length, 1);
    if (rejectedPct > 0.4) {
      suggestions.push(
        "You've been rejecting many suggested revisions. Consider adjusting the agent's aggressiveness via additional instructions."
      );
    }

    // Chat engagement
    const avgChat =
      history.slice(0, 5).reduce((sum, h) => sum + h.chatMessageCount, 0) /
      Math.min(history.length, 5);
    if (avgChat < 2) {
      suggestions.push(
        "Try using the chat to ask about financial implications of specific clauses."
      );
    }

    return suggestions;
  }, [history]);

  return {
    preferences,
    history,
    updatePreferences,
    saveToHistory,
    getContextualSuggestions,
  };
}
