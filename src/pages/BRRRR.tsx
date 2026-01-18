import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { validateBRRRRInputs } from "@/lib/calculators/brrrr/validation";
import { useBRRRRScenarios } from "@/hooks/useBRRRRScenarios";
import { trackEvent } from "@/lib/analytics";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";
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
    answer: "BRRRR stands for Buy, Rehab, Rent, Refinance, Repeat. It's a real estate investment strategy where you purchase undervalued properties, renovate them, rent them out, refinance to pull out equity, and repeat the process."
  },
  {
    question: "How do I calculate cash-out on a BRRRR deal?",
    answer: "Cash-out = Refinance loan amount - Bridge loan payoff - Closing costs. This calculator automatically computes your cash-out based on the ARV, LTV, and total invested capital."
  },
  {
    question: "What LTV can I expect on a BRRRR refinance?",
    answer: "Most lenders offer 70-80% LTV on cash-out refinances. This calculator lets you model different LTV scenarios to see how they affect your returns."
  },
  {
    question: "Is this BRRRR calculator free?",
    answer: "Yes! TheDealCalc BRRRR calculator is 100% free with no signup required. Analyze deals, compare scenarios, and export to PDF or Excel."
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://thedealcalc.com/" },
        { "@type": "ListItem", "position": 2, "name": "BRRRR Calculator", "item": "https://thedealcalc.com/brrrr" }
      ]
    },
    {
      "@type": "SoftwareApplication",
      "name": "BRRRR Calculator",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Any",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "description": "Free BRRRR calculator for real estate investors. Analyze Buy, Rehab, Rent, Refinance, Repeat deals with cash-out projections and risk analysis.",
      "url": "https://thedealcalc.com/brrrr"
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

function BRRRRContent() {
  const navigate = useNavigate();
  const { currentStep, setCurrentStep, runAnalysis, inputs, updateInputs, setHasAttemptedRun } =
    useBRRRR();

  const topRef = useStepScrollToTop(currentStep);

  // Saved scenarios
  const { scenarios, saveScenario, loadScenario, deleteScenario } = useBRRRRScenarios(
    inputs,
    useCallback((loaded) => {
      // Update all input sections
      updateInputs(loaded);
    }, [updateInputs])
  );

  useEffect(() => {
    trackEvent("page_view", { page: "/brrrr" });
  }, []);

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
        <title>BRRRR Calculator (Free) | Buy Rehab Rent Refinance Repeat — TheDealCalc</title>
        <meta name="description" content="Free BRRRR calculator: analyze Buy, Rehab, Rent, Refinance, Repeat deals. Calculate cash-out, ROI, and monthly cash flow. No signup required." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thedealcalc.com/brrrr" />
        <meta property="og:title" content="BRRRR Calculator (Free) | Buy Rehab Rent Refinance Repeat — TheDealCalc" />
        <meta property="og:description" content="Free BRRRR calculator for real estate investors. Analyze rehab-to-rental deals with cash-out projections." />
        <meta property="og:url" content="https://thedealcalc.com/brrrr" />
        <meta property="og:type" content="website" />
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

        {/* SEO Content */}
        <section className="mt-12 prose prose-neutral dark:prose-invert max-w-none">
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">
            What is the BRRRR Strategy?
          </h2>
          <p className="text-muted-foreground mb-4">
            BRRRR stands for Buy, Rehab, Rent, Refinance, Repeat—a powerful real estate investment 
            strategy that allows investors to recycle capital across multiple properties. The goal is 
            to purchase undervalued properties, add value through renovation, stabilize with tenants, 
            then refinance to pull out your initial investment.
          </p>
          <p className="text-muted-foreground mb-8">
            When executed correctly, BRRRR can enable investors to acquire rental properties with 
            little to no money left in each deal, accelerating portfolio growth while building 
            long-term wealth through equity and cash flow.
          </p>

          <h3 className="text-xl font-display font-semibold text-foreground mb-4">
            How to Use This BRRRR Calculator
          </h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-8">
            <li>Enter purchase price, closing costs, and rehab budget in the Acquisition step</li>
            <li>Set your expected After Repair Value (ARV) and refinance terms</li>
            <li>Input projected rental income and operating expenses</li>
            <li>Review the analysis to see cash-out, monthly cash flow, and ROI</li>
            <li>Save scenarios to compare different deal structures</li>
          </ul>

          <h3 className="text-xl font-display font-semibold text-foreground mb-4">
            Key Outputs
          </h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-8">
            <li><strong>Cash-Out:</strong> Money returned to you after refinance (goal: recover 100%+ of invested capital)</li>
            <li><strong>Cash Left in Deal:</strong> Capital still tied up in the property after refinance</li>
            <li><strong>Monthly Cash Flow:</strong> Net income after all expenses and debt service</li>
            <li><strong>Cash-on-Cash Return:</strong> Annual cash flow divided by cash left in deal</li>
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
