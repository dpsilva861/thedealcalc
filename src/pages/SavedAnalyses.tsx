import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatPercent } from "@/lib/underwriting";
import { FolderOpen, Trash2, Eye, Plus, MapPin, Calendar } from "lucide-react";
import { toast } from "sonner";

interface SavedAnalysis {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip_code: string;
  inputs: unknown;
  results: unknown;
  created_at: string;
}

function SavedAnalysesContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalyses();
    }
  }, [user]);

  const fetchAnalyses = async () => {
    try {
      const { data, error } = await supabase
        .from("saved_analyses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnalyses(data || []);
    } catch (err) {
      console.error("Failed to fetch analyses:", err);
      toast.error("Failed to load saved analyses");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this analysis?")) return;

    try {
      const { error } = await supabase
        .from("saved_analyses")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Analysis deleted");
    } catch (err) {
      console.error("Failed to delete:", err);
      toast.error("Failed to delete analysis");
    }
  };

  const handleView = (analysis: SavedAnalysis) => {
    // Store the analysis data in sessionStorage for the results page
    sessionStorage.setItem("uw:savedAnalysis", JSON.stringify(analysis));
    navigate("/results");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-cream-dark">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Saved Analyses
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                View and manage your property analyses
              </p>
            </div>
            <Button onClick={() => navigate("/underwrite")}>
              <Plus className="h-4 w-4 mr-2" />
              New Analysis
            </Button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : analyses.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-display text-lg font-semibold mb-2">
                No saved analyses yet
              </h2>
              <p className="text-muted-foreground mb-6">
                Run your first underwriting analysis to get started
              </p>
              <Button onClick={() => navigate("/underwrite")}>
                Start New Analysis
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {analyses.map((analysis) => {
                const results = analysis.results as { metrics?: { irr?: number; cocYear1?: number; equityMultiple?: number } };
                const metrics = results?.metrics;

                return (
                  <div
                    key={analysis.id}
                    className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-display font-semibold text-foreground mb-1">
                          {analysis.address}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {analysis.city}, {analysis.state} {analysis.zip_code}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(analysis.created_at)}
                          </span>
                        </div>

                        {metrics && (
                          <div className="flex gap-6 text-sm">
                            <div>
                              <span className="text-muted-foreground">IRR:</span>{" "}
                              <span className="font-medium">
                                {formatPercent(metrics.irr || 0)}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">CoC:</span>{" "}
                              <span className="font-medium">
                                {formatPercent(metrics.cocYear1 || 0)}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Equity Multiple:</span>{" "}
                              <span className="font-medium">
                                {(metrics.equityMultiple || 0).toFixed(2)}x
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(analysis)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(analysis.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SavedAnalyses() {
  return (
    <Layout showFooter={false}>
      <AuthGuard requireSubscription={false}>
        <SavedAnalysesContent />
      </AuthGuard>
    </Layout>
  );
}
