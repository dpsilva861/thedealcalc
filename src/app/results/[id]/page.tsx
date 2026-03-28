"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Download,
  FileText,
  AlertTriangle,
  Shield,
  ChevronDown,
  ArrowLeft,
  Target,
  CircleAlert,
} from "lucide-react";
import { DealScoreGauge } from "@/components/redline/DealScoreGauge";
import { RedlineCard } from "@/components/redline/RedlineCard";
import { FeedbackWidget } from "@/components/redline/FeedbackWidget";
import type { RedlineJob, RedlineResult } from "@/types";

const riskConfig = {
  critical: { label: "Critical", bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400" },
  high: { label: "High", bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400" },
  medium: { label: "Medium", bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400" },
  low: { label: "Low", bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
} as const;

const importanceConfig = {
  critical: { label: "Critical", text: "text-red-400", bg: "bg-red-500/10" },
  recommended: { label: "Recommended", text: "text-yellow-400", bg: "bg-yellow-500/10" },
  "nice-to-have": { label: "Nice to Have", text: "text-blue-400", bg: "bg-blue-500/10" },
} as const;

type ImportanceKey = keyof typeof importanceConfig;

export default function ResultsPage() {
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<RedlineJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSeverity, setActiveSeverity] = useState<string | null>(null);
  const [expandedMissing, setExpandedMissing] = useState<number | null>(null);

  useEffect(() => {
    async function loadJob() {
      try {
        const res = await fetch(`/api/results/${jobId}`);
        const data = await res.json();
        if (data.success) {
          setJob(data.data);
        } else {
          setError(data.error || "Failed to load results");
        }
      } catch {
        setError("Failed to load results. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    if (jobId) loadJob();
  }, [jobId]);

  const result: RedlineResult | null = job?.output_json || null;

  const categories = useMemo(() => {
    if (!result?.redlines) return ["All"];
    const cats = new Set(result.redlines.map((r) => r.category));
    return ["All", ...Array.from(cats).sort()];
  }, [result]);

  const filteredRedlines = useMemo(() => {
    if (!result?.redlines) return [];
    return result.redlines.filter((item) => {
      if (activeCategory !== "All" && item.category !== activeCategory) return false;
      if (activeSeverity && item.severity !== activeSeverity) return false;
      return true;
    });
  }, [result, activeCategory, activeSeverity]);

  const severityCounts = useMemo(() => {
    if (!result?.redlines) return { critical: 0, major: 0, minor: 0, informational: 0 };
    const counts: Record<string, number> = { critical: 0, major: 0, minor: 0, informational: 0 };
    result.redlines.forEach((item) => {
      counts[item.severity] = (counts[item.severity] || 0) + 1;
    });
    return counts;
  }, [result]);

  const handleDownload = (dataUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-electric border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <CircleAlert className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Unable to Load Results</h2>
          <p className="text-sm text-slate-400 mb-6">{error || "Results not found."}</p>
          <Link
            href="/redline"
            className="inline-flex items-center gap-2 px-4 py-2 bg-electric hover:bg-electric-hover text-white text-sm font-medium rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Upload New LOI
          </Link>
        </div>
      </div>
    );
  }

  const risk = riskConfig[result.summary.risk_level];

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/redline"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Upload Another LOI
        </Link>

        {/* ============== DEAL OVERVIEW ============== */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 sm:p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            <DealScoreGauge score={result.summary.deal_score} />
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <span className={`text-xs px-2.5 py-1 rounded-full ${risk.bg} ${risk.border} border ${risk.text} font-medium`}>
                  {risk.label} Risk
                </span>
                {result.summary.deal_type && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/[0.06] text-slate-400">
                    {result.summary.deal_type}
                  </span>
                )}
                {result.summary.property_type && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/[0.06] text-slate-400">
                    {result.summary.property_type}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-2xl font-bold text-white">{result.redlines.length}</p>
                  <p className="text-xs text-slate-500">Redline Items</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-400">{severityCounts.critical}</p>
                  <p className="text-xs text-slate-500">Critical</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-400">{severityCounts.major}</p>
                  <p className="text-xs text-slate-500">Major</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-400">{result.missing_provisions.length}</p>
                  <p className="text-xs text-slate-500">Missing Provisions</p>
                </div>
              </div>
            </div>
          </div>

          {result.summary.key_concerns.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/[0.04]">
              <p className="text-xs font-medium text-slate-500 mb-2">Key Concerns</p>
              <div className="flex flex-wrap gap-2">
                {result.summary.key_concerns.map((concern, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-red-500/5 border border-red-500/10 text-red-300">
                    {concern}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.summary.strengths.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500 mb-2">Strengths</p>
              <div className="flex flex-wrap gap-2">
                {result.summary.strengths.map((strength, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-300">
                    {strength}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ============== DOWNLOAD BUTTONS ============== */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {job?.output_docx_url && (
            <button
              onClick={() => handleDownload(job.output_docx_url!, `redline-${jobId}.docx`)}
              className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-electric/20 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-electric/10 border border-electric/20 flex items-center justify-center group-hover:bg-electric/15 transition-colors">
                <FileText className="w-5 h-5 text-electric" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">Download Redlined DOCX</p>
                <p className="text-xs text-slate-500">Full analysis with tracked changes</p>
              </div>
              <Download className="w-4 h-4 text-slate-500 ml-auto" />
            </button>
          )}
          {job?.output_pdf_url && (
            <button
              onClick={() => handleDownload(job.output_pdf_url!, `summary-${jobId}.html`)}
              className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-electric/20 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-electric/10 border border-electric/20 flex items-center justify-center group-hover:bg-electric/15 transition-colors">
                <FileText className="w-5 h-5 text-electric" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">Download PDF Summary</p>
                <p className="text-xs text-slate-500">Executive summary with deal score</p>
              </div>
              <Download className="w-4 h-4 text-slate-500 ml-auto" />
            </button>
          )}
        </div>

        {/* ============== REDLINE ITEMS ============== */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-electric" />
              Redline Items
            </h2>
            <span className="text-sm text-slate-500">
              {filteredRedlines.length} of {result.redlines.length}
            </span>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-electric text-white"
                    : "bg-white/5 text-slate-400 hover:text-slate-300 hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Severity filters */}
          <div className="flex gap-2 mb-6">
            {(["critical", "major", "minor", "informational"] as const).map((sev) => {
              const count = severityCounts[sev] || 0;
              const isActive = activeSeverity === sev;
              const colors = {
                critical: { active: "bg-red-500/20 text-red-400 border-red-500/30", dot: "bg-red-400" },
                major: { active: "bg-orange-500/20 text-orange-400 border-orange-500/30", dot: "bg-orange-400" },
                minor: { active: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", dot: "bg-yellow-400" },
                informational: { active: "bg-blue-500/20 text-blue-400 border-blue-500/30", dot: "bg-blue-400" },
              };
              return (
                <button
                  key={sev}
                  onClick={() => setActiveSeverity(isActive ? null : sev)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                    isActive
                      ? colors[sev].active
                      : "bg-white/5 text-slate-500 hover:text-slate-400 border-transparent"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${colors[sev].dot}`} />
                  {sev.charAt(0).toUpperCase() + sev.slice(1)}
                  <span className="opacity-60">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Cards */}
          <div className="space-y-3">
            {filteredRedlines.map((item) => (
              <RedlineCard key={item.id} item={item} jobId={jobId} />
            ))}
            {filteredRedlines.length === 0 && (
              <div className="text-center py-12 text-sm text-slate-500">
                No items match the current filters.
              </div>
            )}
          </div>
        </div>

        {/* ============== MISSING PROVISIONS ============== */}
        {result.missing_provisions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-electric" />
              Missing Provisions
            </h2>
            <div className="space-y-2">
              {result.missing_provisions.map((prov, i) => {
                const imp = importanceConfig[prov.importance as ImportanceKey] || importanceConfig.recommended;
                const isExpanded = expandedMissing === i;
                return (
                  <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
                    <button
                      className="w-full flex items-center gap-3 p-4 text-left"
                      onClick={() => setExpandedMissing(isExpanded ? null : i)}
                    >
                      <span className={`text-xs px-2 py-0.5 rounded-full ${imp.bg} ${imp.text} font-medium flex-shrink-0`}>
                        {imp.label}
                      </span>
                      <span className="text-sm font-medium text-white flex-1">{prov.provision}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-white/[0.04] pt-3">
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">Why It Matters</p>
                          <p className="text-sm text-slate-400 leading-relaxed">{prov.rationale}</p>
                        </div>
                        {prov.suggested_language && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">Suggested Language</p>
                            <div className="p-3 rounded-lg bg-electric/5 border border-electric/10">
                              <p className="text-sm text-slate-200 leading-relaxed">{prov.suggested_language}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============== NEGOTIATION STRATEGY ============== */}
        {result.negotiation_strategy && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-electric" />
              Negotiation Strategy
            </h2>
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 space-y-6">
              <div>
                <p className="text-xs font-medium text-electric mb-2">Opening Position</p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {result.negotiation_strategy.opening_position}
                </p>
              </div>

              {result.negotiation_strategy.concession_priorities.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-electric mb-2">Concession Priorities</p>
                  <ol className="space-y-2">
                    {result.negotiation_strategy.concession_priorities.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-xs font-bold text-slate-600 mt-0.5 w-5 flex-shrink-0">
                          {i + 1}.
                        </span>
                        <p className="text-sm text-slate-400 leading-relaxed">{item}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {result.negotiation_strategy.hard_lines.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-red-400 mb-2">Hard Lines</p>
                  <ul className="space-y-2">
                    {result.negotiation_strategy.hard_lines.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                        <p className="text-sm text-red-300/80 leading-relaxed">{item}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.negotiation_strategy.overall_approach && (
                <div className="pt-4 border-t border-white/[0.04]">
                  <p className="text-xs font-medium text-electric mb-2">Overall Approach</p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {result.negotiation_strategy.overall_approach}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============== FEEDBACK ============== */}
        <FeedbackWidget jobId={jobId} />
      </div>
    </div>
  );
}
