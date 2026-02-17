/**
 * BulkActionsToolbar — Bulk accept/reject controls and keyboard shortcut hints.
 *
 * Allows users to accept/reject all visible, by risk level, or by category.
 * Shows keyboard shortcut cheat sheet.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  Keyboard,
  RotateCcw,
  Zap,
} from "lucide-react";
import type { RevisionDecision, LeaseRedlineRevision } from "@/lib/lease-redline/types";

interface Props {
  revisions: LeaseRedlineRevision[];
  decisions: RevisionDecision[];
  focusedIndex: number | null;
  onBulkAcceptVisible: () => void;
  onBulkRejectVisible: () => void;
  onBulkAcceptByRisk: (levels: string[], revisions: { riskLevel?: string }[]) => void;
  onBulkRejectByRisk: (levels: string[], revisions: { riskLevel?: string }[]) => void;
  onBulkAcceptByCategory: (cats: string[], revisions: { category?: string }[]) => void;
  onBulkRejectByCategory: (cats: string[], revisions: { category?: string }[]) => void;
  onResetAll: () => void;
}

export function BulkActionsToolbar({
  revisions,
  decisions,
  focusedIndex,
  onBulkAcceptVisible,
  onBulkRejectVisible,
  onBulkAcceptByRisk,
  onBulkRejectByRisk,
  onBulkAcceptByCategory,
  onBulkRejectByCategory,
  onResetAll,
}: Props) {
  const pendingCount = decisions.filter((d) => d === "pending").length;
  const acceptedCount = decisions.filter((d) => d === "accepted").length;
  const rejectedCount = decisions.filter((d) => d === "rejected").length;
  const modifiedCount = decisions.filter((d) => d === "modified").length;

  // Unique categories and risk levels from revisions
  const categories = [...new Set(revisions.map((r) => r.category).filter(Boolean))] as string[];
  const riskLevels = ["critical", "high", "medium", "low"].filter((level) =>
    revisions.some((r) => r.riskLevel === level)
  );

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-muted/50 border">
      {/* Status badges */}
      <div className="flex items-center gap-1.5 mr-2">
        <Badge variant="outline" className="text-xs">
          {pendingCount} pending
        </Badge>
        <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-100">
          {acceptedCount} accepted
        </Badge>
        <Badge className="text-xs bg-red-100 text-red-800 hover:bg-red-100">
          {rejectedCount} rejected
        </Badge>
        {modifiedCount > 0 && (
          <Badge className="text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            {modifiedCount} modified
          </Badge>
        )}
      </div>

      <div className="h-4 w-px bg-border" />

      {/* Bulk Accept Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            Accept
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel className="text-xs">
            Accept Revisions
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onBulkAcceptVisible}>
            <Zap className="h-3 w-3 mr-2" />
            All pending ({pendingCount})
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            By Risk Level
          </DropdownMenuLabel>
          {riskLevels.map((level) => {
            const count = revisions.filter(
              (r, i) => r.riskLevel === level && decisions[i] === "pending"
            ).length;
            return (
              <DropdownMenuItem
                key={level}
                onClick={() => onBulkAcceptByRisk([level], revisions)}
                disabled={count === 0}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)} ({count})
              </DropdownMenuItem>
            );
          })}
          {categories.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                By Category
              </DropdownMenuLabel>
              {categories.slice(0, 8).map((cat) => {
                const count = revisions.filter(
                  (r, i) => r.category === cat && decisions[i] === "pending"
                ).length;
                return (
                  <DropdownMenuItem
                    key={cat}
                    onClick={() => onBulkAcceptByCategory([cat], revisions)}
                    disabled={count === 0}
                  >
                    {cat} ({count})
                  </DropdownMenuItem>
                );
              })}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Bulk Reject Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
            <XCircle className="h-3 w-3 text-red-600" />
            Reject
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel className="text-xs">
            Reject Revisions
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onBulkRejectVisible}>
            <Zap className="h-3 w-3 mr-2" />
            All pending ({pendingCount})
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            By Risk Level
          </DropdownMenuLabel>
          {riskLevels.map((level) => {
            const count = revisions.filter(
              (r, i) => r.riskLevel === level && decisions[i] === "pending"
            ).length;
            return (
              <DropdownMenuItem
                key={level}
                onClick={() => onBulkRejectByRisk([level], revisions)}
                disabled={count === 0}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)} ({count})
              </DropdownMenuItem>
            );
          })}
          {categories.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                By Category
              </DropdownMenuLabel>
              {categories.slice(0, 8).map((cat) => {
                const count = revisions.filter(
                  (r, i) => r.category === cat && decisions[i] === "pending"
                ).length;
                return (
                  <DropdownMenuItem
                    key={cat}
                    onClick={() => onBulkRejectByCategory([cat], revisions)}
                    disabled={count === 0}
                  >
                    {cat} ({count})
                  </DropdownMenuItem>
                );
              })}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Reset */}
      <Button
        variant="ghost"
        size="sm"
        className="text-xs h-7 gap-1"
        onClick={onResetAll}
      >
        <RotateCcw className="h-3 w-3" />
        Reset
      </Button>

      <div className="flex-1" />

      {/* Focused indicator */}
      {focusedIndex !== null && (
        <Badge variant="secondary" className="text-xs">
          Focused: Clause {focusedIndex + 1}
        </Badge>
      )}

      {/* Keyboard shortcut help */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
            <Keyboard className="h-3 w-3" />
            Shortcuts
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="end">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Keyboard Shortcuts</h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next revision</span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                  j
                </kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Previous revision</span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                  k
                </kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Accept focused</span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                  a
                </kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reject focused</span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                  r
                </kbd>
              </div>
              <div className="h-px bg-border my-1" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Accept all visible</span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                  Shift+A
                </kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reject all visible</span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                  Shift+R
                </kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Clear focus</span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                  Esc
                </kbd>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
