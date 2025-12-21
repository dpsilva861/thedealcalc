import { Link, useLocation } from "react-router-dom";
import { 
  Calculator, 
  Home, 
  RefreshCcw, 
  Building2, 
  Building, 
  Users,
  Lock,
  ChevronDown,
  Check
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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
  const { isSubscribed, planTier, selectedCalculator, canAccessCalculator } = useAuth();

  // Get current calculator based on path
  const currentCalc = CALCULATOR_REGISTRY.find(c => location.pathname.startsWith(c.path));
  
  // For non-subscribed users, they can access any calculator during free trial
  // For basic plan, they can only access their selected calculator
  // For pro plan, they can access all calculators
  const canAccess = (calcId: string): boolean => {
    if (planTier === "pro" && isSubscribed) return true;
    if (planTier === "basic" && isSubscribed) return calcId === selectedCalculator;
    return true; // Free trial users can try any
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
          const isLocked = !canAccess(calc.id);
          const isCurrent = location.pathname.startsWith(calc.path);
          
          return (
            <DropdownMenuItem
              key={calc.id}
              asChild
              disabled={isLocked}
              className={cn(
                "flex items-start gap-3 p-3 cursor-pointer",
                isCurrent && "bg-primary/5"
              )}
            >
              <Link to={calc.path} className="w-full">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 flex-shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{calc.name}</span>
                    {isCurrent && <Check className="h-3 w-3 text-primary" />}
                    {isLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {calc.shortDescription}
                  </p>
                </div>
              </Link>
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
                        {calc.tier === "pro" ? "PRO" : "SOON"}
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

        {!isSubscribed && (
          <>
            <DropdownMenuSeparator />
            <div className="p-3">
              <Link to="/pricing">
                <Button variant="hero" size="sm" className="w-full">
                  Upgrade for All Calculators
                </Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
