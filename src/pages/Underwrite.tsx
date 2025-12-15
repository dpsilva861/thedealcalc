import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "@/components/underwriting/StepIndicator";
import { AcquisitionStep } from "@/components/underwriting/steps/AcquisitionStep";
import { IncomeStep } from "@/components/underwriting/steps/IncomeStep";
import { ExpensesStep } from "@/components/underwriting/steps/ExpensesStep";
import { RenovationStep } from "@/components/underwriting/steps/RenovationStep";
import { FinancingStep } from "@/components/underwriting/steps/FinancingStep";
import { ReviewStep } from "@/components/underwriting/steps/ReviewStep";
import { UnderwritingProvider, useUnderwriting } from "@/contexts/UnderwritingContext";
import { AuthGuard } from "@/components/AuthGuard";
import { FreeTrialBanner } from "@/components/FreeTrialBanner";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, ArrowRight, Play, RotateCcw, Sparkles } from "lucide-react";

const STEPS = [
  { label: "Property", shortLabel: "Property", component: AcquisitionStep },
  { label: "Income", shortLabel: "Income", component: IncomeStep },
  { label: "Expenses", shortLabel: "Expenses", component: ExpensesStep },
  { label: "Renovation", shortLabel: "Reno", component: RenovationStep },
  { label: "Financing", shortLabel: "Finance", component: FinancingStep },
  { label: "Review", shortLabel: "Review", component: ReviewStep },
];

function UnderwriteContent() {
  const navigate = useNavigate();
  const { currentStep, setCurrentStep, runAnalysis, resetInputs } = useUnderwriting();
  const { isSubscribed, freeTrialRemaining, incrementAnalysisCount } = useAuth();

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

  const handleRunAnalysis = async () => {
    // Increment analysis count if using free trial
    if (!isSubscribed && freeTrialRemaining > 0) {
      await incrementAnalysisCount();
    }
    
    runAnalysis();
    navigate("/results");
  };

  const handleReset = () => {
    resetInputs();
  };

  const isLastStep = currentStep === STEPS.length - 1;
  const isUsingFreeTrial = !isSubscribed && freeTrialRemaining > 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-cream-dark">
      {/* Free Trial Banner */}
      <FreeTrialBanner />

      {/* Header */}
      <div className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Underwriting Analysis
              </h1>
              <p className="text-muted-foreground text-sm">
                Data is stored only in your browser
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
              <div className="flex items-center gap-3">
                {isUsingFreeTrial && (
                  <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground bg-sage-light px-3 py-1.5 rounded-lg">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>Uses 1 free analysis</span>
                  </div>
                )}
                <Button variant="hero" size="lg" onClick={handleRunAnalysis}>
                  <Play className="h-4 w-4 mr-2" />
                  Run Analysis
                </Button>
              </div>
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
      <AuthGuard requireSubscription={true}>
        <UnderwritingProvider>
          <UnderwriteContent />
        </UnderwritingProvider>
      </AuthGuard>
    </Layout>
  );
}
