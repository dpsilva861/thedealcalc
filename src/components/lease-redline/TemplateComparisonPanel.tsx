/**
 * TemplateComparisonPanel — Upload a standard form lease and compare
 * incoming documents against it to instantly spot deviations.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  GitCompareArrows,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  MinusCircle,
  X,
  FileText,
} from "lucide-react";
import type {
  LeaseTemplate,
  TemplateClause,
  TemplateDeviation,
  DocumentType,
  RiskLevel,
} from "@/lib/lease-redline/types";
import { DOCUMENT_TYPE_LABELS } from "@/lib/lease-redline/types";

interface Props {
  templates: LeaseTemplate[];
  onCreateTemplate: (
    name: string,
    documentType: DocumentType,
    clauses: Omit<TemplateClause, "id">[],
    jurisdiction?: string
  ) => void;
  onDeleteTemplate: (id: string) => void;
  onCompare: (
    templateId: string,
    documentText: string
  ) => TemplateDeviation[];
  documentText?: string;
  onClose: () => void;
}

const SEVERITY_COLORS: Record<RiskLevel, string> = {
  critical: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

const DEVIATION_ICONS: Record<string, typeof AlertTriangle> = {
  missing: MinusCircle,
  modified: AlertTriangle,
  added: CheckCircle2,
};

export function TemplateComparisonPanel({
  templates,
  onCreateTemplate,
  onDeleteTemplate,
  onCompare,
  documentText,
  onClose,
}: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDocType, setNewDocType] = useState<DocumentType>("lease");
  const [newClauseText, setNewClauseText] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [deviations, setDeviations] = useState<TemplateDeviation[] | null>(null);

  const handleCreateTemplate = () => {
    if (!newName.trim() || !newClauseText.trim()) return;

    // Parse clauses from text — each paragraph is a clause
    const paragraphs = newClauseText
      .split(/\n\n+/)
      .filter((p) => p.trim().length > 20);
    const clauses: Omit<TemplateClause, "id">[] = paragraphs.map((p, i) => {
      // Try to extract a label from the first line
      const lines = p.trim().split("\n");
      const firstLine = lines[0].trim();
      const hasLabel = firstLine.length < 80 && lines.length > 1;

      return {
        category: "general",
        label: hasLabel ? firstLine : `Clause ${i + 1}`,
        standardLanguage: hasLabel ? lines.slice(1).join("\n").trim() : p.trim(),
        order: i,
      };
    });

    onCreateTemplate(newName, newDocType, clauses);
    setNewName("");
    setNewClauseText("");
    setShowCreate(false);
  };

  const handleCompare = () => {
    if (!selectedTemplateId || !documentText) return;
    const results = onCompare(selectedTemplateId, documentText);
    setDeviations(results);
  };

  const criticalCount = deviations?.filter((d) => d.severity === "critical").length || 0;
  const highCount = deviations?.filter((d) => d.severity === "high").length || 0;
  const missingCount = deviations?.filter((d) => d.deviationType === "missing").length || 0;
  const modifiedCount = deviations?.filter((d) => d.deviationType === "modified").length || 0;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <GitCompareArrows className="h-5 w-5 text-primary" />
            Template Comparison
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template selector */}
        {templates.length > 0 && (
          <div className="flex gap-2">
            <Select
              value={selectedTemplateId || ""}
              onValueChange={setSelectedTemplateId}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.clauses.length} clauses)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleCompare}
              disabled={!selectedTemplateId || !documentText}
              size="sm"
            >
              Compare
            </Button>
          </div>
        )}

        {/* No document warning */}
        {!documentText && (
          <p className="text-xs text-muted-foreground">
            Run an analysis first to compare against a template.
          </p>
        )}

        {/* Deviations results */}
        {deviations !== null && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                {deviations.length} deviations found
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
              {missingCount > 0 && (
                <Badge className="text-xs bg-gray-100 text-gray-800 hover:bg-gray-100">
                  {missingCount} missing
                </Badge>
              )}
              {modifiedCount > 0 && (
                <Badge className="text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                  {modifiedCount} modified
                </Badge>
              )}
            </div>

            <Accordion type="multiple" className="space-y-1">
              {deviations.map((dev, i) => {
                const Icon = DEVIATION_ICONS[dev.deviationType] || AlertTriangle;
                return (
                  <AccordionItem
                    key={i}
                    value={`dev-${i}`}
                    className="border rounded-lg px-3"
                  >
                    <AccordionTrigger className="text-sm py-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <Badge
                          className={`text-[10px] ${
                            SEVERITY_COLORS[dev.severity]
                          }`}
                        >
                          {dev.severity}
                        </Badge>
                        <span className="text-left">
                          {dev.templateClauseLabel}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {dev.deviationType}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="font-medium text-muted-foreground">
                            Standard:
                          </span>
                          <p className="mt-1 p-2 bg-green-50 rounded text-green-800 border border-green-200">
                            {dev.standardLanguage.slice(0, 300)}
                            {dev.standardLanguage.length > 300 ? "..." : ""}
                          </p>
                        </div>
                        {dev.incomingLanguage && (
                          <div>
                            <span className="font-medium text-muted-foreground">
                              Incoming:
                            </span>
                            <p className="mt-1 p-2 bg-red-50 rounded text-red-800 border border-red-200">
                              {dev.incomingLanguage.slice(0, 300)}
                              {dev.incomingLanguage.length > 300 ? "..." : ""}
                            </p>
                          </div>
                        )}
                        {dev.explanation && (
                          <p className="italic text-muted-foreground">
                            {dev.explanation}
                          </p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        )}

        {/* Template management */}
        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Your Templates</h4>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1"
              onClick={() => setShowCreate(!showCreate)}
            >
              <Plus className="h-3 w-3" />
              New Template
            </Button>
          </div>

          {showCreate && (
            <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
              <Input
                placeholder="Template name (e.g., 'Standard NNN Lease')"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="text-sm"
              />
              <Select
                value={newDocType}
                onValueChange={(v) => setNewDocType(v as DocumentType)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_TYPE_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Paste your standard form clauses here. Separate each clause with a blank line. Optionally, put a short label on the first line of each clause."
                value={newClauseText}
                onChange={(e) => setNewClauseText(e.target.value)}
                className="text-xs min-h-[120px]"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="text-xs"
                  onClick={handleCreateTemplate}
                  disabled={!newName.trim() || !newClauseText.trim()}
                >
                  Save Template
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Template list */}
          {templates.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No templates yet. Create one from your standard form lease.
            </p>
          ) : (
            <div className="space-y-1">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm">{t.name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {t.clauses.length} clauses
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => onDeleteTemplate(t.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
