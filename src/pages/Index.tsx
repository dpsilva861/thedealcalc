import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { 
  Calculator, 
  Shield, 
  Zap, 
  FileText, 
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Building2,
  BarChart3
} from "lucide-react";

export default function Index() {
  const features = [
    {
      icon: Calculator,
      title: "Accurate Calculations",
      description: "Deterministic math with monthly modeling. No AI guessing—just precise, reliable underwriting.",
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your deal data lives only in your browser. We never store, log, or access your sensitive information.",
    },
    {
      icon: Zap,
      title: "Unlimited Analyses",
      description: "Run as many deals as you need for one flat monthly price. No per-deal fees, no surprises.",
    },
    {
      icon: FileText,
      title: "Professional Reports",
      description: "Generate beautiful PDF reports with key metrics, sensitivity tables, and clear visualizations.",
    },
  ];

  const metrics = [
    { label: "IRR", description: "Internal Rate of Return" },
    { label: "CoC", description: "Cash-on-Cash Return" },
    { label: "DSCR", description: "Debt Service Coverage" },
    { label: "NOI", description: "Net Operating Income" },
  ];

  const steps = [
    {
      number: "01",
      title: "Enter Deal Details",
      description: "Input property info, rent rolls, expenses, and financing terms through our intuitive step-by-step wizard.",
    },
    {
      number: "02",
      title: "Run Analysis",
      description: "Our calculator models monthly cash flows, applies your assumptions, and computes all key metrics.",
    },
    {
      number: "03",
      title: "Review & Export",
      description: "View your complete underwriting report and download a professional PDF to share with partners or lenders.",
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-warm opacity-50" />
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage-light border border-primary/20 text-primary text-sm font-medium mb-6 animate-fade-in">
              <Zap className="h-4 w-4" />
              <span>Unlimited analyses for 5/month</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-slide-up">
              Professional Real Estate Underwriting,{" "}
              <span className="text-primary">Simplified</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Analyze residential investment properties with confidence. Accurate calculations, 
              beautiful reports, and complete privacy—all for less than a cup of coffee.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Button variant="hero" size="xl" asChild>
                <Link to="/signup">
                  Try Free Analysis
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/how-it-works">See How It Works</Link>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              1 free analysis included. No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* Metrics Bar */}
      <section className="border-y border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
              <div 
                key={metric.label} 
                className="text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-2xl md:text-3xl font-display font-bold text-primary mb-1">
                  {metric.label}
                </div>
                <div className="text-sm text-muted-foreground">
                  {metric.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Analyze Deals
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built by investors, for investors. No bloated features—just the tools you actually need.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="group p-6 rounded-2xl bg-card border border-border shadow-card hover:shadow-elevated transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sage-light text-primary mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-28 bg-cream-dark">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Simple, Three-Step Process
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From data entry to professional report in minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <div 
                key={step.number}
                className="relative animate-slide-up"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="text-6xl font-display font-bold text-primary/10 mb-4">
                  {step.number}
                </div>
                <h3 className="font-semibold text-foreground text-xl mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 right-0 translate-x-1/2 text-primary/20">
                    <ArrowRight className="h-8 w-8" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Your Privacy is Our Priority
                </h2>
                <p className="text-muted-foreground mb-8">
                  Unlike other platforms, we don't store your deal data. Every calculation 
                  happens in your browser. When you close the tab, your data disappears. 
                  It's that simple.
                </p>
                <ul className="space-y-4">
                  {[
                    "No deal data stored on our servers",
                    "Calculations run entirely in your browser",
                    "PDF exports generated locally",
                    "Only account & subscription info retained",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3 text-foreground">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-3xl bg-gradient-to-br from-sage-light to-secondary p-8 shadow-elevated">
                  <div className="h-full w-full rounded-2xl bg-card border border-border shadow-card flex items-center justify-center">
                    <div className="text-center">
                      <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
                      <p className="font-display text-2xl font-semibold text-foreground">
                        Privacy First
                      </p>
                      <p className="text-muted-foreground text-sm mt-2">
                        Your data. Your control.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 gradient-sage">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Analyze Your Next Deal?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of investors who trust DealCalc for accurate, private underwriting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="xl" asChild>
              <Link to="/signup">
                Get Started for $5/month
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
          <p className="text-primary-foreground/60 text-sm mt-6">
            Cancel anytime. No questions asked.
          </p>
        </div>
      </section>
    </Layout>
  );
}
