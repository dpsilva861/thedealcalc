/**
 * NegotiationTimeline — Visual timeline of negotiation rounds.
 *
 * Shows each round with: party, status, timing, revision counts,
 * and elapsed time between rounds.
 */

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
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  X,
  Send,
  Inbox,
} from "lucide-react";
import { useState } from "react";
import type {
  NegotiationRound,
  NegotiationSummary,
  RoundStatus,
  RoundParty,
} from "@/lib/lease-redline/types";

interface Props {
  dealId: string;
  rounds: NegotiationRound[];
  summary: NegotiationSummary | null;
  onCreateRound: (dealId: string, party: RoundParty) => string;
  onUpdateStatus: (roundId: string, status: RoundStatus) => void;
  onUpdateNotes: (roundId: string, notes: string) => void;
  onDeleteRound: (roundId: string) => void;
  onClose: () => void;
}

const STATUS_LABELS: Record<RoundStatus, string> = {
  drafting: "Drafting",
  sent: "Sent",
  awaiting_response: "Awaiting Response",
  received: "Received",
  reviewing: "Reviewing",
  closed: "Closed",
};

const STATUS_COLORS: Record<RoundStatus, string> = {
  drafting: "bg-yellow-100 text-yellow-800",
  sent: "bg-blue-100 text-blue-800",
  awaiting_response: "bg-orange-100 text-orange-800",
  received: "bg-indigo-100 text-indigo-800",
  reviewing: "bg-purple-100 text-purple-800",
  closed: "bg-green-100 text-green-800",
};

function daysBetween(a: string, b: string): number {
  const diff = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24) * 10) / 10;
}

export function NegotiationTimeline({
  dealId,
  rounds,
  summary,
  onCreateRound,
  onUpdateStatus,
  onUpdateNotes,
  onDeleteRound,
  onClose,
}: Props) {
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState("");

  const handleSaveNotes = (roundId: string) => {
    onUpdateNotes(roundId, notesText);
    setEditingNotes(null);
    setNotesText("");
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Negotiation Timeline
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="p-2 rounded bg-muted/50">
              <div className="text-lg font-bold">{summary.totalRounds}</div>
              <div className="text-xs text-muted-foreground">Rounds</div>
            </div>
            <div className="p-2 rounded bg-muted/50">
              <div className="text-lg font-bold">{summary.elapsedDays}d</div>
              <div className="text-xs text-muted-foreground">Elapsed</div>
            </div>
            <div className="p-2 rounded bg-muted/50">
              <div className="text-lg font-bold">
                {summary.avgResponseTimeDays}d
              </div>
              <div className="text-xs text-muted-foreground">Avg Response</div>
            </div>
            <div className="p-2 rounded bg-muted/50">
              <div className="text-lg font-bold">
                {summary.currentParty === "us" ? "Ours" : "Theirs"}
              </div>
              <div className="text-xs text-muted-foreground">Current Ball</div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="relative">
          {rounds.map((round, idx) => {
            const isOurs = round.party === "us";
            const prevRound = idx > 0 ? rounds[idx - 1] : null;
            const gapDays = prevRound
              ? daysBetween(
                  prevRound.sentAt || prevRound.createdAt,
                  round.receivedAt || round.createdAt
                )
              : null;

            return (
              <div key={round.id}>
                {/* Gap indicator */}
                {gapDays !== null && gapDays > 0 && (
                  <div className="flex items-center justify-center py-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="px-3 text-xs text-muted-foreground">
                      {gapDays} day{gapDays !== 1 ? "s" : ""}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                )}

                {/* Round card */}
                <div
                  className={`relative p-4 rounded-lg border mb-2 ${
                    isOurs
                      ? "border-primary/20 bg-primary/5"
                      : "border-orange-200 bg-orange-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {isOurs ? (
                        <Send className="h-4 w-4 text-primary" />
                      ) : (
                        <Inbox className="h-4 w-4 text-orange-600" />
                      )}
                      <span className="font-semibold text-sm">
                        Round {round.roundNumber}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${STATUS_COLORS[round.status]}`}
                      >
                        {STATUS_LABELS[round.status]}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {isOurs ? "Our Turn" : "Their Turn"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(round.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Revision stats */}
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      {round.revisionsAccepted} accepted
                    </div>
                    <div className="flex items-center gap-1 text-red-600">
                      <XCircle className="h-3 w-3" />
                      {round.revisionsRejected} rejected
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <AlertCircle className="h-3 w-3" />
                      {round.revisionsOpen} open
                    </div>
                  </div>

                  {/* Notes */}
                  {editingNotes === round.id ? (
                    <div className="mt-2 space-y-2">
                      <Textarea
                        value={notesText}
                        onChange={(e) => setNotesText(e.target.value)}
                        placeholder="Add notes about this round..."
                        className="text-xs min-h-[60px]"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="text-xs h-6"
                          onClick={() => handleSaveNotes(round.id)}
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-6"
                          onClick={() => setEditingNotes(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : round.notes ? (
                    <p
                      className="mt-2 text-xs text-muted-foreground italic cursor-pointer hover:text-foreground"
                      onClick={() => {
                        setEditingNotes(round.id);
                        setNotesText(round.notes || "");
                      }}
                    >
                      {round.notes}
                    </p>
                  ) : (
                    <button
                      className="mt-2 text-xs text-muted-foreground hover:text-foreground underline"
                      onClick={() => {
                        setEditingNotes(round.id);
                        setNotesText("");
                      }}
                    >
                      Add notes
                    </button>
                  )}

                  {/* Status update */}
                  <div className="flex items-center gap-2 mt-3">
                    <Select
                      value={round.status}
                      onValueChange={(val) =>
                        onUpdateStatus(round.id, val as RoundStatus)
                      }
                    >
                      <SelectTrigger className="h-7 text-xs w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([val, label]) => (
                          <SelectItem key={val} value={val} className="text-xs">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 text-destructive hover:text-destructive"
                      onClick={() => onDeleteRound(round.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add new round */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1 flex-1"
            onClick={() => onCreateRound(dealId, "us")}
          >
            <ArrowRight className="h-3 w-3" />
            Add Our Round
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1 flex-1"
            onClick={() => onCreateRound(dealId, "counterparty")}
          >
            <ArrowLeft className="h-3 w-3" />
            Add Their Round
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
