import { Helmet } from "react-helmet-async";
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
import { SyndicationResults as SyndicationResultsType, SyndicationInputs } from "@/lib/calculators/syndication/types";
import { devLog } from "@/lib/devLogger";
import { trackEvent } from "@/lib/analytics";
import { ExportDropdown } from "@/components/exports/ExportDropdown";
import { transformSyndicationToCanonical } from "@/lib/exports/transformers";
import { exportSyndicationToExcel, exportSyndicationToCSV, exportSyndicationToPDF } from "@/lib/calculators/syndication/exports";

function SyndicationResultsContent() {
  const [searchParams] = useSearchParams();
  const isDevMode = searchParams.get("dev") === "1";
  const { results: contextResults, inputs: contextInputs } = useSyndication();
  const [localResults, setLocalResults] = useState<SyndicationResultsType | null>(null);
  const [localInputs, setLocalInputs] = useState<SyndicationInputs | null>(null);

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
      
      for (const key of ["dealcalc:syndication:state", "syndication_state"]) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.inputs) {
              setLocalInputs(parsed.inputs);
              break;
            }
          }
        } catch (err) {
          localStorage.removeItem(key);
        }
      }
    }
  }, [contextResults]);

  const results = contextResults || localResults;
  const inputs = contextInputs || localInputs;

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

  const handleExportPDF = async () => {
    if (!inputs) return;
    devLog.exportClicked("Syndication", "pdf");
    exportSyndicationToPDF({ inputs, results });
    trackEvent("export_pdf", { calculator: "syndication" });
  };

  const handleExportCSV = () => {
    if (!inputs) return;
    devLog.exportClicked("Syndication", "csv");
    exportSyndicationToCSV({ inputs, results });
    trackEvent("export_csv", { calculator: "syndication" });
  };

  const handleExportExcel = async () => {
    if (!inputs) return;
    devLog.exportClicked("Syndication", "excel");
    await exportSyndicationToExcel({ inputs, results });
    trackEvent("export_excel", { calculator: "syndication" });
  };

  const handleExportDocx = async () => {
    if (!inputs) return;
    devLog.exportClicked("Syndication", "docx");
    const { exportToDocx } = await import("@/lib/exports/docx");
    const canonicalData = transformSyndicationToCanonical(inputs, results);
    await exportToDocx(canonicalData);
  };

  const handleExportPptx = async () => {
    if (!inputs) return;
    devLog.exportClicked("Syndication", "pptx");
    const { exportToPptx } = await import("@/lib/exports/pptx");
    const canonicalData = transformSyndicationToCanonical(inputs, results);
    await exportToPptx(canonicalData);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Syndication Results</h1>
          <p className="text-sm text-muted-foreground">{inputs?.deal_name || "Deal"} - LP/GP waterfall</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/syndication"><ArrowLeft className="h-4 w-4 mr-2" />Edit Inputs</Link>
          </Button>
          <ExportDropdown
            calculatorType="syndication"
            onExportExcel={handleExportExcel}
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
            onExportDocx={handleExportDocx}
            onExportPptx={handleExportPptx}
          />
        </div>
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
      <Helmet>
        <title>Syndication Analysis Results | GP/LP Waterfall — TheDealCalc</title>
        <meta name="description" content="View your syndication deal analysis results including LP IRR, equity multiple, GP promote, and waterfall distributions." />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://thedealcalc.com/syndication" />
      </Helmet>
      <SyndicationProvider>
        <SyndicationResultsContent />
      </SyndicationProvider>
    </Layout>
  );
}
