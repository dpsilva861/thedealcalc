"use client";

import { useState } from "react";
import { Star, ThumbsUp, ThumbsDown } from "lucide-react";

interface FeedbackWidgetProps {
  jobId: string;
  userId?: string;
}

export function FeedbackWidget({ jobId, userId }: FeedbackWidgetProps) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);

    try {
      await fetch("/api/feedback/job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          userId: userId || null,
          rating,
          feedbackText: feedbackText || null,
          wouldRecommend,
        }),
      });
      setSubmitted(true);
    } catch {
      // Silently fail
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <ThumbsUp className="w-6 h-6 text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Thank You!</h3>
        <p className="text-sm text-slate-400">
          Your feedback helps RedlineIQ get smarter with every analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 space-y-6">
      <h3 className="text-base font-semibold text-white">Rate This Analysis</h3>

      {/* Star Rating */}
      <div>
        <p className="text-sm text-slate-400 mb-3">How helpful was this redline analysis?</p>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              className="p-1 transition-transform hover:scale-110"
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            >
              <Star
                className={`w-7 h-7 transition-colors ${
                  star <= (hoveredStar || rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-slate-600"
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="text-sm text-slate-500 ml-2">
              {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
            </span>
          )}
        </div>
      </div>

      {/* Would Recommend */}
      <div>
        <p className="text-sm text-slate-400 mb-3">Would you recommend RedlineIQ?</p>
        <div className="flex gap-3">
          <button
            onClick={() => setWouldRecommend(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              wouldRecommend === true
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-white/5 border-white/[0.06] text-slate-400 hover:text-slate-300"
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            Yes
          </button>
          <button
            onClick={() => setWouldRecommend(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              wouldRecommend === false
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : "bg-white/5 border-white/[0.06] text-slate-400 hover:text-slate-300"
            }`}
          >
            <ThumbsDown className="w-4 h-4" />
            No
          </button>
        </div>
      </div>

      {/* Text Feedback */}
      <div>
        <p className="text-sm text-slate-400 mb-2">Anything else? (optional)</p>
        <textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="Tell us what we could improve..."
          className="w-full h-20 px-3 py-2 rounded-xl bg-black/20 border border-white/[0.06] text-sm text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:border-electric/30 focus:ring-1 focus:ring-electric/20 transition-colors"
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={rating === 0 || submitting}
        className="w-full px-4 py-2.5 bg-electric hover:bg-electric-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
      >
        {submitting ? "Submitting..." : "Submit Feedback"}
      </button>
    </div>
  );
}
