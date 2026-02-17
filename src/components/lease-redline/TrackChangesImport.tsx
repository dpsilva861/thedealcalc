/**
 * TrackChangesImport — Upload a .docx with track changes from the counterparty
 * and review what they accepted/rejected/modified from your previous round.
 */

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileUp,
  X,
  Plus,
  Minus,
  User,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { importDocxTrackChanges } from "@/lib/lease-redline/docx-import";
import type { DocxImportResult, ImportedTrackChange } from "@/lib/lease-redline/types";

interface Props {
  onImportComplete?: (result: DocxImportResult) => void;
  onClose: () => void;
}

export function TrackChangesImport({ onImportComplete, onClose }: Props) {
  const [result, setResult] = useState<DocxImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "insertion" | "deletion">("all");

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.name.endsWith(".docx")) {
        setError("Please upload a .docx file with tracked changes.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const buffer = await file.arrayBuffer();
        const importResult = await importDocxTrackChanges(buffer);

        if (importResult.trackChanges.length === 0) {
          setError(
            "No tracked changes found in this document. Make sure the file has track changes enabled."
          );
          setIsLoading(false);
          return;
        }

        setResult(importResult);
        onImportComplete?.(importResult);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to parse document. Ensure it is a valid .docx file."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [onImportComplete]
  );

  const filteredChanges = result?.trackChanges.filter((tc) =>
    filterType === "all" ? true : tc.type === filterType
  );

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileUp className="h-5 w-5 text-primary" />
            Import Track Changes
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload area */}
        {!result && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Upload a .docx file with tracked changes from the counterparty to
              see what they accepted, rejected, or modified.
            </p>
            <label className="flex flex-col items-center gap-2 p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
              <FileUp className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">
                {isLoading ? "Parsing..." : "Drop .docx file here or click to upload"}
              </span>
              <span className="text-xs text-muted-foreground">
                Supports Word files with tracked changes
              </span>
              <input
                type="file"
                accept=".docx"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isLoading}
              />
            </label>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2 rounded bg-green-50 border border-green-200">
                <div className="text-lg font-bold text-green-700">
                  {result.totalInsertions}
                </div>
                <div className="text-xs text-green-600">Insertions</div>
              </div>
              <div className="p-2 rounded bg-red-50 border border-red-200">
                <div className="text-lg font-bold text-red-700">
                  {result.totalDeletions}
                </div>
                <div className="text-xs text-red-600">Deletions</div>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <div className="text-lg font-bold">
                  {result.authors.length}
                </div>
                <div className="text-xs text-muted-foreground">Author(s)</div>
              </div>
            </div>

            {/* Authors */}
            <div className="flex flex-wrap gap-1">
              {result.authors.map((author) => (
                <Badge
                  key={author}
                  variant="outline"
                  className="text-xs gap-1"
                >
                  <User className="h-3 w-3" />
                  {author}
                </Badge>
              ))}
            </div>

            {/* Filter */}
            <div className="flex gap-1">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                className="text-xs h-7"
                onClick={() => setFilterType("all")}
              >
                All ({result.trackChanges.length})
              </Button>
              <Button
                variant={filterType === "insertion" ? "default" : "outline"}
                size="sm"
                className="text-xs h-7"
                onClick={() => setFilterType("insertion")}
              >
                Insertions ({result.totalInsertions})
              </Button>
              <Button
                variant={filterType === "deletion" ? "default" : "outline"}
                size="sm"
                className="text-xs h-7"
                onClick={() => setFilterType("deletion")}
              >
                Deletions ({result.totalDeletions})
              </Button>
            </div>

            {/* Changes list */}
            <div className="space-y-2 max-h-[400px] overflow-auto">
              {filteredChanges?.map((tc) => (
                <div
                  key={tc.id}
                  className={`p-3 rounded-lg border ${
                    tc.type === "insertion"
                      ? "border-green-200 bg-green-50/50"
                      : "border-red-200 bg-red-50/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {tc.type === "insertion" ? (
                      <Plus className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Minus className="h-3.5 w-3.5 text-red-600" />
                    )}
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${
                        tc.type === "insertion"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {tc.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {tc.author}
                    </span>
                    {tc.date && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(tc.date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-sm ${
                      tc.type === "insertion"
                        ? "text-green-800 font-medium"
                        : "text-red-800 line-through"
                    }`}
                  >
                    {tc.text}
                  </p>
                  {tc.context && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      Context: {tc.context.slice(0, 150)}...
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Reset */}
            <Button
              variant="outline"
              size="sm"
              className="text-xs w-full"
              onClick={() => {
                setResult(null);
                setError(null);
              }}
            >
              Upload Different Document
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
