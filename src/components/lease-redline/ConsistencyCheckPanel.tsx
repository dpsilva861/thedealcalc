/**
 * ConsistencyCheckPanel — Cross-document consistency checks.
 *
 * Shows inconsistencies in defined terms, dates, amounts, party names,
 * and addresses across multiple documents in the same deal.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ShieldAlert,
  X,
  AlertTriangle,
  FileText,
  Lightbulb,
} from "lucide-react";
import type { ConsistencyIssue, RiskLevel } from "@/lib/lease-redline/types";

interface Props {
  issues: ConsistencyIssue[];
  onClose: () => void;
}

const SEVERITY_COLORS: Record<RiskLevel, string> = {
  critical: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

const CATEGORY_LABELS: Record<string, string> = {
  defined_term: "Defined Term",
  date: "Date",
  amount: "Dollar Amount",
  party_name: "Party Name",
  address: "Address",
  cross_reference: "Cross-Reference",
};

export function ConsistencyCheckPanel({ issues, onClose }: Props) {
  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const highCount = issues.filter((i) => i.severity === "high").length;
  const mediumCount = issues.filter((i) => i.severity === "medium").length;
  const lowCount = issues.filter((i) => i.severity === "low").length;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Cross-Document Consistency
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {issues.length === 0 ? (
          <div className="text-center py-6">
            <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm font-medium text-green-600">
              No inconsistencies found
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              All checked documents appear consistent.
            </p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                {issues.length} issue{issues.length !== 1 ? "s" : ""} found
              </Badge>
              {criticalCount > 0 && (
                <Badge className="text-xs bg-red-100 text-red-800 hover:bg-red-100">
                  {criticalCount} critical
                </Badge>
              )}
              {highCount > 0 && (
                <Badge className="text-xs bg-orange-100 text-orange-800 hover:bg-orange-100">
                  {highCount} high
                </Badge>
              )}
              {mediumCount > 0 && (
                <Badge className="text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                  {mediumCount} medium
                </Badge>
              )}
              {lowCount > 0 && (
                <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-100">
                  {lowCount} low
                </Badge>
              )}
            </div>

            {/* Issues list */}
            <Accordion type="multiple" className="space-y-1">
              {issues.map((issue) => (
                <AccordionItem
                  key={issue.id}
                  value={issue.id}
                  className="border rounded-lg px-3"
                >
                  <AccordionTrigger className="text-sm py-2">
                    <div className="flex items-center gap-2 text-left">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <Badge
                        className={`text-[10px] shrink-0 ${
                          SEVERITY_COLORS[issue.severity]
                        }`}
                      >
                        {issue.severity}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {CATEGORY_LABELS[issue.category] || issue.category}
                      </Badge>
                      <span className="truncate">{issue.description}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 text-xs">
                      {/* Document A */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">
                            {issue.documentA.fileName}
                          </span>
                        </div>
                        <div className="p-2 bg-muted/50 rounded border text-muted-foreground font-mono">
                          {issue.documentA.excerpt || "No excerpt available"}
                        </div>
                      </div>

                      {/* Document B */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">
                            {issue.documentB.fileName}
                          </span>
                        </div>
                        <div className="p-2 bg-muted/50 rounded border text-muted-foreground font-mono">
                          {issue.documentB.excerpt || "No excerpt available"}
                        </div>
                      </div>

                      {/* Suggestion */}
                      {issue.suggestion && (
                        <div className="flex items-start gap-2 p-2 bg-primary/5 rounded border border-primary/20">
                          <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                          <span className="text-primary">
                            {issue.suggestion}
                          </span>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </>
        )}
      </CardContent>
    </Card>
  );
}
