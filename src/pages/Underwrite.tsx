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
import { CalculatorFaqs } from "@/components/seo/CalculatorFaqs";
import { buildCalculatorPageSchema } from "@/lib/seo/schemaBuilders";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
    answer: "Underwriting is the process of analyzing a property's financials to determine if it meets your investment criteria. It includes projecting income, expenses, and returns over a hold period to assess risk and potential reward."
  },
  {
    question: "What is cash flow in rental property investing?",
    answer: "Cash flow is the money remaining after all operating expenses and debt service payments. Positive cash flow means the property generates income after covering all costs. Negative cash flow means you're subsidizing the property each month."
  },
  {
    question: "What is NOI (Net Operating Income)?",
    answer: "NOI is gross rental income minus operating expenses, before mortgage payments and taxes. NOI = Effective Gross Income - Operating Expenses. It's used to calculate cap rate and is a key metric for comparing properties regardless of financing."
  },
  {
    question: "What is DSCR (Debt Service Coverage Ratio)?",
    answer: "DSCR measures a property's ability to cover its debt payments. DSCR = NOI / Annual Debt Service. A DSCR of 1.25 means the property generates 25% more income than needed for loan payments. Most lenders require 1.0-1.25x minimum."
  },
  {
    question: "How do I account for vacancy?",
    answer: "Enter your expected economic vacancy rate (typically 5-10% for residential, higher for commercial). The calculator reduces gross potential rent by this percentage to estimate effective gross income."
  },
  {
    question: "What reserves should I budget?",
    answer: "Common reserves include capital expenditures (CapEx) for major repairs (typically 5-10% of gross rent), and a maintenance reserve for routine repairs (5-8% of gross rent). Reserves reduce cash flow but protect against unexpected costs."
  },
];

