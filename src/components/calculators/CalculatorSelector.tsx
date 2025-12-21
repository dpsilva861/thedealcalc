import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { 
  Calculator, 
  Home, 
  RefreshCcw, 
  Building2, 
  Building, 
  Users,
  Lock,
  ChevronDown,
  Check,
  Crown,
  AlertTriangle,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const { 
    isSubscribed, 
    planTier, 
    selectedCalculator, 
    updateSelectedCalculator,
  } = useAuth();

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [pendingCalc, setPendingCalc] = useState<typeof CALCULATOR_REGISTRY[0] | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

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

  // Basic user with no selection yet
  const needsSelection = isSubscribed && planTier === "basic" && !selectedCalculator;

  const handleCalcClick = (calc: typeof CALCULATOR_REGISTRY[0]) => {
    const isLocked = !canAccess(calc.id);
    
    if (isLocked) {
      // Show upgrade modal
      setPendingCalc(calc);
      setShowUpgradeModal(true);
      return;
    }

    if (needsSelection) {
      // Show selection confirmation modal
      setPendingCalc(calc);
      setShowSelectionModal(true);
      return;
    }

    // Navigate normally
    navigate(calc.path);
  };

  const handleUpgrade = () => {
    setShowUpgradeModal(false);
    setPendingCalc(null);
    navigate("/pricing");
  };

  const handleConfirmSelection = async () => {
    if (!pendingCalc) return;
    setIsSelecting(true);
    try {
      await updateSelectedCalculator(pendingCalc.id);
      setShowSelectionModal(false);
      navigate(pendingCalc.path);
    } finally {
      setIsSelecting(false);
      setPendingCalc(null);
    }
  };

  const CurrentIcon = currentCalc ? ICON_MAP[currentCalc.icon] || Calculator : Calculator;

  return (
    <>
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
                    {isLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
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
                <Button variant="hero" size="sm" className="w-full" onClick={() => navigate("/pricing")}>
                  Upgrade for All Calculators
                </Button>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              Calculator Locked
            </DialogTitle>
            <DialogDescription>
              Your Basic plan includes access to{" "}
              <strong>
                {CALCULATOR_REGISTRY.find(c => c.id === selectedCalculator)?.name || "one calculator"}
              </strong>
              . Upgrade to Pro to unlock {pendingCalc?.name}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowUpgradeModal(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={handleUpgrade}>
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Pro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Selection Modal */}
      <Dialog open={showSelectionModal} onOpenChange={setShowSelectionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Choose Your Calculator
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                Your Basic plan includes unlimited access to <strong>one calculator</strong>.
              </p>
              <p className="text-sm">
                You're about to select <strong>{pendingCalc?.name}</strong>.
                This choice is permanent unless you upgrade to Pro.
              </p>
            </DialogDescription>
          </DialogHeader>
          {pendingCalc && (
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="font-medium text-foreground">{pendingCalc.name}</div>
              <div className="text-sm text-muted-foreground">{pendingCalc.shortDescription}</div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowSelectionModal(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={handleConfirmSelection} disabled={isSelecting}>
              {isSelecting ? "Selecting..." : "Confirm Selection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
