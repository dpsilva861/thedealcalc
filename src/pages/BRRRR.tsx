import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useBRRRR } from "@/contexts/BRRRRContext";
import { BRRRRStepIndicator } from "@/components/brrrr/BRRRRStepIndicator";
import { BRRRRPresetSelector } from "@/components/brrrr/BRRRRPresetSelector";
import { BRRRRAcquisitionStep, BRRRRRefinanceStep, BRRRRRentalStep, BRRRRReviewStep } from "@/components/brrrr/steps";
import { CalculatorSelector } from "@/components/calculators/CalculatorSelector";
import { Button } from "@/components/ui/button";
import { validateBRRRRInputs } from "@/lib/calculators/brrrr/validation";
import { trackEvent } from "@/lib/analytics";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { label: "Acquisition", component: BRRRRAcquisitionStep },
  { label: "Refinance", component: BRRRRRefinanceStep },
  { label: "Rental", component: BRRRRRentalStep },
  { label: "Review", component: BRRRRReviewStep },
];

function BRRRRContent() {
  const navigate = useNavigate();
  const { currentStep, setCurrentStep, runAnalysis, inputs } = useBRRRR();

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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              BRRRR Calculator
            </h1>
            <p className="text-muted-foreground">
              Buy, Rehab, Rent, Refinance, Repeat
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CalculatorSelector />
            <BRRRRPresetSelector />
          </div>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
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
        <div className="flex justify-between">
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
      </div>
    </div>
  );
}

export default function BRRRR() {
  return (
    <Layout>
      <BRRRRContent />
    </Layout>
  );
}
