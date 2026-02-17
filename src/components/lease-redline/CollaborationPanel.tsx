import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Send,
  CheckCircle,
  Users,
  X,
} from "lucide-react";
import type { AnalysisComment } from "@/lib/lease-redline/types";

interface CollaborationPanelProps {
  comments: AnalysisComment[];
  currentUserEmail: string;
  onAddComment: (content: string, revisionIndex?: number) => void;
  onResolveComment: (commentId: string) => void;
  onClose: () => void;
  revisionCount: number;
}

export function CollaborationPanel({
  comments,
  currentUserEmail,
  onAddComment,
  onResolveComment,
  onClose,
  revisionCount,
}: CollaborationPanelProps) {
  const [newComment, setNewComment] = useState("");
  const [selectedRevision, setSelectedRevision] = useState<number | undefined>();
  const [showResolved, setShowResolved] = useState(false);

  const activeComments = comments.filter((c) => !c.resolvedAt);
  const resolvedComments = comments.filter((c) => c.resolvedAt);
  const displayComments = showResolved ? comments : activeComments;

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    onAddComment(newComment.trim(), selectedRevision);
    setNewComment("");
    setSelectedRevision(undefined);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Comments ({activeComments.length} active)
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResolved(!showResolved)}
              className="text-xs"
            >
              {showResolved ? "Hide Resolved" : `Show Resolved (${resolvedComments.length})`}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment list */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {displayComments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No comments yet. Add notes for your team below.
            </p>
          )}
          {displayComments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3 rounded-md border text-sm ${
                comment.resolvedAt
                  ? "bg-muted/50 opacity-60"
                  : "bg-card"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground text-xs">
                    {comment.userEmail}
                  </span>
                  {comment.revisionIndex !== undefined && (
                    <Badge variant="outline" className="text-xs">
                      Clause #{comment.revisionIndex + 1}
                    </Badge>
                  )}
                  {comment.resolvedAt && (
                    <Badge className="bg-green-100 text-green-700 text-xs">
                      Resolved
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {comment.content}
              </p>
              {!comment.resolvedAt && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs"
                  onClick={() => onResolveComment(comment.id)}
                >
                  <CheckCircle className="h-3 w-3" />
                  Resolve
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Add comment form */}
        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center gap-2">
            <select
              value={selectedRevision ?? ""}
              onChange={(e) =>
                setSelectedRevision(
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              className="text-xs px-2 py-1 border rounded-md bg-background"
            >
              <option value="">General comment</option>
              {Array.from({ length: revisionCount }, (_, i) => (
                <option key={i} value={i}>
                  Clause #{i + 1}
                </option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">
              as {currentUserEmail || "Anonymous"}
            </span>
          </div>
          <div className="flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment for your team..."
              className="min-h-[60px] text-sm flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <Button
              onClick={handleSubmit}
              disabled={!newComment.trim()}
              size="sm"
              className="self-end"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
