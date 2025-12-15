import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface Step {
  label: string;
  shortLabel: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Desktop */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => (
          <div 
            key={index}
            className="flex items-center flex-1"
          >
            <button
              onClick={() => onStepClick?.(index)}
              disabled={!onStepClick}
              className={cn(
                "flex items-center gap-2 transition-all",
                onStepClick && index < currentStep && "cursor-pointer hover:opacity-80",
                !onStepClick && "cursor-default"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all",
                  index < currentStep && "bg-primary text-primary-foreground",
                  index === currentStep && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  index > currentStep && "bg-muted text-muted-foreground"
                )}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium hidden lg:inline",
                  index <= currentStep ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </button>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-4 transition-colors",
                  index < currentStep ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm font-medium text-foreground">
            {steps[currentStep].label}
          </span>
        </div>
        <div className="flex gap-1">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "flex-1 h-1.5 rounded-full transition-colors",
                index <= currentStep ? "bg-primary" : "bg-border"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
