import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GitCompare,
  Plus,
  Minus,
  ArrowRight,
  History,
  X,
} from "lucide-react";
import type { AnalysisVersion, LeaseRedlineRevision, RevisionDecision } from "@/lib/lease-redline/types";
import type { VersionDiff } from "@/hooks/useVersionHistory";

interface VersionComparisonViewProps {
  versions: AnalysisVersion[];
  onCompare: (vA: number, vB: number) => VersionDiff | null;
  onClose: () => void;
}

const RISK_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export function VersionComparisonView({
  versions,
  onCompare,
  onClose,
}: VersionComparisonViewProps) {
  const [versionA, setVersionA] = useState<string>(
    versions.length >= 2 ? String(versions[versions.length - 2].versionNumber) : ""
  );
  const [versionB, setVersionB] = useState<string>(
    versions.length >= 1 ? String(versions[versions.length - 1].versionNumber) : ""
  );

  const diff = useMemo(() => {
    if (!versionA || !versionB || versionA === versionB) return null;
    return onCompare(Number(versionA), Number(versionB));
  }, [versionA, versionB, onCompare]);

  if (versions.length < 2) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <History className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Save at least 2 versions to compare. Use "Save Version" after each negotiation round.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-primary" />
            Version Comparison
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Version selectors */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">From</label>
            <Select value={versionA} onValueChange={setVersionA}>
              <SelectTrigger>
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent>
                {versions.map((v) => (
                  <SelectItem key={v.versionNumber} value={String(v.versionNumber)}>
                    {v.label || `Round ${v.versionNumber}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground mb-2" />
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">To</label>
            <Select value={versionB} onValueChange={setVersionB}>
              <SelectTrigger>
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent>
                {versions.map((v) => (
                  <SelectItem key={v.versionNumber} value={String(v.versionNumber)}>
                    {v.label || `Round ${v.versionNumber}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {diff && (
          <div className="space-y-4 border-t pt-4">
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2 rounded-md bg-green-50 border border-green-200">
                <div className="text-lg font-bold text-green-700">
                  {diff.addedRevisions.length}
                </div>
                <div className="text-xs text-green-600">New Revisions</div>
              </div>
              <div className="p-2 rounded-md bg-red-50 border border-red-200">
                <div className="text-lg font-bold text-red-700">
                  {diff.removedRevisions.length}
                </div>
                <div className="text-xs text-red-600">Removed</div>
              </div>
              <div className="p-2 rounded-md bg-blue-50 border border-blue-200">
                <div className="text-lg font-bold text-blue-700">
                  {diff.changedDecisions.length}
                </div>
                <div className="text-xs text-blue-600">Decision Changes</div>
              </div>
            </div>

            {/* Risk flag changes */}
            {(diff.riskFlagsDiff.added.length > 0 || diff.riskFlagsDiff.removed.length > 0) && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Risk Flag Changes
                </h4>
                {diff.riskFlagsDiff.added.map((flag, i) => (
                  <div key={`a-${i}`} className="flex items-start gap-2 text-sm">
                    <Plus className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                    <span className="text-red-700">{flag}</span>
                  </div>
                ))}
                {diff.riskFlagsDiff.removed.map((flag, i) => (
                  <div key={`r-${i}`} className="flex items-start gap-2 text-sm">
                    <Minus className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-green-700 line-through">{flag}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Decision changes */}
            {diff.changedDecisions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Decision Changes
                </h4>
                {diff.changedDecisions.map((change, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="font-mono text-xs text-muted-foreground">
                      #{change.clauseNumber}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {change.from}
                    </Badge>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <Badge
                      className={`text-xs ${
                        change.to === "accepted"
                          ? "bg-green-100 text-green-800"
                          : change.to === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {change.to}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Added revisions */}
            {diff.addedRevisions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  New Revisions in {diff.versionB.label || `Round ${diff.versionB.versionNumber}`}
                </h4>
                {diff.addedRevisions.map((rev, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-md bg-green-50 border border-green-200 text-sm"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs">#{rev.clauseNumber}</span>
                      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs ${RISK_COLORS[rev.riskLevel || "low"]}`}>
                        {rev.riskLevel || "low"}
                      </span>
                      {rev.category && (
                        <Badge variant="outline" className="text-xs">{rev.category}</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">{rev.reason}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Removed revisions */}
            {diff.removedRevisions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Removed from {diff.versionB.label || `Round ${diff.versionB.versionNumber}`}
                </h4>
                {diff.removedRevisions.map((rev, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-md bg-red-50 border border-red-200 text-sm opacity-60"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs">#{rev.clauseNumber}</span>
                      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs ${RISK_COLORS[rev.riskLevel || "low"]}`}>
                        {rev.riskLevel || "low"}
                      </span>
                    </div>
                    <p className="text-muted-foreground line-through">{rev.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {versionA === versionB && versionA !== "" && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Select two different versions to compare.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
