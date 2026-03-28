"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Database,
  BookOpen,
  Zap,
  Star,
  FlaskConical,
  TrendingUp,
  TrendingDown,
  Trash2,
  Pencil,
  Activity,
  Play,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  Shield,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface LearningStats {
  totalPatterns: number;
  activePatterns: number;
  clauseLibrarySize: number;
  currentPromptVersion: number;
  promptVersionUses: number;
  avgRating: number;
  ratingCount: number;
}

interface ABTest {
  id: string;
  test_name: string;
  control_version_id: string;
  candidate_version_id: string;
  started_at: string;
  control_jobs: number;
  candidate_jobs: number;
  control_avg_rating: number | null;
  candidate_avg_rating: number | null;
}

interface PatternRow {
  id: string;
  pattern_type: string;
  category: string | null;
  description: string;
  confidence: number;
  acceptance_rate: number | null;
  frequency: number;
  is_active?: boolean;
  promoted_to_prompt?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface Modification {
  id: string;
  category: string | null;
  originalRecommendation: string;
  modifiedText: string;
  createdAt: string;
}

interface ActivityItem {
  type: string;
  description: string;
  timestamp: string;
}

interface LearningData {
  stats: LearningStats;
  activeTests: ABTest[];
  topPatterns: PatternRow[];
  pendingPatterns: PatternRow[];
  prunedPatterns: PatternRow[];
  recentModifications: Modification[];
  activityFeed: ActivityItem[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function confidenceColor(c: number): string {
  if (c >= 0.75) return "text-green-700 bg-green-50 border-green-200";
  if (c >= 0.5) return "text-yellow-700 bg-yellow-50 border-yellow-200";
  return "text-gray-600 bg-gray-50 border-gray-200";
}

function patternStatusBadge(p: PatternRow) {
  if (p.promoted_to_prompt) {
    return <Badge className="bg-green-100 text-green-800 border-green-300">Promoted</Badge>;
  }
  if ((p.confidence ?? 0) > 0.75 && (p.frequency ?? 0) > 10) {
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Ready</Badge>;
  }
  return <Badge className="bg-gray-100 text-gray-600 border-gray-300">Learning</Badge>;
}

function activityIcon(type: string) {
  switch (type) {
    case "pattern_promoted":
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    case "pattern_pruned":
      return <Trash2 className="h-4 w-4 text-red-500" />;
    case "pattern_discovered":
      return <Zap className="h-4 w-4 text-blue-600" />;
    case "version_promoted":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "version_candidate":
      return <FlaskConical className="h-4 w-4 text-purple-600" />;
    case "test_started":
      return <Play className="h-4 w-4 text-blue-600" />;
    case "test_ended":
      return <XCircle className="h-4 w-4 text-orange-500" />;
    default:
      return <Activity className="h-4 w-4 text-gray-500" />;
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function LearningDashboardPage() {
  const [data, setData] = useState<LearningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllPatterns, setShowAllPatterns] = useState(false);

  // Action states
  const [aggregating, setAggregating] = useState(false);
  const [aggregateResult, setAggregateResult] = useState<string | null>(null);
  const [evolving, setEvolving] = useState(false);
  const [evolveResult, setEvolveResult] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/learning");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Unauthorized");
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const runAggregation = async () => {
    setAggregating(true);
    setAggregateResult(null);
    try {
      const res = await fetch("/api/learning/aggregate", { method: "POST" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      const d = json.data;
      setAggregateResult(
        `Updated ${d.patternsUpdated} patterns, found ${d.newPatternsFound} new, pruned ${d.patternsPruned}, extracted ${d.bestLanguageExtracted} language patterns, ${d.regionalTrendsFound} regional trends. ${d.totalActivePatterns} active patterns total.`
      );
      fetchData();
    } catch (err) {
      setAggregateResult(`Error: ${err instanceof Error ? err.message : "Failed"}`);
    } finally {
      setAggregating(false);
    }
  };

  const runEvolution = async () => {
    setEvolving(true);
    setEvolveResult(null);
    try {
      const res = await fetch("/api/learning/evolve", { method: "POST" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setEvolveResult(`${json.data.action}: ${json.data.details}`);
      fetchData();
    } catch (err) {
      setEvolveResult(`Error: ${err instanceof Error ? err.message : "Failed"}`);
    } finally {
      setEvolving(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchData} className="bg-blue-600 hover:bg-blue-700 text-white">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stats, activeTests, topPatterns, pendingPatterns, prunedPatterns, recentModifications, activityFeed } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Learning Engine Dashboard</h1>
          </div>
          <p className="text-gray-500">Self-learning system health, patterns, and prompt evolution</p>
        </div>

        {/* ============================================================ */}
        {/* TOP STATS ROW                                                */}
        {/* ============================================================ */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total Patterns
              </CardTitle>
              <Brain className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalPatterns}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Active Patterns
              </CardTitle>
              <Zap className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.activePatterns}</div>
              <p className="text-xs text-gray-400">confidence &gt; 0.7</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Clause Library
              </CardTitle>
              <BookOpen className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.clauseLibrarySize}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Prompt Version
              </CardTitle>
              <Database className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">v{stats.currentPromptVersion}</div>
              <p className="text-xs text-gray-400">{stats.promptVersionUses} uses</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Avg Rating (30d)
              </CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.avgRating > 0 ? `${stats.avgRating}/5` : "N/A"}
              </div>
              <p className="text-xs text-gray-400">{stats.ratingCount} ratings</p>
            </CardContent>
          </Card>
        </div>

        {/* ============================================================ */}
        {/* ACTIVE A/B TESTS                                             */}
        {/* ============================================================ */}
        <Card className="bg-white border-gray-200 shadow-sm mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-purple-600" />
              Active A/B Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeTests.length === 0 ? (
              <p className="text-gray-500 text-sm">No active A/B tests running.</p>
            ) : (
              <div className="space-y-4">
                {activeTests.map((test) => (
                  <div key={test.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">{test.test_name}</h3>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">Running</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-xs text-gray-500 uppercase mb-1">Control</p>
                        <p className="text-sm text-gray-700">{test.control_jobs} jobs</p>
                        <p className="text-sm font-medium text-gray-900">
                          Avg rating: {test.control_avg_rating?.toFixed(2) ?? "N/A"}
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded p-3">
                        <p className="text-xs text-purple-500 uppercase mb-1">Candidate</p>
                        <p className="text-sm text-gray-700">{test.candidate_jobs} jobs</p>
                        <p className="text-sm font-medium text-gray-900">
                          Avg rating: {test.candidate_avg_rating?.toFixed(2) ?? "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min((test.candidate_jobs / 50) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {test.candidate_jobs}/50 candidate jobs needed for evaluation
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ============================================================ */}
        {/* TOP PATTERNS BY CONFIDENCE                                   */}
        {/* ============================================================ */}
        <Card className="bg-white border-gray-200 shadow-sm mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Top Patterns by Confidence
            </CardTitle>
            {topPatterns.length >= 20 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllPatterns(!showAllPatterns)}
                className="text-blue-600 hover:text-blue-700"
              >
                {showAllPatterns ? "Show Top 10" : "Show All 20"}
                {showAllPatterns ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {topPatterns.length === 0 ? (
              <p className="text-gray-500 text-sm">No active patterns yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">Type</th>
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">Category</th>
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">Description</th>
                      <th className="text-center py-2 px-3 text-gray-500 font-medium">Confidence</th>
                      <th className="text-center py-2 px-3 text-gray-500 font-medium">Accept Rate</th>
                      <th className="text-center py-2 px-3 text-gray-500 font-medium">Frequency</th>
                      <th className="text-center py-2 px-3 text-gray-500 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(showAllPatterns ? topPatterns : topPatterns.slice(0, 10)).map((p) => (
                      <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3">
                          <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
                            {p.pattern_type.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-gray-700">{p.category || "-"}</td>
                        <td className="py-2 px-3 text-gray-900 max-w-[300px] truncate">
                          {p.description}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Badge className={`${confidenceColor(p.confidence)} border`}>
                            {(p.confidence * 100).toFixed(0)}%
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-center text-gray-700">
                          {p.acceptance_rate != null ? `${(p.acceptance_rate * 100).toFixed(0)}%` : "-"}
                        </td>
                        <td className="py-2 px-3 text-center text-gray-700">{p.frequency}</td>
                        <td className="py-2 px-3 text-center">{patternStatusBadge(p)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ============================================================ */}
        {/* PATTERNS PENDING PROMOTION                                   */}
        {/* ============================================================ */}
        <Card className="bg-white border-gray-200 shadow-sm mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Patterns Pending Promotion
              {pendingPatterns.length > 0 && (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 ml-2">
                  {pendingPatterns.length}
                </Badge>
              )}
            </CardTitle>
            {pendingPatterns.length > 0 && (
              <Button
                onClick={runEvolution}
                disabled={evolving}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                size="sm"
              >
                {evolving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                Trigger Prompt Evolution Now
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {pendingPatterns.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No patterns ready for promotion (need confidence &gt; 0.75, frequency &gt; 10).
              </p>
            ) : (
              <div className="space-y-2">
                {pendingPatterns.map((p) => (
                  <div key={p.id} className="flex items-center justify-between border border-yellow-100 bg-yellow-50/50 rounded-lg px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.description}</p>
                      <p className="text-xs text-gray-500">
                        {p.pattern_type.replace(/_/g, " ")} | {p.category || "general"} | freq: {p.frequency}
                      </p>
                    </div>
                    <Badge className={`${confidenceColor(p.confidence)} border ml-4`}>
                      {(p.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            {evolveResult && (
              <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm text-purple-800">{evolveResult}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ============================================================ */}
        {/* LOW PERFORMERS (RECENTLY PRUNED)                             */}
        {/* ============================================================ */}
        <Card className="bg-white border-gray-200 shadow-sm mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Low Performers (Recently Pruned)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {prunedPatterns.length === 0 ? (
              <p className="text-gray-500 text-sm">No recently pruned patterns.</p>
            ) : (
              <div className="space-y-2">
                {prunedPatterns.map((p) => (
                  <div key={p.id} className="flex items-center justify-between border border-red-100 bg-red-50/30 rounded-lg px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{p.description}</p>
                      <p className="text-xs text-gray-400">
                        {p.pattern_type.replace(/_/g, " ")} | accept rate: {p.acceptance_rate != null ? `${(p.acceptance_rate * 100).toFixed(0)}%` : "N/A"} | freq: {p.frequency}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 ml-4 whitespace-nowrap">
                      {p.updated_at ? shortDate(p.updated_at) : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ============================================================ */}
        {/* RECENT USER MODIFICATIONS                                    */}
        {/* ============================================================ */}
        <Card className="bg-white border-gray-200 shadow-sm mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Pencil className="h-5 w-5 text-orange-500" />
              Recent User Modifications (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentModifications.length === 0 ? (
              <p className="text-gray-500 text-sm">No user modifications in the last 7 days.</p>
            ) : (
              <div className="space-y-3">
                {recentModifications.map((mod) => (
                  <div key={mod.id} className="border border-orange-100 bg-orange-50/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
                        {mod.category || "general"}
                      </Badge>
                      <span className="text-xs text-gray-400">{shortDate(mod.createdAt)}</span>
                    </div>
                    {mod.originalRecommendation && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-400 mb-1">Original:</p>
                        <p className="text-sm text-gray-500 line-through">{mod.originalRecommendation}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-green-600 mb-1">User&apos;s version:</p>
                      <p className="text-sm text-gray-900 font-medium">{mod.modifiedText}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ============================================================ */}
        {/* LEARNING ACTIVITY FEED                                       */}
        {/* ============================================================ */}
        <Card className="bg-white border-gray-200 shadow-sm mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Learning Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityFeed.length === 0 ? (
              <p className="text-gray-500 text-sm">No learning activity yet.</p>
            ) : (
              <div className="space-y-3">
                {activityFeed.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                    <div className="mt-0.5">{activityIcon(item.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{item.description}</p>
                      <p className="text-xs text-gray-400">{formatDate(item.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ============================================================ */}
        {/* MANUAL CONTROLS                                              */}
        {/* ============================================================ */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Play className="h-5 w-5 text-gray-600" />
              Manual Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Nightly Aggregation</h3>
                <p className="text-sm text-gray-500 mb-3">
                  Recalculate confidence scores, discover new patterns, extract best language, prune low performers.
                </p>
                <Button
                  onClick={runAggregation}
                  disabled={aggregating}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                >
                  {aggregating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4 mr-2" />
                  )}
                  Run Nightly Aggregation Now
                </Button>
                {aggregateResult && (
                  <div className={`mt-3 rounded-lg p-3 text-sm ${aggregateResult.startsWith("Error") ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
                    {aggregateResult}
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Prompt Evolution</h3>
                <p className="text-sm text-gray-500 mb-3">
                  Evaluate A/B tests, promote high-confidence patterns to prompt, start new candidate tests.
                </p>
                <Button
                  onClick={runEvolution}
                  disabled={evolving}
                  className="bg-purple-600 hover:bg-purple-700 text-white w-full"
                >
                  {evolving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FlaskConical className="h-4 w-4 mr-2" />
                  )}
                  Run Prompt Evolution Now
                </Button>
                {evolveResult && (
                  <div className={`mt-3 rounded-lg p-3 text-sm ${evolveResult.startsWith("Error") ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
                    {evolveResult}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
