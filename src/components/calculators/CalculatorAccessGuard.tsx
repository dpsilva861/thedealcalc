// Calculator Access Guard Component
// Handles route-level enforcement for calculator access

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lock, Crown, AlertTriangle } from "lucide-react";
import { CALCULATOR_REGISTRY } from "@/lib/calculators/registry";

interface CalculatorAccessGuardProps {
  calculatorId: string;
  children: React.ReactNode;
}

export function CalculatorAccessGuard({ calculatorId, children }: CalculatorAccessGuardProps) {
  const navigate = useNavigate();
  const { 
    user, 
    loading, 
    isSubscribed, 
    planTier, 
    selectedCalculator, 
    canAccessCalculator,
    requiresCalculatorSelection,
    updateSelectedCalculator,
  } = useAuth();

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  const calculator = CALCULATOR_REGISTRY.find(c => c.id === calculatorId);
  const hasAccess = canAccessCalculator(calculatorId);

  useEffect(() => {
    if (loading) return;

    // Not logged in - handled by AuthGuard
    if (!user) return;

    // Basic user with no selection needs to pick
    if (requiresCalculatorSelection && isSubscribed && planTier === "basic") {
      setShowSelectionModal(true);
      return;
    }

    // Basic user trying to access wrong calculator
    if (isSubscribed && planTier === "basic" && !hasAccess) {
      setShowUpgradeModal(true);
      return;
    }
  }, [loading, user, isSubscribed, planTier, hasAccess, requiresCalculatorSelection]);

  const handleUpgrade = () => {
    setShowUpgradeModal(false);
    navigate("/pricing");
  };

  const handleSelectCalculator = async () => {
    setIsSelecting(true);
    try {
      await updateSelectedCalculator(calculatorId);
      setShowSelectionModal(false);
    } finally {
      setIsSelecting(false);
    }
  };

  const handleCancelSelection = () => {
    setShowSelectionModal(false);
    navigate("/");
  };

  // Show upgrade modal for locked calculators
  if (showUpgradeModal) {
    return (
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
              . Upgrade to Pro to unlock all calculators.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go Back
            </Button>
            <Button variant="hero" onClick={handleUpgrade}>
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Pro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Show selection modal for Basic users choosing their first calculator
  if (showSelectionModal) {
    return (
      <Dialog open={showSelectionModal} onOpenChange={() => {}}>
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
                You're about to select <strong>{calculator?.name}</strong>.
                This choice is permanent unless you upgrade to Pro.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <div className="font-medium text-foreground">{calculator?.name}</div>
            <div className="text-sm text-muted-foreground">{calculator?.shortDescription}</div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleCancelSelection}>
              Cancel
            </Button>
            <Button variant="hero" onClick={handleSelectCalculator} disabled={isSelecting}>
              {isSelecting ? "Selecting..." : "Confirm Selection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Access granted
  return <>{children}</>;
}
