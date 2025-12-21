import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Lock, 
  CheckCircle2, 
  ArrowRight,
  Infinity,
  Shield,
  FileText,
  Calculator,
  Sparkles
} from "lucide-react";

interface PaywallProps {
  title?: string;
  description?: string;
  showFreeTrial?: boolean;
  freeTrialRemaining?: number;
}

export function Paywall({ 
  title = "Subscribe to Access", 
  description = "Unlock unlimited deal analyses with a Pro subscription.",
  showFreeTrial = false,
  freeTrialRemaining = 0
}: PaywallProps) {
  const features = [
    { icon: Infinity, text: "Unlimited deal analyses" },
    { icon: Calculator, text: "Full underwriting calculator" },
    { icon: FileText, text: "Professional PDF reports" },
    { icon: Shield, text: "Complete data privacy" },
  ];

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Lock Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-6">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>

        <h1 className="font-display text-3xl font-bold text-foreground mb-3">
          {title}
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          {description}
        </p>

        {/* Pricing Card */}
        <div className="bg-card border-2 border-primary rounded-2xl p-6 mb-6 shadow-elevated">
          <div className="flex items-baseline justify-center gap-2 mb-4">
            <span className="text-4xl font-display font-bold text-foreground">$3</span>
            <span className="text-muted-foreground">/month</span>
          </div>

          <ul className="space-y-3 mb-6 text-left">
            {features.map((feature) => (
              <li key={feature.text} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sage-light text-primary">
                  <feature.icon className="h-4 w-4" />
                </div>
                <span className="text-foreground">{feature.text}</span>
              </li>
            ))}
          </ul>

          <Button variant="hero" size="xl" className="w-full" asChild>
            <Link to="/pricing">
              Subscribe Now
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Cancel anytime. Your data is encrypted and private to your account.
        </p>
      </div>
    </div>
  );
}
