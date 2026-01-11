import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SyndicationProvider, useSyndication } from "@/contexts/SyndicationContext";
import { SyndicationStepIndicator } from "@/components/syndication/SyndicationStepIndicator";
import { SyndicationPresetSelector } from "@/components/syndication/SyndicationPresetSelector";
import { SyndicationAcquisitionStep, SyndicationDebtStep, SyndicationEquityStep, SyndicationProformaStep, SyndicationExitStep, SyndicationWaterfallStep, SyndicationReviewStep } from "@/components/syndication/steps";
import { CalculatorSelector } from "@/components/calculators/CalculatorSelector";
import { Button } from "@/components/ui/button";
import { validateSyndicationInputs } from "@/lib/calculators/syndication/validation";
import { trackEvent } from "@/lib/analytics";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import { toast } from "sonner";
import SyndicationSelfTest from "@/components/syndication/SyndicationSelfTest";

const STEPS = [
  { label: "Acquisition", component: SyndicationAcquisitionStep },
  { label: "Debt", component: SyndicationDebtStep },
  { label: "Equity", component: SyndicationEquityStep },
  { label: "Pro Forma", component: SyndicationProformaStep },
  { label: "Exit", component: SyndicationExitStep },
  { label: "Waterfall", component: SyndicationWaterfallStep },
  { label: "Review", component: SyndicationReviewStep },
];

function SyndicationContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDevMode = searchParams.get("dev") === "1";
  const { currentStep, setCurrentStep, runAnalysis, inputs, validation, setHasAttemptedRun } = useSyndication();

  useEffect(() => {
    trackEvent("page_view", { page: "/syndication" });
  }, []);

  const CurrentStepComponent = STEPS[currentStep].component;
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const handleNext = () => {
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <CalculatorSelector />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Syndication Analyzer</h1>
          </div>
        </div>
        <SyndicationPresetSelector />
      </div>
      
      <SyndicationStepIndicator steps={STEPS} currentStep={currentStep} onStepClick={setCurrentStep} />
      
      <div className="mt-6">
        <CurrentStepComponent />
      </div>
      
      <div className="flex justify-between mt-6">
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
      
      {isDevMode && (
        <div className="mt-8">
          <SyndicationSelfTest />
        </div>
      )}
    </div>
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
