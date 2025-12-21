import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CALCULATOR_REGISTRY } from "@/lib/calculators/registry";
import { PLAN_PRICING } from "@/lib/entitlements";
import { 
  CheckCircle2, 
  ArrowRight, 
  Infinity,
  Shield,
  FileText,
  Calculator,
  Zap,
  Loader2,
  X,
  Crown
} from "lucide-react";

const AVAILABLE_CALCULATORS = CALCULATOR_REGISTRY.filter(c => c.status === "available");

export default function Pricing() {
  const { user, isSubscribed, planTier, selectedCalculator } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<"basic" | "pro" | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [selectedCalc, setSelectedCalc] = useState<string>(AVAILABLE_CALCULATORS[0]?.id || "residential");

  const faqs = [
    {
      question: "Is there a free trial?",
      answer: "Yes! New users get 3 free analyses to try the full tool. No credit card required to sign up."
    },
    {
      question: "What does \"unlimited\" mean?",
      answer: "Run as many deal analyses as you want each month. No caps, no per-deal fees. Analyze 1 deal or 100—same price."
    },
    {
      question: "What's the difference between Basic and Pro?",
      answer: "Basic gives you unlimited access to 1 calculator of your choice. Pro unlocks ALL calculators (current and future) so you can switch freely between different analysis types."
    },
    {
      question: "Can I upgrade from Basic to Pro?",
      answer: "Yes! You can upgrade anytime from your account page. Your billing will be prorated automatically."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes, cancel with one click from your account page. No questions, no hassle. You'll retain access until the end of your billing period."
    },
  ];

  const handleSubscribe = async (plan: "basic" | "pro") => {
    setCheckoutError(null);
    
    if (!user) {
      navigate("/signup");
      return;
    }

    if (isSubscribed && planTier === plan) {
      navigate("/underwrite");
      return;
    }

    setLoading(plan);
    try {
      const response = await supabase.functions.invoke("create-checkout", {
        body: { 
          origin: window.location.origin,
          selectedCalculator: plan === "basic" ? selectedCalc : null,
          planTier: plan,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      const errorMessage = error?.message || "Unknown error occurred";
      setCheckoutError(errorMessage);
    } finally {
      setLoading(null);
    }
  };

  const isCurrentPlan = (plan: "basic" | "pro") => {
    return isSubscribed && planTier === plan;
  };

  const canUpgradeTo = (plan: "basic" | "pro") => {
    if (!isSubscribed) return true;
    if (plan === "pro" && planTier === "basic") return true;
    return false;
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 md:py-24 bg-cream-dark">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your investing style. Upgrade anytime.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            
            {/* Basic Plan */}
            <div className="relative rounded-3xl bg-card border border-border shadow-lg overflow-hidden">
              <div className="p-8">
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                  {PLAN_PRICING.basic.name}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {PLAN_PRICING.basic.description}
                </p>

                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-5xl font-display font-bold text-foreground">${PLAN_PRICING.basic.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                {/* Calculator Selection for Basic */}
                {!isSubscribed && user && AVAILABLE_CALCULATORS.length > 1 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Choose your calculator:
                    </label>
                    <div className="space-y-2">
                      {AVAILABLE_CALCULATORS.map((calc) => (
                        <label
                          key={calc.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedCalc === calc.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="calculator"
                            value={calc.id}
                            checked={selectedCalc === calc.id}
                            onChange={(e) => setSelectedCalc(e.target.value)}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedCalc === calc.id ? "border-primary" : "border-muted-foreground"
                          }`}>
                            {selectedCalc === calc.id && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{calc.name}</p>
                            <p className="text-xs text-muted-foreground">{calc.shortDescription}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show selected calculator for Basic subscribers */}
                {isSubscribed && planTier === "basic" && selectedCalculator && (
                  <div className="mb-6 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-sm text-muted-foreground">Your calculator:</p>
                    <p className="font-medium text-foreground">
                      {AVAILABLE_CALCULATORS.find(c => c.id === selectedCalculator)?.name || selectedCalculator}
                    </p>
                  </div>
                )}

                <Button 
                  variant={isCurrentPlan("basic") ? "outline" : "hero"} 
                  size="lg" 
                  className="w-full mb-2" 
                  onClick={() => handleSubscribe("basic")}
                  disabled={loading !== null || isCurrentPlan("basic")}
                >
                  {loading === "basic" ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrentPlan("basic") ? (
                    "Current Plan"
                  ) : user ? (
                    <>
                      Start Basic
                      <ArrowRight className="h-5 w-5" />
                    </>
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>

                <ul className="space-y-3 mt-6">
                  {PLAN_PRICING.basic.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-foreground text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="px-8 py-4 bg-muted/50 border-t border-border">
                <p className="text-sm text-muted-foreground text-center">
                  Cancel anytime. No long-term commitment.
                </p>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="relative rounded-3xl bg-card border-2 border-primary shadow-elevated overflow-hidden">
              {/* Badge */}
              <div className="absolute top-0 right-0 gradient-sage text-primary-foreground text-xs font-semibold px-4 py-2 rounded-bl-xl flex items-center gap-1">
                <Crown className="h-3 w-3" />
                BEST VALUE
              </div>

              <div className="p-8">
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                  {PLAN_PRICING.pro.name}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {PLAN_PRICING.pro.description}
                </p>

                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-5xl font-display font-bold text-foreground">${PLAN_PRICING.pro.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                {/* Show all calculators for Pro */}
                <div className="mb-6 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-2">Includes all calculators:</p>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_CALCULATORS.map((calc) => (
                      <span key={calc.id} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {calc.name}
                      </span>
                    ))}
                  </div>
                </div>

                <Button 
                  variant={isCurrentPlan("pro") ? "outline" : "hero"} 
                  size="lg" 
                  className="w-full mb-2" 
                  onClick={() => handleSubscribe("pro")}
                  disabled={loading !== null || isCurrentPlan("pro")}
                >
                  {loading === "pro" ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrentPlan("pro") ? (
                    "Current Plan"
                  ) : isSubscribed && planTier === "basic" ? (
                    <>
                      Upgrade to Pro
                      <ArrowRight className="h-5 w-5" />
                    </>
                  ) : user ? (
                    <>
                      Start Pro
                      <ArrowRight className="h-5 w-5" />
                    </>
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>

                {checkoutError && (
                  <p className="text-destructive text-sm mb-4 text-center">
                    {checkoutError}
                  </p>
                )}

                <ul className="space-y-3 mt-6">
                  {PLAN_PRICING.pro.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-foreground text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="px-8 py-4 bg-muted/50 border-t border-border">
                <p className="text-sm text-muted-foreground text-center">
                  Cancel anytime. No long-term commitment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Free Trial Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="font-display text-xl font-bold text-foreground mb-2">
              Not ready to commit?
            </h3>
            <p className="text-muted-foreground mb-4">
              All new users get 3 free analyses to try the full tool. No credit card required.
            </p>
            {!user && (
              <Button variant="outline" asChild>
                <Link to="/signup">Sign Up Free</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Data Privacy Callout */}
      <section className="py-12 bg-sage-light">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center md:text-left">
            <Shield className="h-12 w-12 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground text-lg">
                Your Data, Your Control
              </h3>
              <p className="text-muted-foreground">
                Calculations run in your browser. Saved analyses are encrypted and private to your account.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-3xl font-bold text-foreground text-center mb-12">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              {faqs.map((faq) => (
                <div 
                  key={faq.question}
                  className="p-6 rounded-2xl bg-card border border-border"
                >
                  <h3 className="font-semibold text-foreground mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-muted-foreground">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 gradient-sage">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Start Analyzing Deals Today
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Join thousands of investors who trust DealCalc for accurate, private underwriting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="secondary" 
              size="xl" 
              onClick={() => handleSubscribe("basic")}
              disabled={loading !== null}
            >
              Basic — ${PLAN_PRICING.basic.price}/mo
            </Button>
            <Button 
              variant="secondary" 
              size="xl" 
              onClick={() => handleSubscribe("pro")}
              disabled={loading !== null}
            >
              Pro — ${PLAN_PRICING.pro.price}/mo
              <Crown className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}