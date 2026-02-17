/**
 * DealStatusBoard — Shows all active deals with status, timing, and documents.
 *
 * Central dashboard for managing the deal pipeline.
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FolderOpen,
  Plus,
  Trash2,
  FileText,
  Clock,
  MapPin,
  User,
  Search,
  ChevronRight,
  Building2,
} from "lucide-react";
import type { DealFolder } from "@/lib/lease-redline/types";
import { DOCUMENT_TYPE_LABELS } from "@/lib/lease-redline/types";

interface Props {
  deals: DealFolder[];
  onCreateDeal: (
    name: string,
    propertyAddress?: string,
    tenantName?: string,
    jurisdiction?: string
  ) => string;
  onUpdateDeal: (id: string, updates: Partial<DealFolder>) => void;
  onDeleteDeal: (id: string) => void;
  onSelectDeal: (dealId: string) => void;
  selectedDealId: string | null;
}

export function DealStatusBoard({
  deals,
  onCreateDeal,
  onUpdateDeal,
  onDeleteDeal,
  onSelectDeal,
  selectedDealId,
}: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Create deal form
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newTenant, setNewTenant] = useState("");
  const [newJurisdiction, setNewJurisdiction] = useState("");

  const filtered = useMemo(() => {
    return deals.filter((d) => {
      if (search) {
        const q = search.toLowerCase();
        const matches =
          d.name.toLowerCase().includes(q) ||
          d.propertyAddress?.toLowerCase().includes(q) ||
          d.tenantName?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (filterStatus !== "all") {
        // Filter based on document statuses
        const hasPending = d.documents.some((doc) => doc.status === "pending");
        const hasAnalyzed = d.documents.some((doc) => doc.status === "analyzed");
        if (filterStatus === "active" && !hasPending && !hasAnalyzed) return false;
        if (filterStatus === "completed") {
          // A deal is completed when it has documents and none are pending
          const allDone = d.documents.length > 0 && !hasPending;
          if (!allDone) return false;
        }
      }
      return true;
    });
  }, [deals, search, filterStatus]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreateDeal(
      newName,
      newAddress || undefined,
      newTenant || undefined,
      newJurisdiction || undefined
    );
    setNewName("");
    setNewAddress("");
    setNewTenant("");
    setNewJurisdiction("");
    setShowCreate(false);
  };

  const daysSinceUpdate = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "today";
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Deal Pipeline
            <Badge variant="secondary" className="text-xs">
              {deals.length}
            </Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1"
            onClick={() => setShowCreate(!showCreate)}
          >
            <Plus className="h-3 w-3" />
            New Deal
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search deals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-sm h-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-28 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Create Deal Form */}
        {showCreate && (
          <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
            <Input
              placeholder="Deal name (e.g., '123 Main St - Retail Lease')"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Property address"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="text-sm"
              />
              <Input
                placeholder="Tenant name"
                value={newTenant}
                onChange={(e) => setNewTenant(e.target.value)}
                className="text-sm"
              />
            </div>
            <Input
              placeholder="Jurisdiction (e.g., 'California')"
              value={newJurisdiction}
              onChange={(e) => setNewJurisdiction(e.target.value)}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="text-xs"
                onClick={handleCreate}
                disabled={!newName.trim()}
              >
                Create Deal
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

        {/* Deal Cards */}
        <div className="space-y-2 max-h-[500px] overflow-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {deals.length === 0
                  ? "No deals yet. Create one to start organizing."
                  : "No deals match your search."}
              </p>
            </div>
          ) : (
            filtered.map((deal) => {
              const isSelected = deal.id === selectedDealId;
              const docCounts = {
                pending: deal.documents.filter((d) => d.status === "pending").length,
                analyzed: deal.documents.filter((d) => d.status === "analyzed").length,
                reviewed: deal.documents.filter((d) => d.status === "reviewed").length,
              };

              return (
                <div
                  key={deal.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => onSelectDeal(deal.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">
                          {deal.name}
                        </span>
                        <ChevronRight
                          className={`h-3.5 w-3.5 transition-transform ${
                            isSelected ? "rotate-90" : ""
                          }`}
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                        {deal.propertyAddress && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {deal.propertyAddress}
                          </span>
                        )}
                        {deal.tenantName && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {deal.tenantName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {daysSinceUpdate(deal.updatedAt)}
                        </span>
                      </div>

                      {/* Document stats */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="flex items-center gap-1 text-xs">
                          <FileText className="h-3 w-3" />
                          {deal.documents.length} doc{deal.documents.length !== 1 ? "s" : ""}
                        </span>
                        {docCounts.pending > 0 && (
                          <Badge variant="outline" className="text-[10px]">
                            {docCounts.pending} pending
                          </Badge>
                        )}
                        {docCounts.analyzed > 0 && (
                          <Badge className="text-[10px] bg-blue-100 text-blue-800 hover:bg-blue-100">
                            {docCounts.analyzed} analyzed
                          </Badge>
                        )}
                        {docCounts.reviewed > 0 && (
                          <Badge className="text-[10px] bg-green-100 text-green-800 hover:bg-green-100">
                            {docCounts.reviewed} reviewed
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDeal(deal.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Expanded detail */}
                  {isSelected && deal.documents.length > 0 && (
                    <div className="mt-3 pt-3 border-t space-y-1">
                      {deal.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between text-xs py-1"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-3 w-3 text-muted-foreground" />
                            <span>{doc.fileName}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {(DOCUMENT_TYPE_LABELS as Record<string, string>)[
                                doc.documentType
                              ] || doc.documentType}
                            </Badge>
                          </div>
                          <Badge
                            className={`text-[10px] ${
                              doc.status === "reviewed"
                                ? "bg-green-100 text-green-800"
                                : doc.status === "analyzed"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {doc.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
