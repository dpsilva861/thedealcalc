import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { InlineAd } from "@/components/ads";
import { buildCalculatorPageSchema } from "@/lib/seo/schemaBuilders";
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
  const jsonLd = buildCalculatorPageSchema(
    {
      name: "Real Estate Investment Calculator Suite",
      description: "Complete suite of free real estate investment calculators including rental property, BRRRR, fix & flip, cap rate, and cash-on-cash analysis.",
      canonicalPath: "/real-estate-investment-calculator"
    },
    [
      { name: "Home", path: "/" },
      { name: "Calculators", path: "/calculators" },
      { name: "Investment Calculator", path: "/real-estate-investment-calculator" }
    ]
  );

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
        <meta property="og:image" content="https://thedealcalc.com/og/og-calculators.png" />
        <meta property="og:site_name" content="TheDealCalc" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Real Estate Investment Calculator (Free) — TheDealCalc" />
        <meta name="twitter:description" content="Complete suite of free real estate investment calculators." />
        <meta name="twitter:image" content="https://thedealcalc.com/og/og-calculators.png" />
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
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

      {/* Educational Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">
              What is a Real Estate Investment Calculator?
            </h2>
            <p className="text-muted-foreground mb-4">
              A real estate investment calculator is a financial analysis tool that helps investors evaluate potential property investments before committing capital. By inputting purchase price, rental income, operating expenses, financing terms, and other key variables, investors can quickly determine whether a deal makes financial sense and meets their return requirements.
            </p>
            <p className="text-muted-foreground mb-4">
              Professional real estate investors never buy properties based on gut feeling or hope. They run the numbers—calculating cash flow, cap rate, cash-on-cash return, Internal Rate of Return (IRR), and other metrics—to make informed decisions backed by data. TheDealCalc provides these professional-grade calculations completely free.
            </p>

            <h3 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
              Why Real Estate Analysis Matters
            </h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
              <li><strong>Avoid costly mistakes:</strong> A property that looks like a good deal on the surface may have hidden expenses or unrealistic income projections. Analysis reveals the truth.</li>
              <li><strong>Compare opportunities objectively:</strong> Standard metrics let you compare a $150,000 duplex in the Midwest to a $500,000 condo in California on equal terms.</li>
              <li><strong>Optimize financing:</strong> See how different down payments, interest rates, and loan terms affect your returns and cash flow.</li>
              <li><strong>Plan for the future:</strong> Project returns over your entire hold period, including eventual sale, to understand total wealth building potential.</li>
              <li><strong>Negotiate effectively:</strong> When you know exactly what a property is worth based on its income, you can make confident offers and walk away from overpriced deals.</li>
            </ul>

            <h3 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
              Key Investment Metrics Explained
            </h3>
            <p className="text-muted-foreground mb-4">
              <strong>Cash Flow:</strong> The money left over after all expenses and mortgage payments. Monthly cash flow is what you actually take home from your investment.
            </p>
            <p className="text-muted-foreground mb-4">
              <strong>Cap Rate (Capitalization Rate):</strong> Net Operating Income divided by property value. Shows unlevered return, useful for comparing properties regardless of financing.
            </p>
            <p className="text-muted-foreground mb-4">
              <strong>Cash-on-Cash Return:</strong> Annual cash flow divided by total cash invested. Tells you what percentage return you're earning on your actual money in the deal.
            </p>
            <p className="text-muted-foreground mb-4">
              <strong>Internal Rate of Return (IRR):</strong> The annualized total return considering all cash flows over time, including appreciation and eventual sale. The gold standard for comparing investments.
            </p>
            <p className="text-muted-foreground mb-4">
              <strong>Debt Service Coverage Ratio (DSCR):</strong> Net Operating Income divided by mortgage payments. Measures your cushion for covering debt—lenders typically require 1.2x or higher.
            </p>
            <p className="text-muted-foreground mb-4">
              <strong>Equity Multiple:</strong> Total distributions received divided by total equity invested. A 2x equity multiple means you doubled your money over the hold period.
            </p>

            <h3 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
              Choosing the Right Calculator
            </h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
              <li><strong>Rental Property Calculator:</strong> Best for analyzing traditional buy-and-hold rental investments with long-term cash flow projections</li>
              <li><strong>BRRRR Calculator:</strong> Designed for the Buy-Rehab-Rent-Refinance-Repeat strategy where you recycle capital through refinancing</li>
              <li><strong>Fix and Flip Calculator:</strong> Optimized for short-term renovation projects where you sell quickly for profit</li>
              <li><strong>Syndication Analyzer:</strong> Built for multi-investor deals with complex LP/GP waterfall structures and preferred returns</li>
              <li><strong>Cap Rate Calculator:</strong> Quick tool for comparing properties based on unlevered returns</li>
              <li><strong>Cash-on-Cash Calculator:</strong> Focus on levered returns and the impact of financing on your actual cash investment</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Why TheDealCalc */}
      <section className="py-16 bg-cream-dark">
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
