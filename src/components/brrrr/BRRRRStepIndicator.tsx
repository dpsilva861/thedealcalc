import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface BRRRRStepIndicatorProps {
  steps: { label: string }[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function BRRRRStepIndicator({ steps, currentStep, onStepClick }: BRRRRStepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 md:gap-4">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        
        return (
          <button
            key={index}
            onClick={() => onStepClick?.(index)}
            disabled={!onStepClick}
            className={cn(
              "flex items-center gap-2 transition-all",
              onStepClick && "cursor-pointer hover:opacity-80",
              !onStepClick && "cursor-default"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                isCompleted && "bg-primary text-primary-foreground",
                isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
              )}
            >
              {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
            </div>
            <span
              className={cn(
                "hidden md:inline text-sm font-medium transition-colors",
                isCurrent && "text-foreground",
                !isCurrent && "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "hidden md:block w-8 h-0.5 transition-colors",
                  isCompleted ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
