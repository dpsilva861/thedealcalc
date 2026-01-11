import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { validateInputs } from "@/lib/validation";
import { trackEvent } from "@/lib/analytics";
import { ArrowLeft, ArrowRight, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { label: "Address", shortLabel: "Address", component: AddressStep },
  { label: "Property", shortLabel: "Property", component: AcquisitionStep },
  { label: "Income", shortLabel: "Income", component: IncomeStep },
  { label: "Expenses", shortLabel: "Expenses", component: ExpensesStep },
  { label: "Renovation", shortLabel: "Reno", component: RenovationStep },
  { label: "Financing", shortLabel: "Finance", component: FinancingStep },
  { label: "Review", shortLabel: "Review", component: ReviewStep },
];

function UnderwriteContent() {
  const navigate = useNavigate();
  const { currentStep, setCurrentStep, runAnalysis, resetInputs, propertyAddress, inputs } = useUnderwriting();

  useEffect(() => {
    trackEvent("page_view", { page: "/underwrite" });
  }, []);

  const CurrentStepComponent = STEPS[currentStep].component;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

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
      scrollToTop();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      scrollToTop();
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
    <div className="min-h-[calc(100vh-4rem)] bg-cream-dark overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Underwriting Analysis
              </h1>
              <p className="text-muted-foreground text-sm">
                Free to use • No signup required
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
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
          <div className="flex items-center justify-between mt-6">
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
        </div>
      </div>
    </div>
  );
}

export default function Underwrite() {
  return (
    <Layout showFooter={false}>
      <UnderwriteContent />
    </Layout>
  );
}
