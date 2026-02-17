import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, EyeOff } from "lucide-react";
import type {
  LeaseRedlineRevision,
  RevisionDecision,
} from "@/lib/lease-redline/types";

type FilterMode = "all" | "accepted" | "changes";

interface InlineRedlineViewerProps {
  originalText: string;
  revisions: LeaseRedlineRevision[];
  decisions: RevisionDecision[];
}

/**
 * Represents a segment of document text: either plain text or a revision replacement.
 */
interface DocumentSegment {
  type: "text" | "revision";
  content: string;
  /** Present only when type === "revision" */
  revision?: LeaseRedlineRevision;
  revisionIndex?: number;
}

/**
 * Parse the redline markup string into rendered React nodes.
 *
 * Recognises:
 *   ~~deleted text~~  -> red strikethrough with light red background
 *   **added text**    -> green bold with light green background
 *   everything else   -> unchanged text
 */
function renderRedlineMarkup(markup: string): React.ReactNode[] {
  const parts = markup.split(/(~~(?:[^~]|~(?!~))+~~|\*\*(?:[^*]|\*(?!\*))+\*\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith("~~") && part.endsWith("~~")) {
      const inner = part.slice(2, -2);
      return (
        <span
          key={i}
          className="line-through text-red-600 bg-red-100 px-0.5 rounded-sm"
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
          className="font-bold text-green-700 bg-green-100 px-0.5 rounded-sm"
          aria-label={`Added: ${inner}`}
        >
          {inner}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/**
 * Build the list of document segments by locating each revision's originalLanguage
 * in the document text and splicing in the redline markup at that position.
 *
 * Revisions whose originalLanguage cannot be found in the remaining text are skipped.
 * The algorithm processes revisions sorted by their position in the document so that
 * earlier matches do not shift later ones.
 */
function buildSegments(
  originalText: string,
  revisions: LeaseRedlineRevision[],
  decisions: RevisionDecision[],
  filterMode: FilterMode,
): DocumentSegment[] {
  // Pair each revision with its original index, then determine which ones to show.
  const candidates = revisions
    .map((rev, idx) => ({ rev, idx }))
    .filter(({ idx }) => {
      const decision = decisions[idx];
      // Always skip rejected revisions (they remain as original text).
      if (decision === "rejected") return false;
      if (filterMode === "accepted") return decision === "accepted";
      if (filterMode === "changes") return true; // pending + accepted + modified
      return true; // "all" — show every non-rejected revision
    });

  // For each candidate, find its position in the original text.
  const positioned: {
    start: number;
    end: number;
    rev: LeaseRedlineRevision;
    idx: number;
  }[] = [];

  // Track which ranges are already claimed so overlapping matches are skipped.
  const claimed = new Set<string>();

  for (const { rev, idx } of candidates) {
    const pos = originalText.indexOf(rev.originalLanguage);
    if (pos === -1) continue; // skip if not found

    const end = pos + rev.originalLanguage.length;
    const key = `${pos}:${end}`;

    // Skip if this range overlaps with an already-claimed range.
    let overlaps = false;
    for (const c of claimed) {
      const [cs, ce] = c.split(":").map(Number);
      if (pos < ce && end > cs) {
        overlaps = true;
        break;
      }
    }
    if (overlaps) continue;

    claimed.add(key);
    positioned.push({ start: pos, end, rev, idx });
  }

  // Sort by position in the document.
  positioned.sort((a, b) => a.start - b.start);

  // Build the segment list.
  const segments: DocumentSegment[] = [];
  let cursor = 0;

  for (const { start, end, rev, idx } of positioned) {
    // Plain text before this revision.
    if (start > cursor) {
      segments.push({
        type: "text",
        content: originalText.slice(cursor, start),
      });
    }

    segments.push({
      type: "revision",
      content: rev.redlineMarkup,
      revision: rev,
      revisionIndex: idx,
    });

    cursor = end;
  }

  // Remaining plain text after the last revision.
  if (cursor < originalText.length) {
    segments.push({
      type: "text",
      content: originalText.slice(cursor),
    });
  }

  return segments;
}

/**
 * Count lines and words in a string.
 */
function countStats(text: string): { lines: number; words: number } {
  const lines = text.split("\n").length;
  const words = text.split(/\s+/).filter(Boolean).length;
  return { lines, words };
}

export function InlineRedlineViewer({
  originalText,
  revisions,
  decisions,
}: InlineRedlineViewerProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const segments = useMemo(
    () => buildSegments(originalText, revisions, decisions, filterMode),
    [originalText, revisions, decisions, filterMode],
  );

  const stats = useMemo(() => countStats(originalText), [originalText]);

  const activeRevisionCount = useMemo(() => {
    return segments.filter((s) => s.type === "revision").length;
  }, [segments]);

  const filterButtons: { mode: FilterMode; label: string; icon: React.ReactNode }[] = [
    {
      mode: "all",
      label: "Show All",
      icon: <Eye className="h-3.5 w-3.5" />,
    },
    {
      mode: "accepted",
      label: "Show Accepted Only",
      icon: <Eye className="h-3.5 w-3.5" />,
    },
    {
      mode: "changes",
      label: "Show Changes Only",
      icon: <EyeOff className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-primary" />
            Inline Document View
          </CardTitle>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{stats.lines.toLocaleString()} lines</span>
            <span aria-hidden="true">|</span>
            <span>{stats.words.toLocaleString()} words</span>
            <span aria-hidden="true">|</span>
            <span>{activeRevisionCount} change{activeRevisionCount !== 1 ? "s" : ""} shown</span>
          </div>
        </div>

        {/* Filter toggle buttons */}
        <div className="flex items-center gap-2 pt-2">
          {filterButtons.map(({ mode, label, icon }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilterMode(mode)}
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                filterMode === mode
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              aria-pressed={filterMode === mode}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 pt-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-red-100 border border-red-200" />
            <span className="line-through text-red-600">Deleted text</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-green-100 border border-green-200" />
            <span className="font-bold text-green-700">Added text</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div
          className="whitespace-pre-wrap text-sm leading-relaxed font-mono max-h-[600px] overflow-y-auto rounded-md border bg-muted/30 p-4"
          role="document"
          aria-label="Document with inline redline changes"
        >
          {segments.map((segment, i) => {
            if (segment.type === "text") {
              return <span key={i}>{segment.content}</span>;
            }

            // Revision segment: render clause badge + redline markup inline.
            return (
              <span key={i} className="relative inline">
                <Badge
                  variant="outline"
                  className="text-[10px] px-1 py-0 mx-0.5 align-middle border-blue-300 text-blue-600 bg-blue-50"
                >
                  {segment.revision!.clauseNumber}
                </Badge>
                {renderRedlineMarkup(segment.content)}
              </span>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
