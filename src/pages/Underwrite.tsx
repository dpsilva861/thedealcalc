import { useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "@/components/underwriting/StepIndicator";
import { AddressStep } from "@/components/underwriting/steps/AddressStep";
import { AcquisitionStep } from "@/components/underwriting/steps/AcquisitionStep";
import { IncomeStep } from "@/components/underwriting/steps/IncomeStep";
import { ExpensesStep } from "@/components/underwriting/steps/ExpensesStep";
import { RenovationStep } from "@/components/underwriting/steps/RenovationStep";
import { FinancingStep } from "@/components/underwriting/steps/FinancingStep";
import { ReviewStep } from "@/components/underwriting/steps/ReviewStep";
import { useUnderwriting } from "@/contexts/UnderwritingContext";
import { RelatedCalculators } from "@/components/calculators/RelatedCalculators";
import { SavedScenariosPanel } from "@/components/calculators/SavedScenariosPanel";
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
import { validateInputs } from "@/lib/validation";
import { useUnderwriteScenarios } from "@/hooks/useUnderwriteScenarios";
import { copyShareLink, decodeUnderwriteParams } from "@/hooks/useShareLink";
import { getDefaultInputs } from "@/lib/underwriting";
import { trackEvent } from "@/lib/analytics";
import { ArrowLeft, ArrowRight, Play, RotateCcw, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useStepScrollToTop } from "@/hooks/useStepScrollToTop";

const STEPS = [
  { label: "Address", shortLabel: "Address", component: AddressStep },
  { label: "Property", shortLabel: "Property", component: AcquisitionStep },
  { label: "Income", shortLabel: "Income", component: IncomeStep },
  { label: "Expenses", shortLabel: "Expenses", component: ExpensesStep },
  { label: "Renovation", shortLabel: "Reno", component: RenovationStep },
  { label: "Financing", shortLabel: "Finance", component: FinancingStep },
  { label: "Review", shortLabel: "Review", component: ReviewStep },
];

const faqs = [
  {
    question: "What is real estate underwriting?",
    answer: "Underwriting is the process of analyzing a property's financials to determine if it meets your investment criteria. It includes projecting income, expenses, and returns over a hold period."
  },
  {
    question: "What metrics should I focus on?",
    answer: "Key metrics include Cash-on-Cash Return, Cap Rate, DSCR (Debt Service Coverage Ratio), and IRR. This calculator computes all of these automatically based on your inputs."
  },
  {
    question: "How do I account for vacancy?",
    answer: "Enter your expected economic vacancy rate (typically 5-10%). The calculator reduces gross income by this percentage to estimate effective gross income."
  },
  {
    question: "Is this rental calculator free?",
    answer: "Yes! TheDealCalc rental property calculator is 100% free with no signup. Analyze deals, compare scenarios, and export professional reports."
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://thedealcalc.com/" },
        { "@type": "ListItem", "position": 2, "name": "Rental Property Calculator", "item": "https://thedealcalc.com/underwrite" }
      ]
    },
    {
      "@type": "SoftwareApplication",
      "name": "Rental Property Calculator",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Any",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "description": "Free rental property calculator for real estate investors. Analyze cash flow, cap rate, IRR, and DSCR with 30-year projections.",
      "url": "https://thedealcalc.com/underwrite"
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

function UnderwriteContent() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    currentStep,
    setCurrentStep,
    runAnalysis,
    resetInputs,
    propertyAddress,
    inputs,
    updateInputs,
  } = useUnderwriting();

  const topRef = useStepScrollToTop(currentStep);

  // Saved scenarios
  const { scenarios, saveScenario, loadScenario, deleteScenario } = useUnderwriteScenarios(
    inputs,
    useCallback((loaded) => updateInputs(loaded), [updateInputs])
  );

  // Load share params on mount
  useEffect(() => {
    const decoded = decodeUnderwriteParams(searchParams);
    if (decoded) {
      const defaults = getDefaultInputs();
      const merged = {
        ...defaults,
        acquisition: { ...defaults.acquisition, ...decoded.acquisition },
        income: { ...defaults.income, ...decoded.income },
        expenses: { ...defaults.expenses, ...decoded.expenses },
        financing: { ...defaults.financing, ...decoded.financing },
      };
      updateInputs(merged);
      toast.info('Inputs loaded from shared link');
      setSearchParams({}, { replace: true });
    }
  }, []);

  useEffect(() => {
    trackEvent("page_view", { page: "/underwrite" });
  }, []);

  const handleShare = () => copyShareLink('underwrite', inputs);

  const CurrentStepComponent = STEPS[currentStep].component;

  const handleNext = () => {
    // Validate address step before proceeding
    if (currentStep === 0) {
      if (!propertyAddress.address.trim()) {
        toast.error("Please enter the street address");
        return;
      }
      if (!propertyAddress.city.trim()) {
        toast.error("Please enter the city");
        return;
      }
      if (!propertyAddress.state) {
        toast.error("Please select a state");
        return;
      }
      if (!propertyAddress.zipCode || propertyAddress.zipCode.length !== 5) {
        toast.error("Please enter a valid 5-digit ZIP code");
        return;
      }
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRunAnalysis = async () => {
    try {
      // Validate inputs before running analysis
      const validation = validateInputs(inputs);
      
      if (!validation.isValid) {
        validation.errors.forEach((err) => {
          toast.error(err.message);
        });
        return;
      }
      
      // Show warnings but allow analysis to proceed
      validation.warnings.forEach((warn) => {
        toast.warning(warn.message);
      });

      const monthlyRent = inputs.income.unitCount * inputs.income.inPlaceMonthlyRentPerUnit;
      const monthlyExpenses = (inputs.expenses.propertyTaxesAnnual + 
        inputs.expenses.insuranceAnnual + 
        inputs.expenses.utilitiesAnnual + 
        inputs.expenses.hoaAnnual) / 12;
      const loanAmount = inputs.financing.useFinancing 
        ? (inputs.financing.useLtv 
            ? inputs.acquisition.purchasePrice * (inputs.financing.loanLtv / 100) 
            : inputs.financing.loanAmount)
        : 0;
      const monthlyRate = inputs.financing.interestRateAnnual / 100 / 12;
      const amortMonths = inputs.financing.amortizationYears * 12;
      const monthlyMortgage = loanAmount > 0 && monthlyRate > 0
        ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, amortMonths)) / 
          (Math.pow(1 + monthlyRate, amortMonths) - 1)
        : 0;
      const cashFlow = monthlyRent - monthlyExpenses - monthlyMortgage;

      trackEvent("calculate_rental", {
        monthly_rent: Math.round(monthlyRent),
        cash_flow: Math.round(cashFlow)
      });

      runAnalysis();
      navigate("/results");
    } catch (err) {
      console.error("Run analysis failed:", err);
      toast.error("Analysis failed. Please try again.");
    }
  };

  const handleReset = () => {
    resetInputs();
  };

  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <>
      <Helmet>
        <title>Rental Property Calculator (Free) | Real Estate Underwriting — TheDealCalc</title>
        <meta name="description" content="Free rental property calculator with 30-year projections. Analyze cash flow, cap rate, IRR, and DSCR for single-family and small multifamily. No signup required." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thedealcalc.com/underwrite" />
        <meta property="og:title" content="Rental Property Calculator (Free) | Real Estate Underwriting — TheDealCalc" />
        <meta property="og:description" content="Free rental property analysis tool. Calculate IRR, cash-on-cash return, and DSCR with professional exports." />
        <meta property="og:url" content="https://thedealcalc.com/underwrite" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://thedealcalc.com/og/og-rental.png" />
        <meta property="og:site_name" content="TheDealCalc" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Rental Property Calculator (Free) — TheDealCalc" />
        <meta name="twitter:description" content="Free rental property analysis with IRR, cash-on-cash, and DSCR." />
        <meta name="twitter:image" content="https://thedealcalc.com/og/og-rental.png" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-[calc(100vh-4rem)] bg-cream-dark overflow-x-hidden">
        <div ref={topRef} className="h-0" tabIndex={-1} aria-hidden="true" />

        {/* Header */}
        <div className="border-b border-border bg-background">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">
                  Rental Property Calculator
                </h1>
                <p className="text-muted-foreground text-sm">
                  Free to use • No signup required
                </p>
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
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
            <StepIndicator
              steps={STEPS}
              currentStep={currentStep}
              onStepClick={(step) => step < currentStep && setCurrentStep(step)}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-2xl shadow-card p-6 md:p-8">
              <CurrentStepComponent />
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 mb-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              {isLastStep ? (
                <Button variant="hero" size="lg" onClick={handleRunAnalysis}>
                  <Play className="h-4 w-4 mr-2" />
                  Run Analysis
                </Button>
              ) : (
                <Button variant="default" onClick={handleNext}>
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

            {/* SEO Content */}
            <section className="mt-12 prose prose-neutral dark:prose-invert max-w-none">
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">
                What is Real Estate Underwriting?
              </h2>
              <p className="text-muted-foreground mb-4">
                Real estate underwriting is the process of analyzing a property's income potential, 
                expenses, and financing to determine whether it meets your investment criteria. 
                This calculator helps you project cash flows, returns, and risks over your intended 
                hold period.
              </p>
              <p className="text-muted-foreground mb-8">
                Whether you're analyzing a single-family rental or a small multifamily property, 
                proper underwriting ensures you make data-driven decisions and avoid costly mistakes.
              </p>

              <h3 className="text-xl font-display font-semibold text-foreground mb-4">
                How to Use This Rental Calculator
              </h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-8">
                <li>Enter the property address for your records</li>
                <li>Input purchase price, closing costs, and hold period assumptions</li>
                <li>Add rental income: units, rent per unit, vacancy, and growth rates</li>
                <li>Enter operating expenses: taxes, insurance, maintenance, management</li>
                <li>Configure financing terms if using leverage</li>
              </ul>

              <h3 className="text-xl font-display font-semibold text-foreground mb-4">
                Key Outputs
              </h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-8">
                <li><strong>Cash-on-Cash Return:</strong> Annual cash flow divided by total cash invested</li>
                <li><strong>Cap Rate:</strong> NOI divided by purchase price (measures unlevered yield)</li>
                <li><strong>IRR:</strong> Internal rate of return accounting for all cash flows and sale proceeds</li>
                <li><strong>DSCR:</strong> Debt Service Coverage Ratio (NOI / annual debt payments)</li>
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
        </div>
      </div>

      {/* Related Calculators */}
      <RelatedCalculators currentPath="/underwrite" />
    </>
  );
}

export default function Underwrite() {
  return (
    <Layout showFooter={false}>
      <UnderwriteContent />
    </Layout>
  );
}
