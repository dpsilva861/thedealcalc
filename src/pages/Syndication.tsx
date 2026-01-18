import { useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { SyndicationProvider, useSyndication } from "@/contexts/SyndicationContext";
import { SyndicationStepIndicator } from "@/components/syndication/SyndicationStepIndicator";
import { SyndicationPresetSelector } from "@/components/syndication/SyndicationPresetSelector";
import {
  SyndicationAcquisitionStep,
  SyndicationDebtStep,
  SyndicationEquityStep,
  SyndicationProformaStep,
  SyndicationExitStep,
  SyndicationWaterfallStep,
  SyndicationReviewStep,
} from "@/components/syndication/steps";
import { CalculatorSelector } from "@/components/calculators/CalculatorSelector";
import { RelatedCalculators } from "@/components/calculators/RelatedCalculators";
import { SavedScenariosPanel } from "@/components/calculators/SavedScenariosPanel";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { validateSyndicationInputs } from "@/lib/calculators/syndication/validation";
import { DEFAULT_SYNDICATION_INPUTS } from "@/lib/calculators/syndication/types";
import { useSyndicationScenarios } from "@/hooks/useSyndicationScenarios";
import { copyShareLink, decodeSyndicationParams } from "@/hooks/useShareLink";
import { trackEvent } from "@/lib/analytics";
import { ArrowLeft, ArrowRight, Play, Share2 } from "lucide-react";
import { toast } from "sonner";
import SyndicationSelfTest from "@/components/syndication/SyndicationSelfTest";
import { useStepScrollToTop } from "@/hooks/useStepScrollToTop";

const STEPS = [
  { label: "Acquisition", component: SyndicationAcquisitionStep },
  { label: "Debt", component: SyndicationDebtStep },
  { label: "Equity", component: SyndicationEquityStep },
  { label: "Pro Forma", component: SyndicationProformaStep },
  { label: "Exit", component: SyndicationExitStep },
  { label: "Waterfall", component: SyndicationWaterfallStep },
  { label: "Review", component: SyndicationReviewStep },
];

const faqs = [
  {
    question: "What is a real estate syndication?",
    answer: "A syndication is a partnership where multiple investors pool capital to acquire larger properties. The General Partner (GP) manages the deal while Limited Partners (LPs) provide capital and receive passive returns."
  },
  {
    question: "What is a preferred return (pref)?",
    answer: "A preferred return is a hurdle rate that LPs must receive before the GP participates in profits. Common prefs are 6-10% annually, paid from operating cash flow or at sale."
  },
  {
    question: "How does the waterfall distribution work?",
    answer: "A waterfall defines how profits are split between LP and GP at different return thresholds. Typically, LPs receive their pref first, then returns are split with the GP receiving an increasing 'promote' at higher IRR tiers."
  },
  {
    question: "Is this syndication calculator free?",
    answer: "Yes! TheDealCalc syndication analyzer is 100% free with no signup. Model complex waterfall structures, LP/GP splits, and full deal economics."
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://thedealcalc.com/" },
        { "@type": "ListItem", "position": 2, "name": "Syndication Analyzer", "item": "https://thedealcalc.com/syndication" }
      ]
    },
    {
      "@type": "SoftwareApplication",
      "name": "Syndication Analyzer",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Any",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "description": "Free real estate syndication calculator. Model LP/GP waterfall structures, preferred returns, and investor distributions.",
      "url": "https://thedealcalc.com/syndication"
    },
    {
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
      }))
    }
  ]
};

