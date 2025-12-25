import { useNavigate, useLocation } from "react-router-dom";
import { 
  Calculator, 
  Home, 
  RefreshCcw, 
  Building2, 
  Building, 
  Users,
  ChevronDown,
  Check,
} from "lucide-react";
import { CALCULATOR_REGISTRY, COMING_SOON_CALCULATORS } from "@/lib/calculators/registry";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  RefreshCcw,
  Building2,
  Building,
  Users,
  Calculator,
};

export function CalculatorSelector() {
  const location = useLocation();
  const navigate = useNavigate();

  // Get current calculator based on path
  const currentCalc = CALCULATOR_REGISTRY.find(c => location.pathname.startsWith(c.path));

  const handleCalcClick = (calc: typeof CALCULATOR_REGISTRY[0]) => {
    navigate(calc.path);
  };

  const CurrentIcon = currentCalc ? ICON_MAP[currentCalc.icon] || Calculator : Calculator;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CurrentIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{currentCalc?.name || "Select Calculator"}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Available Calculators</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {CALCULATOR_REGISTRY.filter(c => c.status === "available").map((calc) => {
          const Icon = ICON_MAP[calc.icon] || Calculator;
          const isCurrent = location.pathname.startsWith(calc.path);
          
          return (
            <DropdownMenuItem
              key={calc.id}
              onClick={() => handleCalcClick(calc)}
              className={cn(
                "flex items-start gap-3 p-3 cursor-pointer",
                isCurrent && "bg-primary/5"
              )}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 flex-shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{calc.name}</span>
                  {isCurrent && <Check className="h-3 w-3 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {calc.shortDescription}
                </p>
              </div>
            </DropdownMenuItem>
          );
        })}

        {COMING_SOON_CALCULATORS.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-muted-foreground">Coming Soon</DropdownMenuLabel>
            {COMING_SOON_CALCULATORS.map((calc) => {
              const Icon = ICON_MAP[calc.icon] || Calculator;
              
              return (
                <DropdownMenuItem
                  key={calc.id}
                  disabled
                  className="flex items-start gap-3 p-3 opacity-50"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted flex-shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-muted-foreground">{calc.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        SOON
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {calc.shortDescription}
                    </p>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
