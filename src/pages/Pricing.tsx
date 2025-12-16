import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
  FileSpreadsheet,
  Edit,
  Download
} from "lucide-react";

export default function Pricing() {
  const { user, isSubscribed } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const features = [
    { icon: Infinity, text: "Unlimited deal analyses" },
    { icon: Calculator, text: "Full underwriting calculator" },
    { icon: FileText, text: "Professional PDF reports" },
    { icon: Shield, text: "Complete data privacy" },
    { icon: Zap, text: "Instant calculations" },
  ];

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
      question: "Is my deal data really not stored?",
      answer: "Correct. All calculations happen in your browser. We never receive, store, or have access to your deal inputs. Only your email and subscription status are stored."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes, cancel with one click from your account page. No questions, no hassle. You'll retain access until the end of your billing period."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards through Stripe. Your payment information is securely processed and never stored on our servers."
    },
  ];

  const handleSubscribe = async () => {
    setCheckoutError(null);
    
    if (!user) {
      navigate("/signup");
      return;
    }

    if (isSubscribed) {
      navigate("/underwrite");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("create-checkout", {
        body: { origin: window.location.origin },
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
      setLoading(false);
    }
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
            One plan. Unlimited analyses. No surprises.
          </p>
        </div>
      </section>

      {/* Pricing Card */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="relative rounded-3xl bg-card border-2 border-primary shadow-elevated overflow-hidden">
              {/* Badge */}
              <div className="absolute top-0 right-0 gradient-sage text-primary-foreground text-xs font-semibold px-4 py-2 rounded-bl-xl">
                BEST VALUE
              </div>

              <div className="p-8">
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                  Pro Plan
                </h2>
                <p className="text-muted-foreground mb-6">
                  Everything you need for professional underwriting
                </p>

                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-5xl font-display font-bold text-foreground">$5</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <Button 
                  variant="hero" 
                  size="xl" 
                  className="w-full mb-2" 
                  onClick={handleSubscribe}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : isSubscribed ? (
                    <>
                      Go to Dashboard
                      <ArrowRight className="h-5 w-5" />
                    </>
                  ) : user ? (
                    <>
                      Subscribe Now
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
                  <p className="text-destructive text-sm mb-6 text-center">
                    {checkoutError}
                  </p>
                )}

                <ul className="space-y-4">
                  {features.map((feature) => (
                    <li key={feature.text} className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sage-light text-primary">
                        <feature.icon className="h-4 w-4" />
                      </div>
                      <span className="text-foreground">{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="px-8 py-6 bg-muted/50 border-t border-border">
                <p className="text-sm text-muted-foreground text-center">
                  Cancel anytime. No long-term commitment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-3xl font-bold text-foreground text-center mb-4">
              Free vs Pro Comparison
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              See what you get with each plan. Pro unlocks powerful export and editing features.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Free Plan */}
              <div className="rounded-2xl bg-card border border-border p-6">
                <div className="text-center mb-6">
                  <h3 className="font-display text-xl font-bold text-foreground mb-1">Free Trial</h3>
                  <p className="text-muted-foreground text-sm">3 analyses to get started</p>
                </div>
                
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">Full underwriting calculator</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">Basic PDF export</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">30-year projections</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">Sensitivity analysis</span>
                  </li>
                  <li className="flex items-center gap-3 opacity-50">
                    <X className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">Excel export with styling</span>
                  </li>
                  <li className="flex items-center gap-3 opacity-50">
                    <X className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">CSV data export</span>
                  </li>
                  <li className="flex items-center gap-3 opacity-50">
                    <X className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">Edit & recalculate saved analyses</span>
                  </li>
                  <li className="flex items-center gap-3 opacity-50">
                    <X className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">Unlimited analyses</span>
                  </li>
                </ul>
              </div>

              {/* Pro Plan */}
              <div className="rounded-2xl bg-card border-2 border-primary p-6 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="gradient-sage text-primary-foreground text-xs font-semibold px-4 py-1 rounded-full">
                    RECOMMENDED
                  </span>
                </div>
                
                <div className="text-center mb-6">
                  <h3 className="font-display text-xl font-bold text-foreground mb-1">Pro Plan</h3>
                  <p className="text-primary font-semibold">$5/month</p>
                </div>
                
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">Full underwriting calculator</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">Professional PDF reports</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">30-year projections</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">Sensitivity analysis</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-accent text-accent-foreground flex-shrink-0">
                      <FileSpreadsheet className="h-3 w-3" />
                    </div>
                    <span className="text-foreground font-medium">Excel export with styling</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-accent text-accent-foreground flex-shrink-0">
                      <Download className="h-3 w-3" />
                    </div>
                    <span className="text-foreground font-medium">CSV data export</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-accent text-accent-foreground flex-shrink-0">
                      <Edit className="h-3 w-3" />
                    </div>
                    <span className="text-foreground font-medium">Edit & recalculate saved analyses</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-accent text-accent-foreground flex-shrink-0">
                      <Infinity className="h-3 w-3" />
                    </div>
                    <span className="text-foreground font-medium">Unlimited analyses</span>
                  </li>
                </ul>

                <Button 
                  variant="hero" 
                  className="w-full mt-6" 
                  onClick={handleSubscribe}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isSubscribed ? (
                    "You're Subscribed!"
                  ) : (
                    "Upgrade to Pro"
                  )}
                </Button>
                {checkoutError && (
                  <p className="text-destructive text-sm mt-2 text-center">
                    {checkoutError}
                  </p>
                )}
              </div>
            </div>
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
                We Don't Store Your Deal Data
              </h3>
              <p className="text-muted-foreground">
                All calculations happen in your browser. Your sensitive deal information never touches our servers.
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
          <Button 
            variant="secondary" 
            size="xl" 
            onClick={handleSubscribe}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Get Started for $5/month
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>
          {checkoutError && (
            <p className="text-destructive-foreground text-sm mt-3">
              {checkoutError}
            </p>
          )}
        </div>
      </section>
    </Layout>
  );
}
