import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step { label: string; component: React.ComponentType; }
interface Props { steps: Step[]; currentStep: number; onStepClick: (step: number) => void; }

export function SyndicationStepIndicator({ steps, currentStep, onStepClick }: Props) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        return (
          <div key={step.label} className="flex items-center">
            <button onClick={() => onStepClick(index)} className={cn("flex items-center gap-2 px-2 py-1 rounded-lg transition-colors hover:bg-muted/50", isCurrent && "bg-muted/30")}>
              <span className={cn("flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-colors", isCompleted ? "bg-primary text-primary-foreground" : isCurrent ? "bg-primary/20 text-primary border border-primary" : "bg-muted text-muted-foreground")}>{isCompleted ? <Check className="h-3 w-3" /> : index + 1}</span>
              <span className={cn("text-sm whitespace-nowrap", isCurrent ? "font-medium text-foreground" : "text-muted-foreground")}>{step.label}</span>
            </button>
            {index < steps.length - 1 && <div className="w-4 h-px bg-border mx-1" />}
          </div>
        );
      })}
    </div>
  );
}
