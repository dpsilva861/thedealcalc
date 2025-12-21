import { CheckCircle2, Circle, Info } from "lucide-react";
import { PasswordRequirement, getPasswordStrength } from "@/lib/password-validation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PasswordRequirementsProps {
  requirements: PasswordRequirement[];
  password: string;
  showStrength?: boolean;
}

export function PasswordRequirements({
  requirements,
  password,
  showStrength = true,
}: PasswordRequirementsProps) {
  const strength = getPasswordStrength(password);

  return (
    <div className="space-y-3">
      {/* Strength indicator */}
      {showStrength && password.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Password strength</span>
            <span className="font-medium">{strength.label}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${strength.color}`}
              style={{ width: `${(strength.score / 4) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Requirements list */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>Password requirements</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p>Strong passwords help protect your account from unauthorized access.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <ul className="grid grid-cols-1 gap-1">
          {requirements.map((req) => (
            <li
              key={req.id}
              className={`flex items-center gap-2 text-xs transition-colors ${
                req.met ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {req.met ? (
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              ) : (
                <Circle className="h-3.5 w-3.5 flex-shrink-0" />
              )}
              <span>{req.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
