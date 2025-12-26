import { Layout } from "@/components/layout/Layout";
import { SyndicationProvider, useSyndication } from "@/contexts/SyndicationContext";
import SyndicationResultsPanel from "@/components/syndication/SyndicationResultsPanel";
import SyndicationAuditPanel from "@/components/syndication/SyndicationAuditPanel";
import SyndicationSelfTest from "@/components/syndication/SyndicationSelfTest";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { SyndicationResults as SyndicationResultsType } from "@/lib/calculators/syndication/types";
import { devLog } from "@/lib/devLogger";

function SyndicationResultsContent() {
  const [searchParams] = useSearchParams();
  const isDevMode = searchParams.get("dev") === "1";
  const { results: contextResults, inputs: contextInputs } = useSyndication();
  const [localResults, setLocalResults] = useState<SyndicationResultsType | null>(null);

  useEffect(() => {
    if (!contextResults) {
      for (const key of ["dealcalc:syndication:results", "syndication_results"]) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.metrics && parsed?.sources_and_uses) {
              setLocalResults(parsed);
              devLog.resultsLoaded("Syndication", key);
              break;
            }
          }
        } catch (err) {
          console.error(`[Syndication] Corrupted ${key}:`, err);
          localStorage.removeItem(key);
        }
      }
    }
  }, [contextResults]);

  const results = contextResults || localResults;
  if (!results) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">No results. Run an analysis first.</p>
        <Button asChild>
          <Link to="/syndication">Go to Syndication Analyzer</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Syndication Results</h1>
          <p className="text-sm text-muted-foreground">{contextInputs?.deal_name || "Deal"} - LP/GP waterfall</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/syndication"><ArrowLeft className="h-4 w-4 mr-2" />Edit Inputs</Link>
        </Button>
      </div>
      {isDevMode && <div className="mb-6"><SyndicationSelfTest /></div>}
      <Tabs defaultValue="results" className="w-full">
        <TabsList>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="audit">Audit Mode</TabsTrigger>
        </TabsList>
        <TabsContent value="results"><SyndicationResultsPanel /></TabsContent>
        <TabsContent value="audit"><SyndicationAuditPanel /></TabsContent>
      </Tabs>
      <p className="text-xs text-muted-foreground mt-6 text-center">For educational purposes only. Not investment, legal, or tax advice.</p>
    </div>
  );
}

export default function SyndicationResults() {
  return (
    <Layout>
      <SyndicationProvider>
        <SyndicationResultsContent />
      </SyndicationProvider>
    </Layout>
  );
}