const jsonLd = buildCalculatorPageSchema(
  {
    name: "Rental Property Calculator",
    description: "Rental property calculator for real estate investors. Analyze cash flow, cap rate, IRR, and DSCR with projections.",
    canonicalPath: "/underwrite"
  },
  [
    { name: "Home", path: "/" },
    { name: "Calculators", path: "/calculators" },
    { name: "Rental Property Calculator", path: "/underwrite" }
  ],
  faqs
);

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
        <title>Rental Property Calculator | Cash Flow Analysis | TheDealCalc</title>
        <meta name="description" content="Calculate rental property returns instantly. Analyze cash flow, cap rate, IRR, and DSCR with 30-year projections. Free, no signup required." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thedealcalc.com/underwrite" />
        <meta property="og:title" content="Rental Property Calculator | Cash Flow Analysis | TheDealCalc" />
        <meta property="og:description" content="Free rental property analysis tool. Calculate IRR, cash-on-cash return, and DSCR with professional exports." />
        <meta property="og:url" content="https://thedealcalc.com/underwrite" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://thedealcalc.com/og/og-rental.png" />
        <meta property="og:site_name" content="TheDealCalc" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Rental Property Calculator | Cash Flow Analysis | TheDealCalc" />
        <meta name="twitter:description" content="Free rental property analysis with IRR, cash-on-cash, and DSCR projections." />
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

            {/* SEO Content - Comprehensive educational content */}
            <section className="mt-12 prose prose-neutral dark:prose-invert max-w-none">
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">
                What is Real Estate Underwriting?
              </h2>
              <p className="text-muted-foreground mb-4">
                Real estate underwriting is the process of analyzing a property's income potential, 
                expenses, and financing to determine whether it meets your investment criteria. 
                This rental property calculator helps you project cash flows, calculate key return metrics, 
                and assess risks over your intended hold period.
              </p>
              <p className="text-muted-foreground mb-8">
                Whether you're analyzing a single-family rental, duplex, or small multifamily property, 
                proper underwriting ensures you make data-driven decisions based on real numbers rather than 
                intuition. This is the foundation of successful real estate investing.
              </p>

              <h2 className="text-xl font-display font-semibold text-foreground mb-4">
                Why Rental Property Analysis Matters
              </h2>
              <p className="text-muted-foreground mb-4">
                Thorough underwriting is essential because it helps you:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-8">
                <li><strong>Avoid Overpaying:</strong> Calculate the maximum purchase price that meets your return requirements.</li>
                <li><strong>Project Cash Flow:</strong> Understand monthly and annual cash flow after all expenses and debt service.</li>
                <li><strong>Assess Risk:</strong> Identify potential issues like negative cash flow, high vacancy risk, or insufficient DSCR.</li>
                <li><strong>Compare Opportunities:</strong> Evaluate multiple properties using consistent metrics to find the best investment.</li>
                <li><strong>Plan for Exit:</strong> Model appreciation and equity buildup over your hold period.</li>
              </ul>

              <h2 className="text-xl font-display font-semibold text-foreground mb-4">
                Key Metrics This Calculator Provides
              </h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-8">
                <li><strong>Cash-on-Cash Return (CoC):</strong> Annual cash flow divided by total cash invested. Shows the immediate return on your investment.</li>
                <li><strong>Cap Rate (Capitalization Rate):</strong> Net Operating Income (NOI) divided by purchase price. Measures unlevered yield independent of financing.</li>
                <li><strong>IRR (Internal Rate of Return):</strong> The annualized return accounting for all cash flows including sale proceeds. The true measure of investment performance.</li>
                <li><strong>DSCR (Debt Service Coverage Ratio):</strong> NOI divided by annual debt payments. Lenders typically require 1.2-1.25x minimum.</li>
                <li><strong>NOI (Net Operating Income):</strong> Gross income minus operating expenses, before debt service.</li>
              </ul>

              <h2 className="text-xl font-display font-semibold text-foreground mb-4">
                How to Use This Rental Property Calculator
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-8">
                <li><strong>Enter Property Address:</strong> Record the location for your analysis files and market reference.</li>
                <li><strong>Input Acquisition Details:</strong> Purchase price, closing costs, and hold period assumptions.</li>
                <li><strong>Add Rental Income:</strong> Number of units, rent per unit, vacancy rate, and annual rent growth.</li>
                <li><strong>Enter Operating Expenses:</strong> Property taxes, insurance, maintenance, property management, and utilities.</li>
                <li><strong>Configure Financing:</strong> Loan amount or LTV, interest rate, and amortization period.</li>
                <li><strong>Run Analysis:</strong> Review key metrics, 30-year projections, and sensitivity analysis.</li>
              </ol>

              <h2 className="text-xl font-display font-semibold text-foreground mb-4">
                Example Rental Property Analysis
              </h2>
              <p className="text-muted-foreground mb-4">
                Here's a typical rental property analysis:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li><strong>Purchase Price:</strong> $250,000</li>
                <li><strong>Down Payment (25%):</strong> $62,500</li>
                <li><strong>Closing Costs:</strong> $5,000</li>
                <li><strong>Monthly Rent:</strong> $2,000</li>
                <li><strong>Vacancy (8%):</strong> -$1,920/year</li>
                <li><strong>Gross Annual Income:</strong> $22,080</li>
              </ul>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li><strong>Property Taxes:</strong> $3,000/year</li>
                <li><strong>Insurance:</strong> $1,500/year</li>
                <li><strong>Maintenance (5%):</strong> $1,104/year</li>
                <li><strong>Management (8%):</strong> $1,766/year</li>
                <li><strong>Total Expenses:</strong> $7,370/year</li>
                <li><strong>NOI:</strong> $14,710/year</li>
              </ul>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-8">
                <li><strong>Mortgage Payment:</strong> $11,160/year (on $187,500 loan at 7%)</li>
                <li><strong>Annual Cash Flow:</strong> $3,550</li>
                <li><strong>Cash-on-Cash Return:</strong> 5.3%</li>
                <li><strong>Cap Rate:</strong> 5.9%</li>
                <li><strong>DSCR:</strong> 1.32x</li>
              </ul>

              <h2 className="text-xl font-display font-semibold text-foreground mb-4">
                Common Mistakes in Rental Property Analysis
              </h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-8">
                <li><strong>Underestimating Vacancy:</strong> Don't assume 100% occupancy. Use 5-10% vacancy for residential rentals.</li>
                <li><strong>Ignoring CapEx Reserves:</strong> Set aside funds for roof, HVAC, appliances, and other major repairs.</li>
                <li><strong>Forgetting Management Costs:</strong> Even if self-managing, account for the value of your time (8-10% of rent).</li>
                <li><strong>Using Optimistic Rent Estimates:</strong> Verify market rents with actual comparables, not listing prices.</li>
                <li><strong>Not Stress-Testing:</strong> Model what happens if vacancy increases or interest rates rise at refinance.</li>
                <li><strong>Overlooking Hidden Costs:</strong> Include HOA fees, lawn care, pest control, and other recurring expenses.</li>
              </ul>

              <h2 className="text-xl font-display font-semibold text-foreground mb-4">
                Cash-on-Cash Return vs Cap Rate: Understanding the Difference
              </h2>
              <p className="text-muted-foreground mb-4">
                These two metrics are often confused but measure different things:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-8">
                <li><strong>Cap Rate</strong> measures the property's unlevered yield—NOI divided by purchase price. It ignores financing and shows what return you'd earn if you paid all cash.</li>
                <li><strong>Cash-on-Cash Return</strong> measures your actual cash return—annual cash flow divided by cash invested. It reflects the impact of leverage on your returns.</li>
                <li><strong>When to Use Cap Rate:</strong> Comparing properties, determining market values, analyzing without financing complexity.</li>
                <li><strong>When to Use Cash-on-Cash:</strong> Evaluating your actual expected returns, comparing leveraged investments.</li>
              </ul>

              <CalculatorFaqs faqs={faqs} />
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
