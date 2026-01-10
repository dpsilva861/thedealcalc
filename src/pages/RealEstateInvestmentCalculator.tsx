import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { InlineAd } from "@/components/ads";
import {
  Calculator,
  Home,
  RefreshCcw,
  Hammer,
  Users,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const calculators = [
  {
    icon: Home,
    title: "Rental Property Calculator",
    description: "Analyze buy-and-hold rental properties with cash flow, cap rate, cash-on-cash, and IRR calculations.",
    link: "/rental-property-calculator",
    cta: "Try Rental Calculator",
  },
  {
    icon: RefreshCcw,
    title: "BRRRR Calculator",
    description: "Model Buy-Rehab-Rent-Refinance-Repeat strategies with cash-out projections and rental returns.",
    link: "/brrrr-calculator",
    cta: "Try BRRRR Calculator",
  },
  {
    icon: Hammer,
    title: "Fix and Flip Calculator",
    description: "Calculate profit, ROI, and break-even on house flipping deals with full cost breakdown.",
    link: "/fix-and-flip-calculator",
    cta: "Try Flip Calculator",
  },
  {
    icon: TrendingUp,
    title: "Cap Rate Calculator",
    description: "Quickly calculate capitalization rate from NOI and property value for any investment property.",
    link: "/cap-rate-calculator",
    cta: "Try Cap Rate Calculator",
  },
  {
    icon: Calculator,
    title: "Cash-on-Cash Calculator",
    description: "Determine your actual return on invested capital with leverage and financing analysis.",
    link: "/cash-on-cash-calculator",
    cta: "Try CoC Calculator",
  },
  {
    icon: Users,
    title: "Syndication Analyzer",
    description: "Model LP/GP waterfall structures with preferred returns, promotes, and investor distributions.",
    link: "/syndication",
    cta: "Try Syndication Analyzer",
  },
];

const metrics = [
  "Internal Rate of Return (IRR)",
  "Cash-on-Cash Return",
  "Cap Rate",
  "Net Operating Income (NOI)",
  "Debt Service Coverage Ratio (DSCR)",
  "Equity Multiple",
  "Gross Rent Multiplier (GRM)",
  "Break-even Occupancy",
];

export default function RealEstateInvestmentCalculator() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://thedealcalc.com/" },
      { "@type": "ListItem", "position": 2, "name": "Investment Calculator", "item": "https://thedealcalc.com/real-estate-investment-calculator" }
    ]
  };

  return (
    <Layout>
      <Helmet>
        <title>Real Estate Investment Calculator (Free) | All-in-One Deal Analyzer — TheDealCalc</title>
        <meta name="description" content="Free real estate investment calculators: rental property, BRRRR, fix & flip, cap rate, cash-on-cash. Calculate IRR, NOI, DSCR instantly. No signup required." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thedealcalc.com/real-estate-investment-calculator" />
        <meta property="og:title" content="Real Estate Investment Calculator (Free) | All-in-One Deal Analyzer — TheDealCalc" />
        <meta property="og:description" content="Complete suite of free real estate investment calculators. Analyze any deal with professional accuracy." />
        <meta property="og:url" content="https://thedealcalc.com/real-estate-investment-calculator" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-cream-dark">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage-light border border-primary/20 text-primary text-sm font-medium mb-6">
              <Calculator className="h-4 w-4" />
              <span>100% Free • No Signup Required</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              Real Estate Investment Calculator
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              The complete suite of free calculators for real estate investors. 
              Analyze any deal type with professional-grade accuracy.
            </p>
            
            <Button variant="hero" size="xl" asChild>
              <Link to="/underwrite">
                Start Analyzing
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Calculator Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-foreground text-center mb-12">
            Choose Your Calculator
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {calculators.map((calc) => (
              <div 
                key={calc.title} 
                className="p-6 rounded-2xl bg-card border border-border hover:shadow-elevated transition-all"
              >
                <calc.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold text-foreground text-lg mb-2">{calc.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{calc.description}</p>
                <Button variant="outline" size="sm" asChild>
                  <Link to={calc.link}>
                    {calc.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <InlineAd />

      {/* Metrics We Calculate */}
      <section className="py-16 bg-cream-dark">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-foreground text-center mb-12">
            Metrics We Calculate
          </h2>
          
          <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-4">
            {metrics.map((metric) => (
              <div key={metric} className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">{metric}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why TheDealCalc */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl font-bold text-foreground mb-8">
              Why TheDealCalc?
            </h2>
            
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { title: "100% Free", desc: "No subscriptions, no limits, no hidden fees" },
                { title: "Professional Grade", desc: "Accurate calculations used by real investors" },
                { title: "Instant Results", desc: "No waiting, no loading—results in milliseconds" },
                { title: "Privacy First", desc: "We never store your deal data" },
                { title: "Free Exports", desc: "Download PDF, CSV, or Excel reports" },
                { title: "No Signup", desc: "Just open and start calculating" },
              ].map((item) => (
                <div key={item.title} className="p-4 text-left">
                  <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 gradient-sage">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold text-primary-foreground mb-4">
            Start Analyzing Your Next Deal
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Pick a calculator and run your first analysis in under 5 minutes.
          </p>
          <Button variant="secondary" size="xl" asChild>
            <Link to="/underwrite">
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
