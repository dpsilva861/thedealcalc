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
        <title>Syndication Calculator | LP/GP Waterfall | TheDealCalc</title>
        <meta name="description" content="Calculate syndication returns instantly. Model LP/GP waterfall structures, preferred returns, and promote calculations. Free, no signup required." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thedealcalc.com/syndication" />
        <meta property="og:title" content="Syndication Calculator | LP/GP Waterfall | TheDealCalc" />
        <meta property="og:description" content="Free syndication analyzer for real estate sponsors. Model complex waterfall structures and investor returns." />
        <meta property="og:url" content="https://thedealcalc.com/syndication" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://thedealcalc.com/og/og-syndication.png" />
        <meta property="og:site_name" content="TheDealCalc" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Syndication Calculator | LP/GP Waterfall | TheDealCalc" />
        <meta name="twitter:description" content="Free LP/GP waterfall analyzer for real estate sponsors and investors." />
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

        {/* SEO Content - Comprehensive educational content */}
        <section className="mt-12 prose prose-neutral dark:prose-invert max-w-none">
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">
            What is a Real Estate Syndication?
          </h2>
          <p className="text-muted-foreground mb-4">
            A real estate syndication is a partnership structure that allows multiple investors to 
            pool capital for acquiring larger commercial properties that would be impossible to purchase individually. 
            The General Partner (GP or Sponsor) sources the deal, manages the asset, executes the business plan, and 
            handles investor communications. Limited Partners (LPs) provide the majority of equity capital and receive 
            passive returns without management responsibilities.
          </p>
          <p className="text-muted-foreground mb-8">
            This syndication calculator helps sponsors model deal economics, structure fair LP/GP splits, and 
            project investor returns across various scenarios. It's essential for preparing investor 
            decks, validating deal assumptions, and ensuring alignment between sponsors and investors.
          </p>

          <h2 className="text-xl font-display font-semibold text-foreground mb-4">
            Why Real Estate Syndication Matters for Investors
          </h2>
          <p className="text-muted-foreground mb-4">
            Syndications have become a popular investment vehicle because they offer unique benefits:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-8">
            <li><strong>Access to Larger Deals:</strong> Invest in $5M+ apartment buildings or commercial properties with as little as $50,000-$100,000.</li>
            <li><strong>Professional Management:</strong> Experienced sponsors handle all property operations, renovations, and tenant management.</li>
            <li><strong>Diversification:</strong> Spread capital across multiple properties and markets to reduce concentration risk.</li>
            <li><strong>Passive Income:</strong> Receive quarterly or monthly distributions without active involvement.</li>
            <li><strong>Tax Advantages:</strong> Benefit from depreciation, cost segregation, and 1031 exchange opportunities.</li>
          </ul>

          <h2 className="text-xl font-display font-semibold text-foreground mb-4">
            How Syndication Waterfall Distributions Work
          </h2>
          <p className="text-muted-foreground mb-4">
            A waterfall defines how profits are split between Limited Partners (LPs) and General Partners (GPs) at different return thresholds. Here's how a typical waterfall works:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-8">
            <li><strong>Return of Capital:</strong> LPs receive their initial investment back first before any profit splits.</li>
            <li><strong>Preferred Return (Pref):</strong> LPs receive a hurdle rate (typically 6-10% annually) before the GP participates in profits.</li>
            <li><strong>Catch-Up:</strong> The GP may receive a catch-up payment until they've received their share of the pref.</li>
            <li><strong>Profit Split (Promote):</strong> Remaining profits are split between LP and GP, with the GP receiving an increasing "promote" at higher IRR tiers.</li>
          </ol>

          <h2 className="text-xl font-display font-semibold text-foreground mb-4">
            How to Use This Syndication Calculator
          </h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-8">
            <li>Enter acquisition costs: purchase price, closing costs, and CapEx/renovation budget</li>
            <li>Configure debt terms: LTV or LTC, interest rate, amortization, and IO period</li>
            <li>Set equity structure: LP/GP ownership split and GP co-invest amount</li>
            <li>Model operating pro forma: Year 1 NOI, rent growth, expense growth, and vacancy assumptions</li>
            <li>Define exit assumptions: cap rate at sale, disposition costs, and hold period</li>
            <li>Configure waterfall: preferred return rate, promote tiers, and distribution timing</li>
          </ul>

          <h2 className="text-xl font-display font-semibold text-foreground mb-4">
            Example Syndication Deal Analysis
          </h2>
          <p className="text-muted-foreground mb-4">
            Here's a simplified example of syndication economics:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
            <li><strong>Purchase Price:</strong> $5,000,000 (100-unit apartment)</li>
            <li><strong>Debt (65% LTV):</strong> $3,250,000 loan at 5.5% interest</li>
            <li><strong>Total Equity Required:</strong> $2,000,000 (including closing costs and reserves)</li>
            <li><strong>LP Investment:</strong> $1,800,000 (90% of equity)</li>
            <li><strong>GP Co-Invest:</strong> $200,000 (10% of equity)</li>
          </ul>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
            <li><strong>Year 1 NOI:</strong> $350,000</li>
            <li><strong>Hold Period:</strong> 5 years</li>
            <li><strong>Exit Cap Rate:</strong> 6.0%</li>
            <li><strong>Projected Sale Price:</strong> $6,500,000</li>
          </ul>
          <p className="text-muted-foreground mb-8">
            With an 8% preferred return and a 70/30 LP/GP profit split above the pref, LPs might achieve a 15-18% IRR and 1.8-2.0x equity multiple, while the GP earns their promote for executing the business plan successfully.
          </p>

          <h2 className="text-xl font-display font-semibold text-foreground mb-4">
            Key Outputs This Calculator Provides
          </h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-8">
            <li><strong>LP IRR:</strong> Internal Rate of Return for limited partners over the hold period—the annualized return accounting for all cash flows.</li>
            <li><strong>LP Equity Multiple:</strong> Total distributions divided by initial LP investment (2.0x means LPs double their money).</li>
            <li><strong>Cash-on-Cash Return:</strong> Annual cash distributions as a percentage of invested capital.</li>
            <li><strong>GP Promote:</strong> Additional profit share earned by the GP above their pro-rata ownership stake.</li>
            <li><strong>Waterfall Audit:</strong> Step-by-step breakdown showing how cash flows to each party at each tier.</li>
          </ul>

          <h2 className="text-xl font-display font-semibold text-foreground mb-4">
            Common Mistakes in Syndication Underwriting
          </h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-8">
            <li><strong>Aggressive Exit Assumptions:</strong> Don't assume cap rate compression. Use conservative or flat cap rates for projections.</li>
            <li><strong>Underestimating Expenses:</strong> Include property management, reserves, insurance increases, and potential capital expenditures.</li>
            <li><strong>Ignoring Refinance Risk:</strong> Interest rates may be higher at refinance. Model multiple rate scenarios.</li>
            <li><strong>Misaligned Incentives:</strong> Ensure the waterfall structure incentivizes the GP to maximize LP returns, not just close deals.</li>
            <li><strong>Not Stress-Testing:</strong> Run sensitivity analysis on rent growth, vacancy, and exit timing to understand downside scenarios.</li>
          </ul>

          <h2 className="text-xl font-display font-semibold text-foreground mb-4">
            Syndication vs REIT: Key Differences
          </h2>
          <p className="text-muted-foreground mb-4">
            Both syndications and REITs (Real Estate Investment Trusts) offer passive real estate exposure, but they differ significantly:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-8">
            <li><strong>Liquidity:</strong> REITs trade on exchanges with daily liquidity; syndications are illiquid for 3-7+ years.</li>
            <li><strong>Minimum Investment:</strong> REITs have no minimum; syndications typically require $50,000-$100,000+.</li>
            <li><strong>Control:</strong> Syndication investors can evaluate specific properties; REIT investors own a diversified portfolio.</li>
            <li><strong>Returns:</strong> Syndications may offer higher returns but with more concentration risk.</li>
            <li><strong>Investor Requirements:</strong> Many syndications require accredited investor status; REITs are open to everyone.</li>
          </ul>

          <h2 className="text-xl font-display font-semibold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
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
