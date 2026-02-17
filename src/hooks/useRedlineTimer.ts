/**
 * useRedlineTimer — Tracks time spent on each phase of the redlining workflow.
 *
 * Phases: upload → ai_analysis → human_review → export
 * Persists completed sessions to localStorage for analytics.
 */

import { useState, useCallback, useRef } from "react";
import type {
  TimerPhase,
  TimerPhaseDuration,
  TimerSession,
  AnalyticsMetrics,
  DocumentType,
} from "@/lib/lease-redline/types";

const STORAGE_KEY = "lease-redline-timer-sessions";
const MAX_SESSIONS = 100;

// Estimated manual time per revision in ms (industry average: ~8 min per clause for attorney review)
const MANUAL_MS_PER_REVISION = 8 * 60 * 1000;

function loadSessions(): TimerSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: TimerSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
  } catch {
    /* storage full — silently ignore */
  }
}

export function useRedlineTimer() {
  const [phases, setPhases] = useState<TimerPhaseDuration[]>([]);
  const [currentPhase, setCurrentPhase] = useState<TimerPhase | null>(null);
  const sessionStartRef = useRef<number | null>(null);
  const analysisIdRef = useRef<string>("");
  const docTypeRef = useRef<DocumentType>("lease");

  /** Start a brand new timer session (e.g. when user begins uploading a document) */
  const startSession = useCallback((analysisId: string, documentType: DocumentType) => {
    analysisIdRef.current = analysisId;
    docTypeRef.current = documentType;
    sessionStartRef.current = Date.now();
    setPhases([]);
    setCurrentPhase(null);
  }, []);

  /** Begin a specific phase. Automatically ends the previous phase. */
  const startPhase = useCallback((phase: TimerPhase) => {
    const now = Date.now();
    setPhases((prev) => {
      const updated = prev.map((p) => {
        if (!p.endedAt) {
          return { ...p, endedAt: now, durationMs: now - p.startedAt };
        }
        return p;
      });
      updated.push({ phase, startedAt: now });
      return updated;
    });
    setCurrentPhase(phase);
  }, []);

  /** End the current phase without starting a new one */
  const endPhase = useCallback(() => {
    const now = Date.now();
    setPhases((prev) =>
      prev.map((p) => {
        if (!p.endedAt) {
          return { ...p, endedAt: now, durationMs: now - p.startedAt };
        }
        return p;
      })
    );
    setCurrentPhase(null);
  }, []);

  /** Complete the session and persist it for analytics */
  const completeSession = useCallback((revisionCount: number) => {
    const now = Date.now();

    // Close any open phase
    const finalPhases = phases.map((p) => {
      if (!p.endedAt) {
        return { ...p, endedAt: now, durationMs: now - p.startedAt };
      }
      return p;
    });

    const totalDurationMs = sessionStartRef.current
      ? now - sessionStartRef.current
      : finalPhases.reduce((sum, p) => sum + (p.durationMs || 0), 0);

    const humanReview = finalPhases.find((p) => p.phase === "human_review");
    const humanMs = humanReview?.durationMs || 0;
    const decisionsPerMinute =
      humanMs > 0 && revisionCount > 0
        ? (revisionCount / humanMs) * 60000
        : 0;

    const session: TimerSession = {
      id: `timer_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      analysisId: analysisIdRef.current,
      documentType: docTypeRef.current,
      phases: finalPhases,
      totalDurationMs,
      revisionCount,
      decisionsPerMinute: Math.round(decisionsPerMinute * 10) / 10,
      startedAt: sessionStartRef.current
        ? new Date(sessionStartRef.current).toISOString()
        : new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    const existing = loadSessions();
    saveSessions([session, ...existing]);
    setPhases(finalPhases);
    setCurrentPhase(null);

    return session;
  }, [phases]);

  /** Get the elapsed time for the current phase in ms */
  const getElapsedMs = useCallback((): number => {
    const openPhase = phases.find((p) => !p.endedAt);
    if (!openPhase) return 0;
    return Date.now() - openPhase.startedAt;
  }, [phases]);

  /** Get total session elapsed time in ms */
  const getSessionElapsedMs = useCallback((): number => {
    if (!sessionStartRef.current) return 0;
    return Date.now() - sessionStartRef.current;
  }, []);

  /** Build aggregate analytics from all completed sessions */
  const getAnalytics = useCallback((): AnalyticsMetrics => {
    const sessions = loadSessions();
    const completed = sessions.filter((s) => s.completedAt);

    if (completed.length === 0) {
      return {
        totalAnalyses: 0,
        avgTotalTimeMs: 0,
        avgAiTimeMs: 0,
        avgHumanReviewTimeMs: 0,
        avgDecisionsPerMinute: 0,
        estimatedManualTimeMs: 0,
        totalTimeSavedMs: 0,
        byDocumentType: {},
        recentSessions: [],
      };
    }

    const avgTotal =
      completed.reduce((s, c) => s + (c.totalDurationMs || 0), 0) / completed.length;

    const aiPhases = completed.flatMap((s) =>
      s.phases.filter((p) => p.phase === "ai_analysis" && p.durationMs)
    );
    const avgAi =
      aiPhases.length > 0
        ? aiPhases.reduce((s, p) => s + (p.durationMs || 0), 0) / aiPhases.length
        : 0;

    const reviewPhases = completed.flatMap((s) =>
      s.phases.filter((p) => p.phase === "human_review" && p.durationMs)
    );
    const avgReview =
      reviewPhases.length > 0
        ? reviewPhases.reduce((s, p) => s + (p.durationMs || 0), 0) / reviewPhases.length
        : 0;

    const dpms = completed.filter((s) => s.decisionsPerMinute && s.decisionsPerMinute > 0);
    const avgDpm =
      dpms.length > 0
        ? dpms.reduce((s, c) => s + (c.decisionsPerMinute || 0), 0) / dpms.length
        : 0;

    const totalRevisions = completed.reduce((s, c) => s + (c.revisionCount || 0), 0);
    const estimatedManualTimeMs = totalRevisions * MANUAL_MS_PER_REVISION;
    const actualTotalMs = completed.reduce((s, c) => s + (c.totalDurationMs || 0), 0);
    const totalTimeSavedMs = Math.max(0, estimatedManualTimeMs - actualTotalMs);

    // Aggregate by document type
    const byDocumentType: Record<string, { count: number; avgTimeMs: number }> = {};
    for (const session of completed) {
      const dt = session.documentType;
      if (!byDocumentType[dt]) {
        byDocumentType[dt] = { count: 0, avgTimeMs: 0 };
      }
      byDocumentType[dt].count++;
      byDocumentType[dt].avgTimeMs += session.totalDurationMs || 0;
    }
    for (const dt of Object.keys(byDocumentType)) {
      byDocumentType[dt].avgTimeMs = Math.round(
        byDocumentType[dt].avgTimeMs / byDocumentType[dt].count
      );
    }

    return {
      totalAnalyses: completed.length,
      avgTotalTimeMs: Math.round(avgTotal),
      avgAiTimeMs: Math.round(avgAi),
      avgHumanReviewTimeMs: Math.round(avgReview),
      avgDecisionsPerMinute: Math.round(avgDpm * 10) / 10,
      estimatedManualTimeMs,
      totalTimeSavedMs,
      byDocumentType,
      recentSessions: completed.slice(0, 20),
    };
  }, []);

  /** Clear all timer history */
  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return {
    phases,
    currentPhase,
    startSession,
    startPhase,
    endPhase,
    completeSession,
    getElapsedMs,
    getSessionElapsedMs,
    getAnalytics,
    clearHistory,
  };
}
