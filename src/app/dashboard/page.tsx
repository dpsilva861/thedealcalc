"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Eye,
  Upload,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface DashboardJob {
  id: string;
  status: string;
  input_filename: string;
  property_type: string | null;
  deal_type: string | null;
  redline_mode: string;
  perspective: string;
  deal_score: number | null;
  risk_level: string | null;
  has_docx: boolean;
  has_pdf: boolean;
  processing_time_ms: number | null;
  created_at: string;
  completed_at: string | null;
}

interface DashboardData {
  user: { name: string | null; email: string };
  stats: {
    totalRedlines: number;
    avgDealScore: number;
    mostCommonCategory: string;
  };
  jobs: DashboardJob[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const PROPERTY_TYPES = [
  { value: "", label: "All Property Types" },
  { value: "retail", label: "Retail" },
  { value: "office", label: "Office" },
  { value: "industrial", label: "Industrial" },
  { value: "mixed-use", label: "Mixed-Use" },
  { value: "multifamily", label: "Multifamily" },
  { value: "medical", label: "Medical" },
  { value: "restaurant", label: "Restaurant" },
];

const DEAL_TYPES = [
  { value: "", label: "All Deal Types" },
  { value: "new_lease", label: "New Lease" },
  { value: "renewal", label: "Renewal" },
  { value: "amendment", label: "Amendment" },
  { value: "sublease", label: "Sublease" },
  { value: "assignment", label: "Assignment" },
  { value: "expansion", label: "Expansion" },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatLabel(value: string | null): string {
  if (!value) return "-";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getRiskColor(risk: string | null): string {
  switch (risk?.toLowerCase()) {
    case "high":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "medium":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "low":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
}

function getScoreColor(score: number | null): string {
  if (!score) return "text-gray-400";
  if (score >= 7) return "text-green-400";
  if (score >= 4) return "text-yellow-400";
  return "text-red-400";
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [propertyType, setPropertyType] = useState("");
  const [dealType, setDealType] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (propertyType) params.set("propertyType", propertyType);
      if (dealType) params.set("dealType", dealType);

      const res = await fetch(`/api/dashboard?${params}`);
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Failed to load dashboard");
      }
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [page, propertyType, dealType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (type: "property" | "deal", value: string) => {
    setPage(1);
    if (type === "property") setPropertyType(value);
    else setDealType(value);
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={fetchData}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { user, stats, jobs, pagination } = data;
  const isEmpty = stats.totalRedlines === 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Your Redlines</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user.name || user.email}
            </p>
          </div>
          <Link href="/redline">
            <Button className="mt-4 sm:mt-0" size="lg">
              <Upload className="h-4 w-4 mr-2" />
              Redline Another LOI
            </Button>
          </Link>
        </div>

        {isEmpty ? (
          /* Empty State */
          <Card className="border-dashed border-2 border-border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No redlines yet
              </h2>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                You haven&apos;t analyzed any LOIs yet. Upload your first one for
                just $2 and get an AI-powered redline analysis in seconds.
              </p>
              <Link href="/redline">
                <Button size="lg">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First LOI
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Redlines
                  </CardTitle>
                  <FileText className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {stats.totalRedlines}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Average Deal Score
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${getScoreColor(stats.avgDealScore)}`}>
                    {stats.avgDealScore > 0 ? `${stats.avgDealScore}/10` : "N/A"}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Most Common Issue
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-foreground truncate">
                    {formatLabel(stats.mostCommonCategory)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <select
                value={propertyType}
                onChange={(e) => handleFilterChange("property", e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
                {PROPERTY_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>
                    {pt.label}
                  </option>
                ))}
              </select>

              <select
                value={dealType}
                onChange={(e) => handleFilterChange("deal", e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
                {DEAL_TYPES.map((dt) => (
                  <option key={dt.value} value={dt.value}>
                    {dt.label}
                  </option>
                ))}
              </select>

              {(propertyType || dealType) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPropertyType("");
                    setDealType("");
                    setPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {/* History Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Filename</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Property Type</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Deal Type</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Mode</th>
                        <th className="text-center p-4 text-sm font-medium text-muted-foreground">Score</th>
                        <th className="text-center p-4 text-sm font-medium text-muted-foreground">Risk</th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => (
                        <tr key={job.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                          <td className="p-4 text-sm text-foreground">
                            {formatDate(job.created_at)}
                          </td>
                          <td className="p-4 text-sm text-foreground max-w-[200px] truncate">
                            {job.input_filename}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">
                            {formatLabel(job.property_type)}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">
                            {formatLabel(job.deal_type)}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground hidden lg:table-cell capitalize">
                            {job.redline_mode}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`text-sm font-bold ${getScoreColor(job.deal_score)}`}>
                              {job.deal_score ?? "-"}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <Badge className={getRiskColor(job.risk_level)} variant="outline">
                              {job.risk_level ? formatLabel(job.risk_level) : "-"}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link href={`/results/${job.id}`}>
                                <Button variant="ghost" size="sm" title="View Results">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              {job.has_docx && (
                                <Link href={`/api/results/${job.id}?format=docx`}>
                                  <Button variant="ghost" size="sm" title="Download DOCX">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </Link>
                              )}
                              {job.has_pdf && (
                                <Link href={`/api/results/${job.id}?format=pdf`}>
                                  <Button variant="ghost" size="sm" title="Download PDF">
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {jobs.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No redlines match your filters.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.limit + 1}-
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                  {pagination.total} results
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
