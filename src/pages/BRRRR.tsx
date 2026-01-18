import { useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { useBRRRR } from "@/contexts/BRRRRContext";
import { BRRRRStepIndicator } from "@/components/brrrr/BRRRRStepIndicator";
import { BRRRRPresetSelector } from "@/components/brrrr/BRRRRPresetSelector";
import {
  BRRRRAcquisitionStep,
  BRRRRRefinanceStep,
  BRRRRRentalStep,
  BRRRRReviewStep,
} from "@/components/brrrr/steps";
import { CalculatorSelector } from "@/components/calculators/CalculatorSelector";
import { RelatedCalculators } from "@/components/calculators/RelatedCalculators";
import { SavedScenariosPanel } from "@/components/calculators/SavedScenariosPanel";
import { CalculatorFaqs } from "@/components/seo/CalculatorFaqs";
import { buildCalculatorPageSchema } from "@/lib/seo/schemaBuilders";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { validateBRRRRInputs } from "@/lib/calculators/brrrr/validation";
import { getDefaultBRRRRInputs } from "@/lib/calculators/brrrr";
import { useBRRRRScenarios } from "@/hooks/useBRRRRScenarios";
import { copyShareLink, decodeBRRRRParams } from "@/hooks/useShareLink";
import { trackEvent } from "@/lib/analytics";
import { ArrowLeft, ArrowRight, Play, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useStepScrollToTop } from "@/hooks/useStepScrollToTop";

const STEPS = [
  { label: "Acquisition", component: BRRRRAcquisitionStep },
  { label: "Refinance", component: BRRRRRefinanceStep },
  { label: "Rental", component: BRRRRRentalStep },
  { label: "Review", component: BRRRRReviewStep },
];

const faqs = [
  {
    question: "What is the BRRRR strategy?",
    answer: "BRRRR stands for Buy, Rehab, Rent, Refinance, Repeat. It's a real estate investment strategy where you purchase undervalued properties, renovate them to increase value, rent them out for cash flow, refinance to pull out your invested capital, and repeat the process with the recovered funds."
  },
  {
    question: "What is ARV (After-Repair Value)?",
    answer: "ARV is the estimated market value of a property after all renovations are complete. It's determined by comparing the subject property to similar recently sold properties (comps) in the area. Accurate ARV estimation is critical for BRRRR deals."
  },
  {
    question: "How do I calculate cash left in a BRRRR deal?",
    answer: "Cash left in deal = Total invested capital - Cash-out at refinance. Total invested capital includes purchase price, closing costs, rehab costs, and holding costs. Cash-out depends on the new appraised value and LTV offered by the lender."
  },
  {
    question: "What LTV can I expect on a BRRRR refinance?",
    answer: "Most conventional and DSCR lenders offer 70-80% LTV on cash-out refinances. Some lenders may require a seasoning period (typically 6-12 months) before allowing a cash-out refinance based on the new appraised value."
  },
  {
    question: "What is a seasoning period?",
    answer: "A seasoning period is the time a lender requires you to own a property before they allow a cash-out refinance based on current market value. Common seasoning requirements are 6 months for some DSCR lenders and 12 months for conventional loans."
  },
  {
    question: "What is DSCR in BRRRR investing?",
    answer: "DSCR (Debt Service Coverage Ratio) measures the property's ability to cover its debt payments. DSCR = NOI / Annual Debt Service. Most DSCR lenders require 1.0-1.25x minimum. A DSCR of 1.25 means the property generates 25% more income than needed for debt payments."
  },
];

const jsonLd = buildCalculatorPageSchema(
  {
    name: "BRRRR Calculator",
    description: "BRRRR calculator for real estate investors. Analyze Buy, Rehab, Rent, Refinance, Repeat deals with cash-out projections and risk analysis.",
    canonicalPath: "/brrrr"
  },
  [
    { name: "Home", path: "/" },
    { name: "Calculators", path: "/calculators" },
    { name: "BRRRR Calculator", path: "/brrrr" }
  ],
  faqs
);

function BRRRRContent() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentStep, setCurrentStep, runAnalysis, inputs, updateInputs, setHasAttemptedRun } =
    useBRRRR();

  const topRef = useStepScrollToTop(currentStep);

  // Saved scenarios
  const { scenarios, saveScenario, loadScenario, deleteScenario } = useBRRRRScenarios(
    inputs,
    useCallback((loaded) => {
      updateInputs(loaded);
    }, [updateInputs])
  );

  // Load share params on mount
  useEffect(() => {
    const decoded = decodeBRRRRParams(searchParams);
    if (decoded) {
      const defaults = getDefaultBRRRRInputs();
      const merged = {
        ...defaults,
        acquisition: { ...defaults.acquisition, ...decoded.acquisition },
        afterRepairValue: { ...defaults.afterRepairValue, ...decoded.afterRepairValue },
        refinance: { ...defaults.refinance, ...decoded.refinance },
        rentalOperations: { ...defaults.rentalOperations, ...decoded.rentalOperations },
      };
      updateInputs(merged);
      toast.info('Inputs loaded from shared link');
      setSearchParams({}, { replace: true });
    }
  }, []);

  useEffect(() => {
    trackEvent("page_view", { page: "/brrrr" });
  }, []);

  const handleShare = () => copyShareLink('brrrr', inputs);

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
    const validation = validateBRRRRInputs(inputs);
    
    if (!validation.isValid) {
      validation.errors.forEach((err) => toast.error(err.message));
      return;
    }
    
    validation.warnings.forEach((warn) => toast.warning(warn.message));
    
    const cashIn = inputs.acquisition.purchasePrice + 
      (inputs.acquisition.closingCostsIsPercent ? inputs.acquisition.purchasePrice * inputs.acquisition.closingCosts : inputs.acquisition.closingCosts) + 
      inputs.acquisition.rehabBudget + 
      (inputs.acquisition.monthlyHoldingCosts * inputs.acquisition.holdingPeriodMonths);
    
    trackEvent("calculate_brrrr", {
      ltv: inputs.refinance.refiLtvPct,
      arv: inputs.afterRepairValue.arv,
      cash_in: cashIn
    });
    
    runAnalysis();
    navigate("/brrrr/results");
  };

  return (
    <>
      <Helmet>
        <title>BRRRR Calculator | Real Estate Strategy | TheDealCalc</title>
        <meta name="description" content="Calculate BRRRR deals instantly. Analyze Buy, Rehab, Rent, Refinance, Repeat with cash-out projections and ROI analysis. Free, no signup required." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thedealcalc.com/brrrr" />
        <meta property="og:title" content="BRRRR Calculator | Real Estate Strategy | TheDealCalc" />
        <meta property="og:description" content="Free BRRRR calculator for real estate investors. Analyze rehab-to-rental deals with cash-out projections and risk analysis." />
        <meta property="og:url" content="https://thedealcalc.com/brrrr" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://thedealcalc.com/og/og-brrrr.png" />
        <meta property="og:site_name" content="TheDealCalc" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="BRRRR Calculator | Real Estate Strategy | TheDealCalc" />
        <meta name="twitter:description" content="Free BRRRR calculator for Buy-Rehab-Rent-Refinance-Repeat deals. Analyze cash-out and ROI." />
        <meta name="twitter:image" content="https://thedealcalc.com/og/og-brrrr.png" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div ref={topRef} className="h-0" tabIndex={-1} aria-hidden="true" />

        <div className="w-full">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground whitespace-nowrap">
              BRRRR Calculator
            </h1>
            <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
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
              <CalculatorSelector />
              <BRRRRPresetSelector />
            </div>
          </div>

          {/* Step Indicator */}
          <div className="mb-8 overflow-x-auto">
            <BRRRRStepIndicator
              steps={STEPS}
              currentStep={currentStep}
              onStepClick={setCurrentStep}
            />
          </div>

          {/* Current Step */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6">
            <CurrentStepComponent />
          </div>

          {/* Navigation */}
          <div className="flex justify-between mb-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {currentStep === STEPS.length - 1 ? (
              <Button variant="hero" onClick={handleRunAnalysis}>
                <Play className="h-4 w-4 mr-2" />
                Run Analysis
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
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
        </div>

        {/* SEO Content - Comprehensive educational content */}
        <section className="mt-12 prose prose-neutral dark:prose-invert max-w-none">
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">
            What is the BRRRR Strategy?
          </h2>
          <p className="text-muted-foreground mb-4">
            BRRRR stands for Buy, Rehab, Rent, Refinance, Repeat—a powerful real estate investment 
            strategy that allows investors to recycle capital across multiple properties. The goal is 
            to purchase undervalued properties, add value through renovation, stabilize with tenants, 
            then refinance to pull out your initial investment and use it for the next deal.
          </p>
          <p className="text-muted-foreground mb-8">
            When executed correctly, BRRRR enables investors to acquire rental properties with 
            little to no cash left in each deal, dramatically accelerating portfolio growth while 
            building long-term wealth through equity appreciation and passive cash flow.
          </p>

          <h2 className="text-xl font-display font-semibold text-foreground mb-4">
            Why the BRRRR Method Matters for Real Estate Investors
          </h2>
          <p className="text-muted-foreground mb-4">
            Traditional real estate investing requires significant capital for each property. BRRRR changes this by allowing you to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-8">
            <li><strong>Recycle Capital:</strong> Pull out your initial investment to buy the next property, building a portfolio faster.</li>
            <li><strong>Force Appreciation:</strong> Create equity through strategic renovations rather than waiting for market appreciation.</li>
            <li><strong>Build Cash Flow:</strong> Each property generates passive income from rental operations.</li>
            <li><strong>Minimize Risk:</strong> After refinancing, you have minimal capital at risk while owning a performing asset.</li>
          </ul>

          <h2 className="text-xl font-display font-semibold text-foreground mb-4">
            How the BRRRR Strategy Works: Step by Step
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-8">
            <li><strong>Buy:</strong> Purchase a distressed or undervalued property below market value, typically using hard money or private financing.</li>
            <li><strong>Rehab:</strong> Renovate the property to increase its value and make it rent-ready. Focus on improvements that increase After Repair Value (ARV).</li>
            <li><strong>Rent:</strong> Find quality tenants and stabilize the property with consistent rental income. Most lenders require 6-12 months of seasoning.</li>
            <li><strong>Refinance:</strong> Replace your short-term financing with a conventional mortgage based on the new, higher ARV. Cash-out up to 75-80% of the appraised value.</li>
            <li><strong>Repeat:</strong> Use the recovered capital to fund your next BRRRR deal, scaling your portfolio over time.</li>
          </ol>

          <h2 className="text-xl font-display font-semibold text-foreground mb-4">
            How to Use This BRRRR Calculator
          </h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-8">
            <li>Enter purchase price, closing costs, and rehab budget in the Acquisition step</li>
            <li>Set your expected After Repair Value (ARV) and refinance terms (LTV, rate, seasoning period)</li>
            <li>Input projected rental income and operating expenses</li>
            <li>Review the analysis to see cash-out amount, monthly cash flow, and cash-on-cash return</li>
            <li>Save scenarios to compare different deal structures and exit strategies</li>
          </ul>

          <h2 className="text-xl font-display font-semibold text-foreground mb-4">
            Example BRRRR Deal Analysis
          </h2>
          <p className="text-muted-foreground mb-4">
            Here's a typical BRRRR deal to illustrate the strategy:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
            <li><strong>Purchase Price:</strong> $80,000</li>
            <li><strong>Closing Costs:</strong> $3,000</li>
            <li><strong>Rehab Budget:</strong> $25,000</li>
            <li><strong>Holding Costs:</strong> $4,000 (4 months at $1,000/month)</li>
            <li><strong>Total Cash In:</strong> $112,000</li>
          </ul>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
            <li><strong>After Repair Value (ARV):</strong> $150,000</li>
            <li><strong>Refinance at 75% LTV:</strong> $112,500 loan</li>
            <li><strong>Refinance Closing Costs:</strong> $3,000</li>
            <li><strong>Cash Out:</strong> $112,500 - $3,000 = $109,500</li>
            <li><strong>Cash Left in Deal:</strong> $112,000 - $109,500 = $2,500</li>
          </ul>
          <p className="text-muted-foreground mb-8">
            With $2,500 left in the deal generating $300/month in cash flow, your cash-on-cash return is 144%—and you've recovered most of your capital to invest in the next property.
          </p>

          <h2 className="text-xl font-display font-semibold text-foreground mb-4">
            Key Outputs This Calculator Provides
          </h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-8">
            <li><strong>Cash-Out Amount:</strong> Money returned to you after refinancing—goal is to recover 100%+ of invested capital.</li>
            <li><strong>Cash Left in Deal:</strong> Capital still tied up after refinance. Lower is better for BRRRR.</li>
            <li><strong>Monthly Cash Flow:</strong> Net operating income after all expenses and debt service.</li>
            <li><strong>Cash-on-Cash Return:</strong> Annual cash flow divided by cash left in deal—the true return on your remaining investment.</li>
            <li><strong>DSCR:</strong> Debt Service Coverage Ratio—measures ability to cover mortgage payments from rental income.</li>
          </ul>

          <h2 className="text-xl font-display font-semibold text-foreground mb-4">
            Common Mistakes in BRRRR Investing
          </h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-8">
            <li><strong>Overestimating ARV:</strong> Be conservative with your after-repair value. Get multiple comps and verify with local agents.</li>
            <li><strong>Underestimating Rehab Costs:</strong> Add 15-20% contingency to your rehab budget for unexpected issues.</li>
            <li><strong>Ignoring Holding Costs:</strong> Include insurance, utilities, property taxes, and loan interest during the rehab period.</li>
            <li><strong>Not Accounting for Seasoning:</strong> Many lenders require 6-12 months before refinancing. Factor this into your timeline and costs.</li>
            <li><strong>Buying at Too High a Price:</strong> The deal is made at purchase. Don't pay more than 70% of ARV minus repair costs.</li>
          </ul>

          <h2 className="text-xl font-display font-semibold text-foreground mb-4">
            BRRRR vs Traditional Buy-and-Hold
          </h2>
          <p className="text-muted-foreground mb-4">
            The BRRRR method differs from traditional buy-and-hold investing in several important ways:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-8">
            <li><strong>Capital Efficiency:</strong> BRRRR allows you to recycle capital; buy-and-hold keeps capital locked in each property.</li>
            <li><strong>Speed of Growth:</strong> With BRRRR, you can acquire multiple properties with the same initial capital.</li>
            <li><strong>Effort Required:</strong> BRRRR requires finding distressed properties and managing renovations; buy-and-hold is more passive.</li>
            <li><strong>Risk Profile:</strong> BRRRR has higher execution risk but potentially higher returns; buy-and-hold is lower risk but slower growth.</li>
          </ul>

          <CalculatorFaqs faqs={faqs} />
        </section>

        <p className="text-xs text-muted-foreground text-center mt-8">
          For educational purposes only. Not investment, legal, or tax advice.
        </p>
      </div>

      {/* Related Calculators */}
      <RelatedCalculators currentPath="/brrrr" />
    </>
  );
}

export default function BRRRR() {
  return (
    <Layout>
      <BRRRRContent />
    </Layout>
  );
}
