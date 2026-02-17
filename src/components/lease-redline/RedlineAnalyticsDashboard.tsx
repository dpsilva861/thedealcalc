/**
 * RedlineAnalyticsDashboard — Shows time tracking metrics and ROI.
 *
 * Displays: total analyses, average times by phase, time saved vs manual,
 * decisions per minute, breakdown by document type, and recent sessions.
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  TrendingUp,
  Zap,
  BarChart3,
  Timer,
  X,
  Trash2,
} from "lucide-react";
import type { AnalyticsMetrics, TimerPhase } from "@/lib/lease-redline/types";
import { DOCUMENT_TYPE_LABELS } from "@/lib/lease-redline/types";

interface Props {
  getAnalytics: () => AnalyticsMetrics;
  currentPhase: TimerPhase | null;
  getElapsedMs: () => number;
  getSessionElapsedMs: () => number;
  onClearHistory: () => void;
  onClose: () => void;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainSec = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainSec}s`;
  const hours = Math.floor(minutes / 60);
  const remainMin = minutes % 60;
  return `${hours}h ${remainMin}m`;
}

function formatHours(ms: number): string {
  const hours = ms / (1000 * 60 * 60);
  if (hours < 1) return `${Math.round(ms / (1000 * 60))} min`;
  return `${Math.round(hours * 10) / 10} hrs`;
}

const PHASE_LABELS: Record<TimerPhase, string> = {
  upload: "Document Upload",
  ai_analysis: "AI Analysis",
  human_review: "Human Review",
  export: "Export & Share",
};

export function RedlineAnalyticsDashboard({
  getAnalytics,
  currentPhase,
  getElapsedMs,
  getSessionElapsedMs,
  onClearHistory,
  onClose,
}: Props) {
  const [analytics, setAnalytics] = useState<AnalyticsMetrics>(getAnalytics);
  const [liveElapsed, setLiveElapsed] = useState(0);
  const [liveSessionElapsed, setLiveSessionElapsed] = useState(0);

  // Refresh analytics on mount
  useEffect(() => {
    setAnalytics(getAnalytics());
  }, [getAnalytics]);

  // Live timer tick
  useEffect(() => {
    if (!currentPhase) return;
    const interval = setInterval(() => {
      setLiveElapsed(getElapsedMs());
      setLiveSessionElapsed(getSessionElapsedMs());
    }, 500);
    return () => clearInterval(interval);
  }, [currentPhase, getElapsedMs, getSessionElapsedMs]);

  const timeSavedPct =
    analytics.estimatedManualTimeMs > 0
      ? Math.round(
          (analytics.totalTimeSavedMs / analytics.estimatedManualTimeMs) * 100
        )
      : 0;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Redline Analytics
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Live Timer (if active) */}
        {currentPhase && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm font-medium">
                Active: {PHASE_LABELS[currentPhase]}
              </span>
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Phase: </span>
                <span className="font-mono font-bold">
                  {formatDuration(liveElapsed)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Session: </span>
                <span className="font-mono font-bold">
                  {formatDuration(liveSessionElapsed)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {analytics.totalAnalyses > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <div className="text-2xl font-bold text-foreground">
                  {analytics.totalAnalyses}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total Analyses
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <div className="text-2xl font-bold text-foreground">
                  {formatDuration(analytics.avgTotalTimeMs)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Avg Turnaround
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <div className="text-2xl font-bold text-foreground">
                  {analytics.avgDecisionsPerMinute}
                </div>
                <div className="text-xs text-muted-foreground">
                  Decisions/Min
                </div>
              </div>
              <div className="p-3 rounded-lg bg-green-50 text-center border border-green-200">
                <div className="text-2xl font-bold text-green-700">
                  {formatHours(analytics.totalTimeSavedMs)}
                </div>
                <div className="text-xs text-green-600">Time Saved</div>
              </div>
            </div>

            {/* Time Savings Breakdown */}
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-semibold">Time Savings</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Estimated manual time
                  </span>
                  <span className="font-mono">
                    {formatHours(analytics.estimatedManualTimeMs)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Actual time with AI
                  </span>
                  <span className="font-mono">
                    {formatHours(
                      analytics.estimatedManualTimeMs -
                        analytics.totalTimeSavedMs
                    )}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, timeSavedPct)}%` }}
                  />
                </div>
                <div className="text-center text-sm font-semibold text-green-600">
                  {timeSavedPct}% faster with AI
                </div>
              </div>
            </div>

            {/* Phase Breakdown */}
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">
                  Average Time by Phase
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">AI Analysis</span>
                  <span className="font-mono">
                    {formatDuration(analytics.avgAiTimeMs)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Human Review</span>
                  <span className="font-mono">
                    {formatDuration(analytics.avgHumanReviewTimeMs)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium border-t pt-2">
                  <span>Total Average</span>
                  <span className="font-mono">
                    {formatDuration(analytics.avgTotalTimeMs)}
                  </span>
                </div>
              </div>
            </div>

            {/* By Document Type */}
            {Object.keys(analytics.byDocumentType).length > 0 && (
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">By Document Type</span>
                </div>
                <div className="space-y-2">
                  {Object.entries(analytics.byDocumentType).map(
                    ([docType, data]) => (
                      <div
                        key={docType}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {(DOCUMENT_TYPE_LABELS as Record<string, string>)[docType] ||
                            docType}
                        </span>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="text-xs">
                            {data.count}x
                          </Badge>
                          <span className="font-mono text-xs">
                            avg {formatDuration(data.avgTimeMs)}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Recent Sessions */}
            {analytics.recentSessions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Recent Sessions</h4>
                <div className="max-h-48 overflow-auto rounded border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs text-right">
                          Revisions
                        </TableHead>
                        <TableHead className="text-xs text-right">
                          Time
                        </TableHead>
                        <TableHead className="text-xs text-right">
                          Dec/Min
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.recentSessions.slice(0, 10).map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="text-xs">
                            {new Date(s.startedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs">
                            {(DOCUMENT_TYPE_LABELS as Record<string, string>)[
                              s.documentType
                            ] || s.documentType}
                          </TableCell>
                          <TableCell className="text-xs text-right">
                            {s.revisionCount || 0}
                          </TableCell>
                          <TableCell className="text-xs text-right font-mono">
                            {formatDuration(s.totalDurationMs || 0)}
                          </TableCell>
                          <TableCell className="text-xs text-right font-mono">
                            {s.decisionsPerMinute || "–"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearHistory}
                className="text-xs text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear History
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No completed sessions yet.</p>
            <p className="text-xs mt-1">
              Analytics will appear after your first redline analysis.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
