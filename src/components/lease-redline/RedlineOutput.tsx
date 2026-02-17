import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import type {
  LeaseRedlineResponse,
  LeaseRedlineRevision,
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

const RISK_SORT_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function RiskBadge({ level }: { level?: string }) {
  if (!level) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${RISK_COLORS[level] || RISK_COLORS.low}`}
    >
      {level.charAt(0).toUpperCase() + level.slice(1)}
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

function RevisionCard({ revision }: { revision: LeaseRedlineRevision }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-l-4" style={{
        borderLeftColor:
          revision.riskLevel === "critical"
            ? "#dc2626"
            : revision.riskLevel === "high"
              ? "#ea580c"
              : revision.riskLevel === "medium"
                ? "#ca8a04"
                : "#16a34a",
      }}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-mono text-muted-foreground">
                    #{revision.clauseNumber}
                  </span>
                  <RiskBadge level={revision.riskLevel} />
                  <CategoryBadge category={revision.category} />
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
  // Split on ~~...~~ and **...**
  const parts = text.split(/(~~[^~]+~~|\*\*[^*]+\*\*)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("~~") && part.endsWith("~~")) {
          const inner = part.slice(2, -2);
          return (
            <span
              key={i}
              className="line-through text-red-600 bg-red-100 px-0.5"
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
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
  const { revisions, summary, riskFlags, documentType } = response;

  // Sort revisions by risk level (critical first)
  const sortedRevisions = [...revisions].sort(
    (a, b) =>
      (RISK_SORT_ORDER[a.riskLevel || "low"] ?? 3) -
      (RISK_SORT_ORDER[b.riskLevel || "low"] ?? 3)
  );

  // Group by category
  const categories = new Map<string, LeaseRedlineRevision[]>();
  for (const rev of revisions) {
    const cat = rev.category || "Other";
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(rev);
  }

  // Build clean text for copy
  const cleanText = revisions
    .map(
      (r) =>
        `[${r.clauseNumber}] ${r.cleanReplacement}\n\nRationale: ${r.reason}`
    )
    .join("\n\n---\n\n");

  const riskCounts = {
    critical: revisions.filter((r) => r.riskLevel === "critical").length,
    high: revisions.filter((r) => r.riskLevel === "high").length,
    medium: revisions.filter((r) => r.riskLevel === "medium").length,
    low: revisions.filter((r) => r.riskLevel === "low").length,
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
            <Button variant="outline" size="sm" onClick={onReset}>
              <RotateCcw className="h-3.5 w-3.5" />
              New Analysis
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
                  <span className="text-red-500 mt-0.5 shrink-0">•</span>
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

      {/* Revisions */}
      <Tabs defaultValue="all">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="all">
              All ({revisions.length})
            </TabsTrigger>
            <TabsTrigger value="by-risk">By Risk</TabsTrigger>
            <TabsTrigger value="by-category">By Category</TabsTrigger>
          </TabsList>
          <CopyButton text={cleanText} label="Copy Clean Text" />
        </div>

        {/* All revisions in order */}
        <TabsContent value="all" className="space-y-3 mt-4">
          {revisions.map((rev, i) => (
            <RevisionCard key={i} revision={rev} />
          ))}
        </TabsContent>

        {/* Sorted by risk */}
        <TabsContent value="by-risk" className="space-y-3 mt-4">
          {sortedRevisions.map((rev, i) => (
            <RevisionCard key={i} revision={rev} />
          ))}
        </TabsContent>

        {/* Grouped by category */}
        <TabsContent value="by-category" className="space-y-6 mt-4">
          {Array.from(categories.entries()).map(([category, revs]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
                {category} ({revs.length})
              </h3>
              <div className="space-y-3">
                {revs.map((rev, i) => (
                  <RevisionCard key={i} revision={rev} />
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
