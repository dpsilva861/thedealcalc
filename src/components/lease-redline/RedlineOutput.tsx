import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertTriangle,
  ChevronDown,
  FileText,
  Shield,
  Copy,
  Check,
  RotateCcw,
  Download,
  CheckCircle2,
  XCircle,
  BookOpen,
} from "lucide-react";
import type {
  LeaseRedlineResponse,
  LeaseRedlineRevision,
  RevisionDecision,
  RiskLevel,
} from "@/lib/lease-redline/types";
import { DOCUMENT_TYPE_LABELS } from "@/lib/lease-redline/types";

interface RedlineOutputProps {
  response: LeaseRedlineResponse;
  onReset: () => void;
}

const RISK_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200",
};

const RISK_BORDER_COLORS: Record<string, string> = {
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#ca8a04",
  low: "#16a34a",
};

const RISK_SORT_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const SEVERITY_FILTER_LABELS: Record<number, string> = {
  0: "All",
  1: "Medium+",
  2: "High+",
  3: "Critical",
};

function RiskBadge({ level }: { level?: string }) {
  if (!level) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${RISK_COLORS[level] || RISK_COLORS.low}`}
      role="status"
      aria-label={`Risk level: ${level}`}
    >
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

function ConfidenceBadge({ confidence }: { confidence?: number }) {
  if (confidence == null) return null;
  const pct = Math.round(confidence * 100);
  return (
    <span className="text-xs text-muted-foreground" title="AI confidence">
      {pct}%
    </span>
  );
}

function CategoryBadge({ category }: { category?: string }) {
  if (!category) return null;
  return (
    <Badge variant="outline" className="text-xs">
      {category}
    </Badge>
  );
}

interface RevisionCardProps {
  revision: LeaseRedlineRevision;
  index: number;
  decision: RevisionDecision;
  onDecision: (index: number, decision: RevisionDecision) => void;
}

function RevisionCard({ revision, index, decision, onDecision }: RevisionCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card
        className={`border-l-4 ${decision === "accepted" ? "opacity-60" : decision === "rejected" ? "opacity-40" : ""}`}
        style={{
          borderLeftColor: RISK_BORDER_COLORS[revision.riskLevel || "low"],
        }}
      >
        <CollapsibleTrigger asChild>
          <CardHeader
            className="cursor-pointer hover:bg-muted/50 transition-colors py-3"
            role="button"
            aria-expanded={isOpen}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-mono text-muted-foreground">
                    #{revision.clauseNumber}
                  </span>
                  <RiskBadge level={revision.riskLevel} />
                  <CategoryBadge category={revision.category} />
                  <ConfidenceBadge confidence={revision.confidence} />
                  {decision === "accepted" && (
                    <span className="text-xs text-green-600 font-medium">Accepted</span>
                  )}
                  {decision === "rejected" && (
                    <span className="text-xs text-red-600 font-medium">Rejected</span>
                  )}
                </div>
                <p className="text-sm text-foreground line-clamp-2">
                  {revision.reason}
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Original Language */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Original Language
              </h4>
              <div className="bg-red-50 border border-red-100 rounded-md p-3 text-sm whitespace-pre-wrap">
                {revision.originalLanguage}
              </div>
            </div>

            {/* Redline Markup */}
            {revision.redlineMarkup && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Redline Markup
                </h4>
                <div className="bg-amber-50 border border-amber-100 rounded-md p-3 text-sm whitespace-pre-wrap">
                  <RedlineMarkupRenderer text={revision.redlineMarkup} />
                </div>
              </div>
            )}

            {/* Clean Replacement */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Clean Replacement
              </h4>
              <div className="bg-green-50 border border-green-100 rounded-md p-3 text-sm whitespace-pre-wrap">
                {revision.cleanReplacement}
              </div>
            </div>

            {/* Reason */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Rationale
              </h4>
              <p className="text-sm text-muted-foreground italic">
                {revision.reason}
              </p>
            </div>

            {/* Accept / Reject */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <Button
                variant={decision === "accepted" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  onDecision(
                    index,
                    decision === "accepted" ? "pending" : "accepted"
                  )
                }
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {decision === "accepted" ? "Accepted" : "Accept"}
              </Button>
              <Button
                variant={decision === "rejected" ? "destructive" : "outline"}
                size="sm"
                onClick={() =>
                  onDecision(
                    index,
                    decision === "rejected" ? "pending" : "rejected"
                  )
                }
              >
                <XCircle className="h-3.5 w-3.5" />
                {decision === "rejected" ? "Rejected" : "Reject"}
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

/**
 * Renders redline markup text with ~~strikethrough~~ and **bold** formatting.
 */
function RedlineMarkupRenderer({ text }: { text: string }) {
  const parts = text.split(/(~~(?:[^~]|~(?!~))+~~|\*\*(?:[^*]|\*(?!\*))+\*\*)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("~~") && part.endsWith("~~")) {
          const inner = part.slice(2, -2);
          return (
            <span
              key={i}
              className="line-through text-red-600 bg-red-100 px-0.5"
              aria-label={`Deleted: ${inner}`}
            >
              {inner}
            </span>
          );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          const inner = part.slice(2, -2);
          return (
            <span
              key={i}
              className="font-bold text-green-700 bg-green-100 px-0.5"
              aria-label={`Added: ${inner}`}
            >
              {inner}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {label}
    </Button>
  );
}

export function RedlineOutput({ response, onReset }: RedlineOutputProps) {
  const { revisions, summary, riskFlags, definedTerms, documentType, tokenUsage } = response;

  // Accept/reject state per revision
  const [decisions, setDecisions] = useState<RevisionDecision[]>(
    () => revisions.map(() => "pending" as RevisionDecision)
  );

  // Severity filter: 0=all, 1=medium+, 2=high+, 3=critical only
  const [severityFilter, setSeverityFilter] = useState(0);

  const handleDecision = (index: number, decision: RevisionDecision) => {
    setDecisions((prev) => {
      const next = [...prev];
      next[index] = decision;
      return next;
    });
  };

  const filterByRisk = (rev: LeaseRedlineRevision): boolean => {
    if (severityFilter === 0) return true;
    const level = rev.riskLevel || "low";
    const order = RISK_SORT_ORDER[level] ?? 3;
    // severity 1 = medium+ (order <= 2), severity 2 = high+ (order <= 1), severity 3 = critical (order === 0)
    const threshold = severityFilter === 1 ? 2 : severityFilter === 2 ? 1 : 0;
    return order <= threshold;
  };

  const filteredRevisions = useMemo(
    () => revisions.filter(filterByRisk),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [revisions, severityFilter]
  );

  const sortedRevisions = useMemo(
    () =>
      [...filteredRevisions].sort(
        (a, b) =>
          (RISK_SORT_ORDER[a.riskLevel || "low"] ?? 3) -
          (RISK_SORT_ORDER[b.riskLevel || "low"] ?? 3)
      ),
    [filteredRevisions]
  );

  // Group by category
  const categories = useMemo(() => {
    const map = new Map<string, { revision: LeaseRedlineRevision; index: number }[]>();
    filteredRevisions.forEach((rev) => {
      const origIndex = revisions.indexOf(rev);
      const cat = rev.category || "Other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push({ revision: rev, index: origIndex });
    });
    return map;
  }, [filteredRevisions, revisions]);

  // Build exportable text
  const acceptedRevisions = revisions.filter(
    (_, i) => decisions[i] === "accepted" || decisions[i] === "pending"
  );
  const cleanText = acceptedRevisions
    .map(
      (r) =>
        `[Clause ${r.clauseNumber}] ${r.cleanReplacement}\n\nRationale: ${r.reason}`
    )
    .join("\n\n---\n\n");

  const fullExportText = buildFullExport(response, decisions);

  const riskCounts = {
    critical: revisions.filter((r) => r.riskLevel === "critical").length,
    high: revisions.filter((r) => r.riskLevel === "high").length,
    medium: revisions.filter((r) => r.riskLevel === "medium").length,
    low: revisions.filter((r) => r.riskLevel === "low").length,
  };

  const decisionCounts = {
    accepted: decisions.filter((d) => d === "accepted").length,
    rejected: decisions.filter((d) => d === "rejected").length,
    pending: decisions.filter((d) => d === "pending").length,
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Redline Analysis — {DOCUMENT_TYPE_LABELS[documentType]}
            </CardTitle>
            <div className="flex items-center gap-2">
              <CopyButton text={fullExportText} label="Copy" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadTextFile(fullExportText, `lease-redline-${documentType}-${new Date().toISOString().slice(0, 10)}.txt`)}
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={onReset}>
                <RotateCcw className="h-3.5 w-3.5" />
                New Analysis
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {revisions.length}
              </div>
              <div className="text-xs text-muted-foreground">
                Total Revisions
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {riskCounts.critical}
              </div>
              <div className="text-xs text-muted-foreground">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {riskCounts.high}
              </div>
              <div className="text-xs text-muted-foreground">High Risk</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {riskCounts.medium}
              </div>
              <div className="text-xs text-muted-foreground">Medium</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {riskCounts.low}
              </div>
              <div className="text-xs text-muted-foreground">Low</div>
            </div>
          </div>

          {/* Decision progress */}
          {(decisionCounts.accepted > 0 || decisionCounts.rejected > 0) && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-3">
              <span className="text-green-600 font-medium">
                {decisionCounts.accepted} accepted
              </span>
              <span className="text-red-600 font-medium">
                {decisionCounts.rejected} rejected
              </span>
              <span>{decisionCounts.pending} pending</span>
            </div>
          )}

          {/* Token usage */}
          {tokenUsage && (
            <div className="text-xs text-muted-foreground border-t pt-2">
              Tokens used: {(tokenUsage.input + tokenUsage.output).toLocaleString()} ({tokenUsage.input.toLocaleString()} in / {tokenUsage.output.toLocaleString()} out)
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Flags */}
      {riskFlags.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              Risk Flags ({riskFlags.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {riskFlags.map((flag, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {summary && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
              {summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Defined Terms */}
      {definedTerms && definedTerms.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Defined Terms Identified ({definedTerms.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {definedTerms.map((term, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {term}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Severity Filter */}
      <div className="flex items-center gap-4">
        <Label className="text-sm shrink-0">Severity Filter:</Label>
        <div className="flex-1 max-w-xs">
          <Slider
            value={[severityFilter]}
            onValueChange={([v]) => setSeverityFilter(v)}
            min={0}
            max={3}
            step={1}
          />
        </div>
        <span className="text-sm font-medium w-20">
          {SEVERITY_FILTER_LABELS[severityFilter]}
        </span>
      </div>

      {/* Revisions */}
      <Tabs defaultValue="all">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="all">
              All ({filteredRevisions.length})
            </TabsTrigger>
            <TabsTrigger value="by-risk">By Risk</TabsTrigger>
            <TabsTrigger value="by-category">By Category</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <CopyButton text={cleanText} label="Copy Clean" />
          </div>
        </div>

        {/* All revisions in document order */}
        <TabsContent value="all" className="space-y-3 mt-4">
          {filteredRevisions.map((rev) => {
            const origIndex = revisions.indexOf(rev);
            return (
              <RevisionCard
                key={origIndex}
                revision={rev}
                index={origIndex}
                decision={decisions[origIndex]}
                onDecision={handleDecision}
              />
            );
          })}
          {filteredRevisions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No revisions match the current severity filter.
            </p>
          )}
        </TabsContent>

        {/* Sorted by risk */}
        <TabsContent value="by-risk" className="space-y-3 mt-4">
          {sortedRevisions.map((rev) => {
            const origIndex = revisions.indexOf(rev);
            return (
              <RevisionCard
                key={origIndex}
                revision={rev}
                index={origIndex}
                decision={decisions[origIndex]}
                onDecision={handleDecision}
              />
            );
          })}
        </TabsContent>

        {/* Grouped by category */}
        <TabsContent value="by-category" className="space-y-6 mt-4">
          {Array.from(categories.entries()).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
                {category} ({items.length})
              </h3>
              <div className="space-y-3">
                {items.map(({ revision, index }) => (
                  <RevisionCard
                    key={index}
                    revision={revision}
                    index={index}
                    decision={decisions[index]}
                    onDecision={handleDecision}
                  />
                ))}
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center px-4 pt-4 border-t">
        This AI-generated analysis does not constitute legal advice. All
        redline suggestions should be reviewed by qualified legal counsel before
        inclusion in any executed document. The agent does not replace attorney
        review or override jurisdictional law.
      </p>
    </div>
  );
}

/**
 * Trigger a text file download in the browser.
 */
function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Build full structured export text for download/clipboard.
 */
function buildFullExport(
  response: LeaseRedlineResponse,
  decisions: RevisionDecision[]
): string {
  const lines: string[] = [];
  lines.push(`LEASE REDLINE ANALYSIS — ${DOCUMENT_TYPE_LABELS[response.documentType]}`);
  lines.push(`Output Mode: ${response.outputMode}`);
  lines.push(`Date: ${new Date().toLocaleDateString()}`);
  lines.push("");

  if (response.riskFlags.length > 0) {
    lines.push("═══ RISK FLAGS ═══");
    response.riskFlags.forEach((f) => lines.push(`  • ${f}`));
    lines.push("");
  }

  if (response.summary) {
    lines.push("═══ EXECUTIVE SUMMARY ═══");
    lines.push(response.summary);
    lines.push("");
  }

  lines.push(`═══ REVISIONS (${response.revisions.length} total) ═══`);
  lines.push("");

  response.revisions.forEach((rev, i) => {
    const status =
      decisions[i] === "accepted"
        ? "[ACCEPTED]"
        : decisions[i] === "rejected"
          ? "[REJECTED]"
          : "[PENDING]";
    lines.push(`--- Revision #${rev.clauseNumber} ${status} [${(rev.riskLevel || "low").toUpperCase()}] [${rev.category || "other"}] ---`);
    lines.push("");
    lines.push("ORIGINAL:");
    lines.push(rev.originalLanguage);
    lines.push("");
    lines.push("REVISED:");
    lines.push(rev.cleanReplacement);
    lines.push("");
    lines.push(`RATIONALE: ${rev.reason}`);
    lines.push("");
  });

  lines.push("═══ END OF ANALYSIS ═══");
  lines.push("");
  lines.push(
    "DISCLAIMER: This AI-generated analysis does not constitute legal advice. Review by qualified legal counsel is required."
  );

  return lines.join("\n");
}
