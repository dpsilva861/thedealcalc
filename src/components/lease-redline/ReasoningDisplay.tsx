import { Brain } from "lucide-react";

interface ReasoningDisplayProps {
  steps: string[];
}

export function ReasoningDisplay({ steps }: ReasoningDisplayProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="mt-2 space-y-1.5 pl-3 border-l-2 border-primary/20">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
          <span className="shrink-0 w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold mt-0.5">
            {i + 1}
          </span>
          <p className="leading-relaxed">{step}</p>
        </div>
      ))}
    </div>
  );
}
