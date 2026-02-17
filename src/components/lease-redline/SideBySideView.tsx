/**
 * SideBySideView — Split-pane view showing original vs redlined document.
 *
 * Uses react-resizable-panels for a draggable divider.
 * Left: original text. Right: redlined text with accepted changes applied.
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Columns2, X } from "lucide-react";
import type {
  LeaseRedlineRevision,
  RevisionDecision,
} from "@/lib/lease-redline/types";

interface Props {
  originalText: string;
  revisions: LeaseRedlineRevision[];
  decisions: RevisionDecision[];
  onClose: () => void;
}

function buildMarkupText(
  original: string,
  revisions: LeaseRedlineRevision[],
  decisions: RevisionDecision[]
): { segments: { text: string; type: "unchanged" | "deleted" | "added" }[] } {
  const segments: { text: string; type: "unchanged" | "deleted" | "added" }[] =
    [];

  // Find positions of all accepted revisions
  type Replacement = {
    start: number;
    end: number;
    original: string;
    replacement: string;
  };
  const reps: Replacement[] = [];

  for (let i = 0; i < revisions.length; i++) {
    if (decisions[i] !== "accepted") continue;
    const orig = revisions[i].originalLanguage;
    const idx = original.indexOf(orig);
    if (idx >= 0) {
      reps.push({
        start: idx,
        end: idx + orig.length,
        original: orig,
        replacement: revisions[i].cleanReplacement,
      });
    }
  }

  // Sort by position
  reps.sort((a, b) => a.start - b.start);

  // Build segments
  let cursor = 0;
  for (const rep of reps) {
    if (rep.start > cursor) {
      segments.push({ text: original.slice(cursor, rep.start), type: "unchanged" });
    }
    segments.push({ text: rep.original, type: "deleted" });
    segments.push({ text: rep.replacement, type: "added" });
    cursor = rep.end;
  }
  if (cursor < original.length) {
    segments.push({ text: original.slice(cursor), type: "unchanged" });
  }

  return { segments };
}

export function SideBySideView({
  originalText,
  revisions,
  decisions,
  onClose,
}: Props) {
  const { segments } = useMemo(
    () => buildMarkupText(originalText, revisions, decisions),
    [originalText, revisions, decisions]
  );

  const acceptedCount = decisions.filter((d) => d === "accepted").length;
  const totalRevisions = revisions.length;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Columns2 className="h-5 w-5 text-primary" />
            Side-by-Side View
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {acceptedCount}/{totalRevisions} accepted
            </Badge>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResizablePanelGroup
          direction="horizontal"
          className="min-h-[400px] max-h-[600px] rounded-lg border"
        >
          {/* Original Document */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col">
              <div className="px-3 py-2 bg-muted/50 border-b flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Original
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {originalText.split("\n").length} lines
                </span>
              </div>
              <div className="flex-1 overflow-auto p-3">
                <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground">
                  {originalText}
                </pre>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Redlined Document */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col">
              <div className="px-3 py-2 bg-muted/50 border-b flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Redlined
                </Badge>
                <span className="text-xs text-muted-foreground">
                  showing accepted changes
                </span>
              </div>
              <div className="flex-1 overflow-auto p-3">
                <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono">
                  {segments.map((seg, i) => {
                    if (seg.type === "deleted") {
                      return (
                        <span
                          key={i}
                          className="bg-red-100 text-red-700 line-through"
                        >
                          {seg.text}
                        </span>
                      );
                    }
                    if (seg.type === "added") {
                      return (
                        <span
                          key={i}
                          className="bg-green-100 text-green-700 font-bold underline"
                        >
                          {seg.text}
                        </span>
                      );
                    }
                    return (
                      <span key={i} className="text-foreground">
                        {seg.text}
                      </span>
                    );
                  })}
                </pre>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        <p className="text-xs text-muted-foreground mt-2 text-center">
          Drag the handle to resize panels.{" "}
          <span className="text-red-600 line-through">Red strikethrough</span> =
          deleted,{" "}
          <span className="text-green-600 font-bold underline">
            green underline
          </span>{" "}
          = added
        </p>
      </CardContent>
    </Card>
  );
}
