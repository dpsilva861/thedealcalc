import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { SyndicationProvider, useSyndication } from "@/contexts/SyndicationContext";
import SyndicationInputsPanel from "@/components/syndication/SyndicationInputsPanel";
import SyndicationResultsPanel from "@/components/syndication/SyndicationResultsPanel";
import SyndicationAuditPanel from "@/components/syndication/SyndicationAuditPanel";
import SyndicationSelfTest from "@/components/syndication/SyndicationSelfTest";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trackEvent } from "@/lib/analytics";

function SyndicationContent() {
  const [searchParams] = useSearchParams();
  const isDevMode = searchParams.get("dev") === "1";
  const { results } = useSyndication();

  useEffect(() => {
    trackEvent("page_view", { page: "/syndication" });
  }, []);

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4 space-y-6 overflow-x-hidden">
      <div>
        <h1 className="text-3xl font-bold">Syndication Analyzer</h1>
        <p className="text-muted-foreground">
          Model LP/GP waterfall structures with preferred returns, promote calculations, and full audit trails.
        </p>
      </div>

      <Tabs defaultValue="inputs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inputs">Deal Setup</TabsTrigger>
          <TabsTrigger value="results" disabled={!results}>Results</TabsTrigger>
          <TabsTrigger value="audit" disabled={!results}>Audit Mode</TabsTrigger>
        </TabsList>

        <TabsContent value="inputs">
          <SyndicationInputsPanel />
        </TabsContent>

        <TabsContent value="results">
          <SyndicationResultsPanel />
        </TabsContent>

        <TabsContent value="audit">
          <SyndicationAuditPanel />
        </TabsContent>
      </Tabs>

      {isDevMode && (
        <div className="mt-6">
          <SyndicationSelfTest />
        </div>
      )}
    </div>
  );
}

export default function Syndication() {
  return (
    <Layout showFooter={false}>
      <SyndicationProvider>
        <SyndicationContent />
      </SyndicationProvider>
    </Layout>
  );
}
