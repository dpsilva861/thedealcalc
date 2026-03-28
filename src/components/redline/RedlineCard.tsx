"use client";

import { useState } from "react";
import { Check, X, Pencil, ChevronDown, BarChart3 } from "lucide-react";
import type { RedlineItem } from "@/types";

interface RedlineCardProps {
  item: RedlineItem;
  jobId: string;
  onFeedback?: (itemIndex: number, action: string, modifiedText?: string) => void;
}

const severityConfig = {
  critical: {
    label: "Critical",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-400",
    dot: "bg-red-400",
    langBg: "bg-red-500/5",
  },
  major: {
    label: "Major",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    text: "text-orange-400",
    dot: "bg-orange-400",
    langBg: "bg-orange-500/5",
  },
  minor: {
    label: "Minor",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    text: "text-yellow-400",
    dot: "bg-yellow-400",
    langBg: "bg-yellow-500/5",
  },
  informational: {
    label: "Info",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
    dot: "bg-blue-400",
    langBg: "bg-blue-500/5",
  },
} as const;

export function RedlineCard({ item, jobId, onFeedback }: RedlineCardProps) {
  const [feedbackGiven, setFeedbackGiven] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [modifiedText, setModifiedText] = useState(item.suggested_language);
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const sev = severityConfig[item.severity];

  const submitFeedback = async (action: string, text?: string) => {
    setSubmitting(true);
    try {
      await fetch("/api/feedback/item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          itemIndex: item.id,
          action,
          modifiedText: text || null,
        }),
      });
      setFeedbackGiven(action);
      if (onFeedback) onFeedback(item.id, action, text);
    } catch {
      // Silently fail for feedback
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-white/[0.1] transition-colors">
      {/* Header */}
      <button
        className="w-full flex items-start gap-3 p-5 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${sev.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={`text-xs px-2 py-0.5 rounded-full ${sev.bg} ${sev.border} border ${sev.text} font-medium`}>
              {sev.label}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/[0.06] text-slate-400">
              {item.category}
            </span>
            {item.section && (
              <span className="text-xs text-slate-600">{item.section}</span>
            )}
          </div>
          <p className="text-sm text-white font-medium leading-relaxed">{item.issue}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/[0.04] pt-4">
          {/* Original text */}
          {item.original_text && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1.5">Original Text</p>
              <div className="p-3 rounded-lg bg-black/20 border-l-2 border-slate-600">
                <p className="text-sm text-slate-400 italic leading-relaxed">
                  &ldquo;{item.original_text}&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* Recommendation */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1.5">Recommendation</p>
            <p className="text-sm text-slate-300 leading-relaxed">{item.recommendation}</p>
          </div>

          {/* Suggested language */}
          {item.suggested_language && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1.5">Suggested Language</p>
              <div className={`p-3 rounded-lg border-l-2 ${sev.border} ${sev.langBg}`}>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {item.suggested_language}
                </p>
              </div>
            </div>
          )}

          {/* Strategy */}
          {item.strategy && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1.5">Strategy Context</p>
              <p className="text-sm text-slate-400 leading-relaxed">{item.strategy}</p>
            </div>
          )}

          {/* Market benchmark */}
          {item.market_benchmark && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-electric/5 border border-electric/10">
              <BarChart3 className="w-4 h-4 text-electric flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400">
                <span className="text-electric font-medium">Market Benchmark:</span>{" "}
                {item.market_benchmark}
              </p>
            </div>
          )}

          {/* Modify editor */}
          {isEditing && (
            <div className="space-y-2">
              <textarea
                value={modifiedText}
                onChange={(e) => setModifiedText(e.target.value)}
                className="w-full h-24 px-3 py-2 rounded-lg bg-black/20 border border-white/[0.06] text-sm text-slate-300 resize-none focus:outline-none focus:border-electric/30 focus:ring-1 focus:ring-electric/20"
                placeholder="Edit the suggested language..."
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    submitFeedback("modified", modifiedText);
                    setIsEditing(false);
                  }}
                  disabled={submitting}
                  className="px-3 py-1.5 bg-electric hover:bg-electric-hover text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!feedbackGiven && !isEditing && (
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => submitFeedback("accepted")}
                disabled={submitting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-medium transition-colors disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                Accept
              </button>
              <button
                onClick={() => submitFeedback("rejected")}
                disabled={submitting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-medium transition-colors disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
                Reject
              </button>
              <button
                onClick={() => setIsEditing(true)}
                disabled={submitting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/[0.06] text-slate-400 text-xs font-medium transition-colors disabled:opacity-50"
              >
                <Pencil className="w-3.5 h-3.5" />
                Modify
              </button>
            </div>
          )}

          {/* Feedback given confirmation */}
          {feedbackGiven && (
            <div className="flex items-center gap-2 pt-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                feedbackGiven === "accepted"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : feedbackGiven === "rejected"
                  ? "bg-red-500/10 text-red-400"
                  : "bg-electric/10 text-electric"
              }`}>
                {feedbackGiven === "accepted" && <><Check className="w-3.5 h-3.5" /> Accepted</>}
                {feedbackGiven === "rejected" && <><X className="w-3.5 h-3.5" /> Rejected</>}
                {feedbackGiven === "modified" && <><Pencil className="w-3.5 h-3.5" /> Modified</>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
