import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { COMING_SOON_CALCULATORS } from "@/lib/calculators/registry";
import {
  Calculator,
  Shield,
  Zap,
  FileText,
  ArrowRight,
  Building2,
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
      title: "100% Free",
      description: "No signups, no subscriptions, no limits. Just open the calculator and start analyzing deals.",
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "Run as many analyses as you want. No waiting, no restrictions, no hidden fees.",
    },
    {
      icon: FileText,
      title: "Export Anywhere",
      description: "Download professional PDF, CSV, or Excel reports instantly. Share with partners or lenders.",
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
      title: "Export Report",
      description: "Download a professional PDF, CSV, or Excel file to share with partners or lenders.",
    },
  ];

  const breadcrumbSchema = {
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://thedealcalc.com/"
      }
    ]
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbSchema,
      {
        "@type": "WebSite",
        "@id": "https://thedealcalc.com/#website",
        "url": "https://thedealcalc.com/",
        "name": "TheDealCalc",
        "description": "Free real estate investment calculators for analyzing rental properties, BRRRR deals, and syndications.",
        "publisher": {
          "@id": "https://thedealcalc.com/#organization"
        }
      },
      {
        "@type": "Organization",
        "@id": "https://thedealcalc.com/#organization",
        "name": "TheDealCalc",
        "url": "https://thedealcalc.com/",
        "logo": {
          "@type": "ImageObject",
          "url": "https://thedealcalc.com/og-image.png"
        },
        "sameAs": []
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://thedealcalc.com/#app",
        "name": "TheDealCalc Real Estate Calculator",
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "description": "Professional real estate underwriting calculator with IRR, cash-on-cash, DSCR, and cap rate analysis.",
        "featureList": [
          "BRRRR Calculator",
          "Syndication Calculator",
          "Rental Property Analysis",
          "IRR Calculation",
          "Cash-on-Cash Return",
          "DSCR Analysis",
          "PDF/Excel Export"
        ]
      },
      {
        "@type": "WebPage",
        "@id": "https://thedealcalc.com/#webpage",
        "url": "https://thedealcalc.com/",
        "name": "Free Real Estate Investment Calculator | TheDealCalc",
        "isPartOf": {
          "@id": "https://thedealcalc.com/#website"
        },
        "about": {
          "@id": "https://thedealcalc.com/#app"
        },
        "description": "Analyze rental properties, BRRRR deals, and syndications with our free real estate investment calculator. Professional IRR, cash flow, and cap rate analysis—no signup required."
      }
    ]
  };

  return (
    <Layout>
      <Helmet>
        <title>Free Real Estate Investment Calculator | TheDealCalc</title>
        <meta name="description" content="Analyze rental properties, BRRRR deals, and syndications with our free real estate investment calculator. Professional IRR, cash flow, and cap rate analysis—no signup required." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thedealcalc.com/" />
        <meta property="og:title" content="Free Real Estate Investment Calculator | TheDealCalc" />
        <meta property="og:description" content="Professional real estate underwriting tools—completely free. Analyze deals with IRR, cash-on-cash, and DSCR calculations." />
        <meta property="og:url" content="https://thedealcalc.com/" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-warm opacity-50" />
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage-light border border-primary/20 text-primary text-sm font-medium mb-6 animate-fade-in">
              <Zap className="h-4 w-4" />
              <span>100% Free • No Signup Required</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-slide-up">
              Professional Real Estate Underwriting,{" "}
              <span className="text-primary">Simplified</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Analyze residential investment properties with confidence. Accurate calculations 
              and professional reports—completely free.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Button variant="hero" size="xl" asChild>
                <Link to="/underwrite">
                  Start Analyzing
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/how-it-works">See How It Works</Link>
              </Button>
            </div>
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

      {/* Coming Soon Section */}
      {COMING_SOON_CALCULATORS.length > 0 && (
        <section className="py-16 md:py-20 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-4">
                <Zap className="h-3.5 w-3.5" />
                <span>Coming Soon</span>
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
                More Calculators on the Way
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                We're building specialized tools for every investment strategy.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
              {COMING_SOON_CALCULATORS.map((calc, index) => (
                <div
                  key={calc.id}
                  className="p-4 rounded-xl bg-card border border-border text-center animate-fade-in w-44"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Building2 className="h-6 w-6 text-primary/60 mx-auto mb-2" />
                  <h3 className="font-semibold text-foreground text-sm mb-1">{calc.name}</h3>
                  <p className="text-xs text-muted-foreground">{calc.shortDescription}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 md:py-28 gradient-sage">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Analyze Your Next Deal?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Jump in and start analyzing—no signup, no payment, just results.
          </p>
          <Button variant="secondary" size="xl" asChild>
            <Link to="/underwrite">
              Start Free Analysis
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
