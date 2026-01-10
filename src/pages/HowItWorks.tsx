import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { InlineAd } from "@/components/ads";
import { 
  Building2, 
  Coins, 
  Wrench, 
  CreditCard, 
  FileBarChart,
  ArrowRight,
  CheckCircle2,
  Calculator,
  TrendingUp,
  PieChart,
  Download,
  Users,
  Target,
  Zap,
  Shield,
  XCircle,
  Lightbulb
} from "lucide-react";

export default function HowItWorks() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://thedealcalc.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "How It Works",
        "item": "https://thedealcalc.com/how-it-works"
      }
    ]
  };

  const inputSteps = [
    {
      icon: Calculator,
      title: "Choose Your Calculator",
      description: "Select from our suite of free tools: Quick Underwrite, BRRRR, or Syndication analysis.",
      fields: ["Quick Underwrite", "BRRRR Method", "Syndication"]
    },
    {
      icon: Building2,
      title: "Property Details",
      description: "Enter purchase price, closing costs, hold period, and exit assumptions.",
      fields: ["Purchase Price", "Closing Costs", "Hold Period", "Exit Cap Rate"]
    },
    {
      icon: Coins,
      title: "Income & Expenses",
      description: "Define rents, vacancy rates, operating expenses, and growth projections.",
      fields: ["Monthly Rent", "Vacancy Rate", "Operating Costs", "Growth Rate"]
    },
    {
      icon: CreditCard,
      title: "Financing Terms",
      description: "Model your debt with LTV, interest rate, amortization, and loan terms.",
      fields: ["Loan-to-Value", "Interest Rate", "Amortization", "Loan Term"]
    },
    {
      icon: Wrench,
      title: "Renovation (Optional)",
      description: "Add renovation budgets and timelines for value-add strategies.",
      fields: ["Reno Budget", "Timeline", "ARV", "Refinance Terms"]
    },
    {
      icon: FileBarChart,
      title: "Get Results",
      description: "Instantly view your analysis and export to PDF, CSV, or Excel—all free.",
      fields: ["View Results", "Export PDF", "Download CSV", "Save Excel"]
    },
  ];

  const outputs = [
    {
      icon: TrendingUp,
      title: "Key Metrics",
      items: ["IRR (Annualized)", "Cash-on-Cash Return", "Equity Multiple", "DSCR & Cap Rates"]
    },
    {
      icon: PieChart,
      title: "Cash Flow Analysis",
      items: ["Monthly Projections", "Annual Summary", "NOI Breakdown", "Debt Service Schedule"]
    },
    {
      icon: Calculator,
      title: "Deal Comparison",
      items: ["Side-by-Side Analysis", "Sensitivity Tables", "Scenario Modeling", "Breakeven Points"]
    },
    {
      icon: Download,
      title: "Free Exports",
      items: ["Professional PDF Report", "CSV Spreadsheet", "Excel Download", "No Account Required"]
    },
  ];

  const audiences = [
    {
      icon: Building2,
      title: "Real Estate Investors",
      desc: "Analyze rental properties, BRRRR deals, and value-add opportunities before making offers."
    },
    {
      icon: Users,
      title: "Syndicators & GPs",
      desc: "Model complex GP/LP structures, waterfall distributions, and investor returns for capital raises."
    },
    {
      icon: Target,
      title: "Real Estate Agents",
      desc: "Provide investment analysis to clients and add value beyond traditional brokerage services."
    },
    {
      icon: Coins,
      title: "Lenders & Brokers",
      desc: "Quickly underwrite deals and validate borrower projections with standardized metrics."
    },
  ];

  const comparisons = [
    {
      problem: "Excel spreadsheets are error-prone",
      solution: "Pre-built formulas eliminate formula errors and circular references"
    },
    {
      problem: "Expensive software ($50-500/month)",
      solution: "100% free with no subscription, no hidden fees, no upsells"
    },
    {
      problem: "Steep learning curves",
      solution: "Guided wizard with tooltips—analyze deals in under 5 minutes"
    },
    {
      problem: "No mobile access",
      solution: "Fully responsive—works on phone, tablet, and desktop"
    },
    {
      problem: "Data privacy concerns",
      solution: "All calculations run in your browser—we never see your data"
    },
    {
      problem: "Limited export options",
      solution: "Export to PDF, CSV, or Excel with one click"
    },
  ];

  return (
    <Layout>
      <Helmet>
        <title>How It Works | Free Real Estate Investment Calculator — TheDealCalc</title>
        <meta name="description" content="Learn how TheDealCalc analyzes real estate investments with month-by-month modeling, IRR calculations, and professional-grade accuracy. 100% free, no signup." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thedealcalc.com/how-it-works" />
        <meta property="og:title" content="How It Works | Free Real Estate Investment Calculator — TheDealCalc" />
        <meta property="og:description" content="Learn how TheDealCalc analyzes real estate investments with deterministic modeling and professional accuracy. Free forever." />
        <meta property="og:url" content="https://thedealcalc.com/how-it-works" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      {/* Hero */}
      <section className="py-16 md:py-24 bg-cream-dark">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
            How TheDealCalc Works
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A straightforward, step-by-step process to analyze any residential investment deal 
            with professional-grade accuracy—completely free.
          </p>
        </div>
      </section>

      {/* What is TheDealCalc */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <article className="prose prose-slate max-w-none">
              <h2 className="font-display text-3xl font-bold text-foreground mb-6">
                What is TheDealCalc?
              </h2>
              
              <p className="text-muted-foreground leading-relaxed text-lg mb-6">
                TheDealCalc is a free, professional-grade real estate investment calculator designed 
                to help investors, agents, and syndicators analyze deals quickly and accurately. 
                Unlike basic online calculators that give you a single cap rate or cash-on-cash number, 
                TheDealCalc provides comprehensive month-by-month cash flow projections, multi-year 
                proformas, and institutional-quality return metrics including IRR, equity multiple, 
                and DSCR.
              </p>
              
              <p className="text-muted-foreground leading-relaxed mb-6">
                We built TheDealCalc because we were frustrated with the existing options: expensive 
                subscription software that costs $50-500 per month, clunky Excel spreadsheets riddled 
                with formula errors, or oversimplified calculators that don't capture the nuances of 
                real deals. TheDealCalc brings institutional-quality underwriting to everyone—whether 
                you're analyzing your first rental property or modeling a $50 million syndication.
              </p>

              <p className="text-muted-foreground leading-relaxed mb-6">
                Our calculators handle the complexity so you can focus on finding great deals. From 
                BRRRR analysis with bridge loan refinancing to syndication waterfalls with preferred 
                returns and promote structures, TheDealCalc models the full investment lifecycle 
                with deterministic, auditable calculations that match what institutional investors use.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-16 bg-cream-dark">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              Who TheDealCalc Is For
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Whether you're buying your first rental or raising capital for a fund, 
              TheDealCalc provides the analysis tools you need.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {audiences.map((audience) => (
              <div 
                key={audience.title}
                className="p-6 rounded-2xl bg-card border border-border"
              >
                <audience.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold text-foreground text-lg mb-2">{audience.title}</h3>
                <p className="text-sm text-muted-foreground">{audience.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How Calculations Work */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <article className="prose prose-slate max-w-none">
              <h2 className="font-display text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                <Zap className="h-8 w-8 text-primary" />
                How Our Calculations Work
              </h2>
              
              <p className="text-muted-foreground leading-relaxed mb-6">
                TheDealCalc uses <strong>deterministic, month-by-month modeling</strong>—the same 
                methodology used by institutional investors, private equity firms, and commercial 
                lenders. Unlike simple calculators that use annual averages, we model every month 
                of your hold period to capture the true timing of cash flows.
              </p>

              <h3 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                Month-by-Month Cash Flow Modeling
              </h3>
              
              <p className="text-muted-foreground leading-relaxed mb-4">
                Each month is calculated individually: rent income, vacancy, operating expenses, 
                debt service, and net cash flow. This granular approach matters because timing 
                affects returns. Receiving cash in month 6 vs month 36 has a significant impact 
                on IRR, even if the total dollars are the same.
              </p>

              <h3 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                Accurate IRR Calculation
              </h3>
              
              <p className="text-muted-foreground leading-relaxed mb-4">
                Internal Rate of Return (IRR) is calculated using the Newton-Raphson method on 
                actual monthly cash flows—not simplified annual approximations. Our IRR matches 
                what you'd get in Excel using the XIRR function with actual dates. This precision 
                matters for comparing deals with different hold periods and cash flow patterns.
              </p>

              <h3 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                Growth and Escalation Modeling
              </h3>
              
              <p className="text-muted-foreground leading-relaxed mb-4">
                Rent growth, expense escalation, and other assumptions compound properly over time. 
                If you project 3% annual rent growth, each year's rent is calculated based on the 
                previous year's actual rent—not a simple multiplication of year-one rent. This 
                prevents the compounding errors common in basic spreadsheets.
              </p>
            </article>
          </div>
        </div>
      </section>

      <InlineAd />

      {/* Input Steps */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              Six Simple Steps
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Our guided wizard walks you through every input. Tooltips explain each field 
              so you always know what to enter.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {inputSteps.map((step, index) => (
              <div 
                key={step.title}
                className="p-6 rounded-2xl bg-card border border-border shadow-card hover:shadow-elevated transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sage-light text-primary text-lg font-bold">
                    {index + 1}
                  </div>
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {step.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {step.fields.map((field) => (
                    <span 
                      key={field}
                      className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problems We Solve */}
      <section className="py-16 bg-cream-dark">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-3xl font-bold text-foreground text-center mb-4">
              Problems TheDealCalc Solves
            </h2>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
              We built TheDealCalc to solve the frustrations investors face with existing tools.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {comparisons.map((item) => (
                <div key={item.problem} className="p-5 rounded-xl bg-card border border-border">
                  <div className="flex items-start gap-3 mb-3">
                    <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{item.problem}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground font-medium">{item.solution}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Accuracy & Methodology */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <article className="prose prose-slate max-w-none">
              <h2 className="font-display text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                Accuracy & Methodology
              </h2>
              
              <p className="text-muted-foreground leading-relaxed mb-6">
                TheDealCalc's calculations are built on the same methodologies used by institutional 
                real estate investors, commercial lenders, and private equity firms. Every formula 
                is deterministic—given the same inputs, you'll always get the same outputs. There's 
                no randomness, no AI guessing, and no black-box algorithms.
              </p>

              <h3 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                Transparent Calculations
              </h3>
              
              <p className="text-muted-foreground leading-relaxed mb-4">
                We believe in transparency. Our results panels show exactly how each metric is 
                calculated, breaking down the inputs and intermediate values. You can trace any 
                number back to its source. Many users export our results and verify them against 
                their own Excel models—the numbers match.
              </p>

              <h3 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
                Industry-Standard Metrics
              </h3>
              
              <p className="text-muted-foreground leading-relaxed mb-4">
                We calculate metrics the way professionals do: IRR using actual monthly cash flows, 
                DSCR using net operating income divided by annual debt service, cap rate using NOI 
                divided by purchase price. Our equity multiple, cash-on-cash return, and waterfall 
                distributions follow standard conventions used across the industry.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-20 bg-cream-dark">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              What You Get
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Comprehensive analysis with all the metrics and insights you need to make 
              informed investment decisions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {outputs.map((output) => (
              <div 
                key={output.title}
                className="p-6 rounded-2xl bg-card border border-border"
              >
                <output.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-foreground mb-4">{output.title}</h3>
                <ul className="space-y-2">
                  {output.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why It's Free */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <article className="prose prose-slate max-w-none">
              <h2 className="font-display text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                <Lightbulb className="h-8 w-8 text-primary" />
                Why TheDealCalc Is Free
              </h2>
              
              <p className="text-muted-foreground leading-relaxed mb-6">
                We believe every investor deserves access to professional-grade analysis tools, 
                regardless of portfolio size or budget. Too many new investors make expensive 
                mistakes because they can't afford proper underwriting software or don't know how 
                to build accurate spreadsheets. TheDealCalc levels the playing field.
              </p>
              
              <p className="text-muted-foreground leading-relaxed mb-6">
                Our model is simple: we keep TheDealCalc free through minimal, non-intrusive 
                advertising on content pages. We never show ads during your actual analysis workflow, 
                and we never sell your data. In fact, we don't even store your data—all calculations 
                run entirely in your browser. Your deal information never touches our servers.
              </p>

              <p className="text-muted-foreground leading-relaxed mb-6">
                We're committed to keeping TheDealCalc free forever. No freemium upsells, no 
                feature gating, no "premium" tier. Every calculator, every export option, every 
                feature—all free, all the time.
              </p>
            </article>
          </div>
        </div>
      </section>

      <InlineAd />

      {/* Privacy Note */}
      <section className="py-20 bg-cream-dark">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage-light text-primary text-sm font-medium mb-6">
              Your Data, Your Control
            </div>
            <h2 className="font-display text-3xl font-bold text-foreground mb-6">
              Privacy by Design
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              All calculations run entirely in your browser. We never store your deal data. 
              Export your results to PDF, CSV, or Excel and take them with you. No account 
              required, no data collection, no tracking of your investment analysis.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="lg" asChild>
                <Link to="/underwrite">
                  Start Analyzing
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/brrrr">
                  Try BRRRR Calculator
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
