import { useState, useEffect, useCallback, useRef } from "react";
import {
  getLearnedRules,
  recordSignal,
  recordSignalBatch,
  buildDecisionSignals,
  detectChatCorrection,
  formatRulesForPrompt,
  decayStaleRules,
  clearAllLearning,
  removeRule,
  type LearnedRule,
  type FeedbackSignal,
} from "@/lib/lease-redline/learning-engine";
import type {
  LeaseRedlineResponse,
  RevisionDecision,
  ChatMessage,
} from "@/lib/lease-redline/types";

/**
 * Hook that connects the learning engine to the lease redline workflow.
 *
 * Responsibilities:
 * - Decay stale rules on mount
 * - Expose learned rules for prompt injection
 * - Capture decision signals when user accepts/rejects revisions
 * - Detect chat correction signals
 * - Provide rule management (view, remove, clear)
 */
export function useLeaseLearning() {
  const [rules, setRules] = useState<LearnedRule[]>(() => getLearnedRules());
  const lastSyncedDecisions = useRef<string>("");

  // Decay stale rules on mount
  useEffect(() => {
    decayStaleRules();
    setRules(getLearnedRules());
  }, []);

  /**
   * Get the formatted rules string to inject into the system prompt.
   */
  const getRulesForPrompt = useCallback((): string => {
    return formatRulesForPrompt(0.4);
  }, []);

  /**
   * Process revision decisions and feed them into the learning engine.
   * Call this when the user saves/finishes an analysis session.
   */
  const learnFromDecisions = useCallback(
    (response: LeaseRedlineResponse, decisions: RevisionDecision[]) => {
      // Avoid re-processing the same decisions
      const key = decisions.join(",");
      if (key === lastSyncedDecisions.current) return;
      lastSyncedDecisions.current = key;

      const signals = buildDecisionSignals(
        response.revisions.map((r) => ({
          category: r.category,
          clauseNumber: r.clauseNumber,
          riskLevel: r.riskLevel,
          reason: r.reason,
        })),
        decisions
      );

      if (signals.length > 0) {
        recordSignalBatch(signals);
        setRules(getLearnedRules());
      }
    },
    []
  );

  /**
   * Check a chat message for correction signals and record them.
   * Returns true if a correction was detected.
   */
  const learnFromChat = useCallback(
    (userMessage: string, previousAssistantMessage?: string): boolean => {
      const signal = detectChatCorrection(userMessage, previousAssistantMessage);
      if (!signal) return false;

      recordSignal(signal);
      setRules(getLearnedRules());
      return true;
    },
    []
  );

  /**
   * Record a single manual feedback signal.
   */
  const recordFeedback = useCallback((signal: FeedbackSignal) => {
    recordSignal(signal);
    setRules(getLearnedRules());
  }, []);

  /**
   * Remove a specific rule.
   */
  const deleteRule = useCallback((ruleId: string) => {
    removeRule(ruleId);
    setRules(getLearnedRules());
  }, []);

  /**
   * Clear all learned data.
   */
  const resetLearning = useCallback(() => {
    clearAllLearning();
    setRules([]);
    lastSyncedDecisions.current = "";
  }, []);

  return {
    rules,
    getRulesForPrompt,
    learnFromDecisions,
    learnFromChat,
    recordFeedback,
    deleteRule,
    resetLearning,
  };
}