function SyndicationContent() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isDevMode = searchParams.get("dev") === "1";
  const {
    currentStep,
    setCurrentStep,
    runAnalysis,
    inputs,
    setInputs,
    validation,
    setHasAttemptedRun,
  } = useSyndication();

  const topRef = useStepScrollToTop(currentStep);

  // Saved scenarios
  const { scenarios, saveScenario, loadScenario, deleteScenario } = useSyndicationScenarios(
    inputs,
    useCallback((loaded) => setInputs(loaded), [setInputs])
  );

  // Load share params on mount
  useEffect(() => {
    const decoded = decodeSyndicationParams(searchParams);
    if (decoded) {
      const defaults = DEFAULT_SYNDICATION_INPUTS;
      const merged = {
        ...defaults,
        hold_period_months: decoded.hold_period_months || defaults.hold_period_months,
        acquisition: { ...defaults.acquisition, ...decoded.acquisition },
        debt: { ...defaults.debt, ...decoded.debt },
        equity: { ...defaults.equity, ...decoded.equity },
        proforma: { ...defaults.proforma, ...decoded.proforma },
        exit: { ...defaults.exit, ...decoded.exit },
        waterfall: { ...defaults.waterfall, ...decoded.waterfall },
      };
      setInputs(merged);
      toast.info('Inputs loaded from shared link');
      setSearchParams({}, { replace: true });
    }
  }, []);

  useEffect(() => {
    trackEvent("page_view", { page: "/syndication" });
  }, []);

  const handleShare = () => copyShareLink('syndication', inputs);

  const CurrentStepComponent = STEPS[currentStep].component;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRunAnalysis = () => {
    setHasAttemptedRun(true);
    const v = validateSyndicationInputs(inputs);
    if (!v.isValid) {
      v.errors.forEach((err) => toast.error(err.message));
      return;
    }
    v.warnings.forEach((w) => toast.warning(w.message));
    trackEvent("calculate_syndication", {
      hold_period: inputs.hold_period_months,
      ltv: inputs.debt.ltv_or_ltc_pct,
      pref_rate: inputs.waterfall.pref_rate_annual
    });
    runAnalysis();
    navigate("/syndication/results");
  };

  return (
    <>
      <Helmet>
        <title>Syndication Calculator (Free) | LP/GP Waterfall Analyzer — TheDealCalc</title>
        <meta name="description" content="Free real estate syndication calculator. Model LP/GP waterfall structures, preferred returns, promote calculations, and investor distributions. No signup required." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thedealcalc.com/syndication" />
        <meta property="og:title" content="Syndication Calculator (Free) | LP/GP Waterfall Analyzer — TheDealCalc" />
        <meta property="og:description" content="Free syndication analyzer for real estate sponsors. Model complex waterfall structures and investor returns." />
        <meta property="og:url" content="https://thedealcalc.com/syndication" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://thedealcalc.com/og/og-syndication.png" />
        <meta property="og:site_name" content="TheDealCalc" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Syndication Calculator (Free) — TheDealCalc" />
        <meta name="twitter:description" content="Free LP/GP waterfall analyzer for real estate sponsors." />
        <meta name="twitter:image" content="https://thedealcalc.com/og/og-syndication.png" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div ref={topRef} className="h-0" tabIndex={-1} aria-hidden="true" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <CalculatorSelector />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Syndication Analyzer</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copies a link that restores these inputs. Does not auto-run analysis.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <SyndicationPresetSelector />
          </div>
        </div>

        <SyndicationStepIndicator
          steps={STEPS}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
        />

        <div className="mt-6">
          <CurrentStepComponent />
        </div>

        <div className="flex justify-between mt-6 mb-6">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
          {currentStep === STEPS.length - 1 ? (
            <Button onClick={handleRunAnalysis} disabled={!validation.isValid}>
              <Play className="h-4 w-4 mr-2" />Run Analysis
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next<ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Saved Scenarios */}
        <SavedScenariosPanel
          scenarios={scenarios}
          onSave={saveScenario}
          onLoad={loadScenario}
          onDelete={deleteScenario}
        />

        {isDevMode && (
          <div className="mt-8">
            <SyndicationSelfTest />
          </div>
        )}

        {/* SEO Content */}
        <section className="mt-12 prose prose-neutral dark:prose-invert max-w-none">
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">
            What is a Real Estate Syndication?
          </h2>
          <p className="text-muted-foreground mb-4">
            A real estate syndication is a partnership structure that allows multiple investors to 
            pool capital for acquiring larger commercial properties. The General Partner (GP or Sponsor) 
            sources the deal, manages the asset, and executes the business plan. Limited Partners (LPs) 
            provide the majority of equity capital and receive passive returns.
          </p>
          <p className="text-muted-foreground mb-8">
            This calculator helps sponsors model deal economics, structure fair LP/GP splits, and 
            project investor returns across various scenarios. It's essential for preparing investor 
            decks and validating deal assumptions before raising capital.
          </p>

          <h3 className="text-xl font-display font-semibold text-foreground mb-4">
            How to Use This Syndication Calculator
          </h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-8">
            <li>Enter acquisition costs: purchase price, closing costs, and CapEx budget</li>
            <li>Configure debt terms: LTV, interest rate, and amortization</li>
            <li>Set equity structure: LP/GP split and GP co-invest</li>
            <li>Model operating pro forma: rent growth, expense growth, vacancy</li>
            <li>Define exit assumptions and waterfall terms (pref rate, promotes)</li>
          </ul>

          <h3 className="text-xl font-display font-semibold text-foreground mb-4">
            Key Outputs
          </h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-8">
            <li><strong>LP IRR:</strong> Internal rate of return for limited partners over the hold period</li>
            <li><strong>LP Equity Multiple:</strong> Total distributions divided by initial LP investment</li>
            <li><strong>GP Promote:</strong> Additional profit share earned by GP above their pro-rata ownership</li>
            <li><strong>Waterfall Audit:</strong> Step-by-step breakdown of how cash flows to each party</li>
          </ul>

          <h3 className="text-xl font-display font-semibold text-foreground mb-4">
            Frequently Asked Questions
          </h3>
          <Accordion type="single" collapsible className="mb-8">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <p className="text-xs text-muted-foreground text-center mt-8">
          For educational purposes only. Not investment, legal, or tax advice.
        </p>
      </div>

      {/* Related Calculators */}
      <RelatedCalculators currentPath="/syndication" />
    </>
  );
}

export default function Syndication() {
  return (
    <Layout>
      <SyndicationProvider>
        <SyndicationContent />
      </SyndicationProvider>
    </Layout>
  );
}
