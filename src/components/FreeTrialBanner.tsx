import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, AlertCircle } from "lucide-react";

export function FreeTrialBanner() {
  const { isSubscribed, freeTrialRemaining, user } = useAuth();

  // Don't show if not logged in or if subscribed
  if (!user || isSubscribed) return null;

  // Show remaining free trial
  if (freeTrialRemaining > 0) {
    return (
      <div className="bg-sage-light border-b border-primary/20">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-foreground">
              <strong className="font-semibold">Free Trial:</strong>{" "}
              You have {freeTrialRemaining} free {freeTrialRemaining === 1 ? "analysis" : "analyses"} remaining
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Show upgrade prompt when trial is exhausted
  return (
    <div className="bg-accent/10 border-b border-accent/20">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4 text-accent" />
          <span className="text-foreground">
            <strong className="font-semibold">Free trial used.</strong>{" "}
            <Link to="/pricing" className="text-primary hover:underline">
              Subscribe for $5/month
            </Link>{" "}
            for unlimited analyses.
          </span>
        </div>
      </div>
    </div>
  );
}
