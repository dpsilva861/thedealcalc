/**
 * ClauseLibraryPanel — Browse, search, add, import/export custom clauses.
 *
 * Users build their standard positions here (e.g., "For CAM caps, always propose: ...").
 * Clauses can be filtered by category, jurisdiction, and document type.
 */

import { useState, useMemo } from "react";
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
  BookOpen,
  Plus,
  Search,
  Trash2,
  Download,
  Upload,
  X,
  Copy,
  Pencil,
  Check,
} from "lucide-react";
import type { CustomClause, DocumentType } from "@/lib/lease-redline/types";
import { DOCUMENT_TYPE_LABELS } from "@/lib/lease-redline/types";

interface Props {
  clauses: CustomClause[];
  onAddClause: (
    category: string,
    label: string,
    language: string,
    jurisdiction?: string,
    documentTypes?: DocumentType[]
  ) => string;
  onUpdateClause: (id: string, updates: Partial<CustomClause>) => void;
  onDeleteClause: (id: string) => void;
  onExport: () => string;
  onImport: (clause: Omit<CustomClause, "id" | "createdAt" | "updatedAt">) => void;
  onClose: () => void;
}

const CATEGORIES = [
  "rent",
  "cam",
  "ti",
  "use",
  "exclusive",
  "co-tenancy",
  "assignment",
  "default",
  "guaranty",
  "casualty",
  "maintenance",
  "insurance",
  "term",
  "option",
  "other",
];

export function ClauseLibraryPanel({
  clauses,
  onAddClause,
  onUpdateClause,
  onDeleteClause,
  onExport,
  onImport,
  onClose,
}: Props) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New clause form
  const [newCategory, setNewCategory] = useState("rent");
  const [newLabel, setNewLabel] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  const [newJurisdiction, setNewJurisdiction] = useState("");

  // Edit form
  const [editLabel, setEditLabel] = useState("");
  const [editLanguage, setEditLanguage] = useState("");

  const filtered = useMemo(() => {
    return clauses.filter((c) => {
      if (
        filterCategory !== "all" &&
        c.category.toLowerCase() !== filterCategory
      )
        return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.label.toLowerCase().includes(q) ||
          c.language.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [clauses, filterCategory, search]);

  const handleAdd = () => {
    if (!newLabel.trim() || !newLanguage.trim()) return;
    onAddClause(
      newCategory,
      newLabel,
      newLanguage,
      newJurisdiction || undefined
    );
    setNewLabel("");
    setNewLanguage("");
    setNewJurisdiction("");
    setShowAdd(false);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => { /* clipboard unavailable */ });
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExport = () => {
    const json = onExport();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clause-library.json";
    a.click();
    // Delay revocation to ensure download starts
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        const arr = Array.isArray(data) ? data : [data];
        for (const item of arr) {
          if (item.category && item.label && item.language) {
            onImport({
              category: item.category,
              label: item.label,
              language: item.language,
              jurisdiction: item.jurisdiction,
              documentTypes: item.documentTypes || [],
              isDefault: false,
            });
          }
        }
      } catch {
        /* invalid JSON */
      }
    };
    input.click();
  };

  const startEdit = (clause: CustomClause) => {
    setEditingId(clause.id);
    setEditLabel(clause.label);
    setEditLanguage(clause.language);
  };

  const saveEdit = (id: string) => {
    onUpdateClause(id, { label: editLabel, language: editLanguage });
    setEditingId(null);
  };

  // Count by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of clauses) {
      const cat = c.category.toLowerCase();
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [clauses]);

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Clause Library
            <Badge variant="secondary" className="text-xs">
              {clauses.length}
            </Badge>
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search clauses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-sm h-9"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-32 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({clauses.length})</SelectItem>
              {CATEGORIES.filter((c) => categoryCounts[c]).map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat} ({categoryCounts[cat]})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Actions bar */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1"
            onClick={() => setShowAdd(!showAdd)}
          >
            <Plus className="h-3 w-3" />
            Add Clause
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1"
            onClick={handleImport}
          >
            <Upload className="h-3 w-3" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1"
            onClick={handleExport}
            disabled={clauses.length === 0}
          >
            <Download className="h-3 w-3" />
            Export
          </Button>
        </div>

        {/* Add clause form */}
        {showAdd && (
          <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Jurisdiction (optional)"
                value={newJurisdiction}
                onChange={(e) => setNewJurisdiction(e.target.value)}
                className="text-sm"
              />
            </div>
            <Input
              placeholder="Clause label (e.g., 'CAM Cap - 5% Annual')"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="text-sm"
            />
            <Textarea
              placeholder="Clause language..."
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              className="text-xs min-h-[80px]"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="text-xs"
                onClick={handleAdd}
                disabled={!newLabel.trim() || !newLanguage.trim()}
              >
                Save Clause
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Clause list */}
        <div className="space-y-2 max-h-[400px] overflow-auto">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              {clauses.length === 0
                ? "No clauses yet. Add your standard positions above."
                : "No clauses match your search."}
            </p>
          ) : (
            filtered.map((clause) => (
              <div
                key={clause.id}
                className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
              >
                {editingId === clause.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="text-sm"
                    />
                    <Textarea
                      value={editLanguage}
                      onChange={(e) => setEditLanguage(e.target.value)}
                      className="text-xs min-h-[60px]"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="text-xs h-6"
                        onClick={() => saveEdit(clause.id)}
                      >
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-6"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {clause.label}
                          </span>
                          <Badge variant="secondary" className="text-[10px]">
                            {clause.category}
                          </Badge>
                          {clause.jurisdiction && (
                            <Badge variant="outline" className="text-[10px]">
                              {clause.jurisdiction}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {clause.language}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopy(clause.language, clause.id)}
                        >
                          {copiedId === clause.id ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => startEdit(clause)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => onDeleteClause(clause.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
