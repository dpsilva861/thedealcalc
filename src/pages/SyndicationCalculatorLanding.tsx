import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { InlineAd } from "@/components/ads";
import {
  Building2,
  Users,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Calculator,
  Lightbulb,
  PieChart,
  Percent,
  Clock,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is a real estate syndication?",
    answer: "A real estate syndication is a partnership between multiple investors to pool capital and acquire properties that would be too large or complex for individual investors. A sponsor (GP) manages the deal while passive investors (LPs) provide capital in exchange for a share of the cash flow and profits."
  },
  {
    question: "What's the difference between GP and LP?",
    answer: "The General Partner (GP) or sponsor finds deals, arranges financing, manages the property, and makes operational decisions. Limited Partners (LPs) are passive investors who contribute capital but have no management responsibilities. GPs typically receive a promote (carried interest) for their work, while LPs receive priority returns."
  },
  {
    question: "What is a preferred return (pref)?",
    answer: "A preferred return is a minimum return that LPs receive before the GP earns any profit share. Common pref rates are 6-8% annually. For example, with an 8% pref, LPs receive the first 8% of returns before the GP participates in profit splits. This aligns interests and protects LP capital."
  },
  {
    question: "How do waterfall distributions work?",
    answer: "A waterfall is the order in which profits are distributed. Typically: (1) Return of LP capital, (2) Preferred return to LPs, (3) Catch-up to GP, (4) Remaining profits split (e.g., 70/30 LP/GP). More complex waterfalls have multiple IRR hurdles with increasing GP promote at each tier."
  },
  {
    question: "What is IRR and why does it matter?",
    answer: "Internal Rate of Return (IRR) measures the annualized return accounting for timing of cash flows. A deal with 18% IRR over 5 years means your investment grew at 18% per year compounded. IRR matters because it captures both the magnitude and timing of returns—getting $100K back in year 2 is better than year 5."
  },
  {
    question: "What is equity multiple?",
    answer: "Equity multiple is total distributions divided by invested capital. A 2.0x equity multiple means you doubled your money. If you invested $100K and received $200K total (including original capital), that's 2.0x. Unlike IRR, equity multiple ignores timing—it just shows total return."
  },
  {
    question: "What returns should I expect from a syndication?",
    answer: "Target returns vary by asset class and risk profile. Value-add multifamily typically targets 15-20% IRR and 1.8-2.2x equity multiple over 5 years. Core-plus deals target 12-15% IRR with lower risk. Development deals may target 20%+ IRR with higher risk. Always evaluate returns relative to risk."
  },
  {
    question: "What fees do syndicators charge?",
    answer: "Common GP fees include: acquisition fee (1-3% of purchase price), asset management fee (1-2% of revenue annually), construction management fee (5-10% of CapEx), disposition fee (1-2% of sale price), and promote/carried interest (20-40% of profits after pref). Fee structures vary widely."
  },
  {
    question: "How long is capital locked up in a syndication?",
    answer: "Most syndications have 3-7 year hold periods, with 5 years being most common. Capital is illiquid during this time—you typically cannot sell or transfer your interest. Some deals offer refinance events where LPs receive partial capital back, but full exit usually requires property sale."
  },
  {
    question: "Is this syndication calculator free?",
    answer: "Yes! TheDealCalc syndication analyzer is 100% free with no signup required. Model complex GP/LP waterfalls, IRR scenarios, and proforma projections. Export to PDF, CSV, or Excel. All calculations run locally in your browser—we never store your deal data."
  },
];

export default function SyndicationCalculatorLanding() {
  const breadcrumbSchema = {
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
        "name": "Syndication Calculator",
        "item": "https://thedealcalc.com/syndication-calculator"
      }
    ]
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbSchema,
      {
        "@type": "SoftwareApplication",
        "@id": "https://thedealcalc.com/syndication-calculator#app",
        "name": "Real Estate Syndication Calculator",
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "description": "Free real estate syndication calculator for modeling GP/LP structures, waterfall distributions, IRR, equity multiple, and preferred returns.",
        "featureList": [
          "GP/LP waterfall modeling",
          "IRR calculation",
          "Equity multiple analysis",
          "Preferred return modeling",
          "Cash-on-cash projections",
          "Multi-year proforma",
          "PDF/Excel export"
        ]
      },
      {
        "@type": "WebPage",
        "@id": "https://thedealcalc.com/syndication-calculator#webpage",
        "url": "https://thedealcalc.com/syndication-calculator",
        "name": "Syndication Calculator (Free) | Real Estate GP/LP Waterfall & IRR Analysis — TheDealCalc",
        "description": "Free real estate syndication calculator: model GP/LP splits, waterfall distributions, IRR, equity multiple, and preferred returns. Complete syndication analysis.",
        "isPartOf": {
          "@id": "https://thedealcalc.com/#website"
        },
        "about": {
          "@id": "https://thedealcalc.com/syndication-calculator#app"
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      }
    ]
  };

  return (
    <Layout>
      <Helmet>
        <title>Syndication Calculator (Free) | Real Estate GP/LP Waterfall & IRR Analysis — TheDealCalc</title>
        <meta name="description" content="Free real estate syndication calculator: model GP/LP splits, waterfall distributions, IRR, equity multiple, and preferred returns. Complete syndication analysis." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thedealcalc.com/syndication-calculator" />
        <meta property="og:title" content="Syndication Calculator (Free) | Real Estate GP/LP Waterfall & IRR Analysis — TheDealCalc" />
        <meta property="og:description" content="Free syndication calculator with GP/LP waterfall, IRR, equity multiple, and preferred return modeling. No signup required." />
        <meta property="og:url" content="https://thedealcalc.com/syndication-calculator" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://thedealcalc.com/og/og-syndication.png" />
        <meta property="og:site_name" content="TheDealCalc" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Syndication Calculator (Free) | GP/LP Waterfall & IRR Analysis — TheDealCalc" />
        <meta name="twitter:description" content="Free syndication calculator with GP/LP waterfall and IRR modeling." />
        <meta name="twitter:image" content="https://thedealcalc.com/og/og-syndication.png" />
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-cream-dark">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage-light border border-primary/20 text-primary text-sm font-medium mb-6">
              <Building2 className="h-4 w-4" />
              <span>100% Free • No Signup Required</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              Real Estate Syndication Calculator
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Model complex GP/LP structures, waterfall distributions, and investor returns. 
              Analyze IRR, equity multiple, and cash-on-cash for syndication deals.
            </p>
            
            <Button variant="hero" size="xl" asChild>
              <Link to="/syndication">
                Start Syndication Analysis
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* What is Syndication - Educational Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <article className="prose prose-slate max-w-none">
              <h2 className="font-display text-3xl font-bold text-foreground mb-6">
                What is Real Estate Syndication?
              </h2>
              
              <p className="text-muted-foreground leading-relaxed text-lg mb-6">
                Real estate syndication is a partnership structure that allows multiple investors to pool 
                their capital to acquire, manage, and profit from properties that would be out of reach 
                for individual investors. It's the primary vehicle for investing in large commercial 
                real estate assets like apartment complexes, office buildings, retail centers, and 
                industrial properties.
              </p>
              
              <p className="text-muted-foreground leading-relaxed mb-6">
                In a syndication, a sponsor (also called the General Partner or GP) identifies the 
                investment opportunity, arranges financing, manages the asset, and executes the 
                business plan. Passive investors (Limited Partners or LPs) contribute capital and 
                receive a share of the cash flow and profits without day-to-day management responsibilities. 
                This structure allows busy professionals to invest in institutional-quality real estate 
                while leaving operations to experienced sponsors.
              </p>

              <h3 className="font-display text-2xl font-semibold text-foreground mt-10 mb-4">
                GP/LP Structure Explained
              </h3>
              
              <p className="text-muted-foreground leading-relaxed mb-4">
                Understanding the General Partner and Limited Partner roles is fundamental to 
                evaluating any syndication opportunity:
              </p>

              <div className="not-prose grid md:grid-cols-2 gap-6 my-8">
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <Users className="h-10 w-10 text-primary mb-4" />
                  <h4 className="font-semibold text-foreground text-lg mb-2">General Partner (GP)</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Sources and underwrites deals</li>
                    <li>• Arranges debt financing</li>
                    <li>• Manages property operations</li>
                    <li>• Executes value-add business plan</li>
                    <li>• Makes all operational decisions</li>
                    <li>• Has unlimited liability</li>
                    <li>• Earns promote/carried interest</li>
                  </ul>
                </div>
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <DollarSign className="h-10 w-10 text-primary mb-4" />
                  <h4 className="font-semibold text-foreground text-lg mb-2">Limited Partner (LP)</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Contributes capital (equity)</li>
                    <li>• Receives quarterly distributions</li>
                    <li>• Gets preferred return priority</li>
                    <li>• Has no management responsibility</li>
                    <li>• Limited liability (can only lose investment)</li>
                    <li>• Receives K-1 for tax purposes</li>
                    <li>• Passive income treatment</li>
                  </ul>
                </div>
              </div>

              <h3 className="font-display text-2xl font-semibold text-foreground mt-10 mb-4">
                How Syndications Work: Step by Step
              </h3>
              
              <div className="not-prose grid md:grid-cols-2 gap-6 my-8">
                {[
                  { 
                    icon: Building2, 
                    title: "1. Deal Sourcing", 
                    desc: "The sponsor identifies an attractive property, negotiates with sellers, and gets it under contract. Due diligence includes property inspection, financial audit, and market analysis." 
                  },
                  { 
                    icon: DollarSign, 
                    title: "2. Capital Raise", 
                    desc: "GP creates an LLC or LP structure, prepares offering documents (PPM), and raises equity from accredited investors. Minimum investments typically range from $25K to $100K." 
                  },
                  { 
                    icon: TrendingUp, 
                    title: "3. Acquisition & Execution", 
                    desc: "Deal closes, property management begins, and the business plan is executed. For value-add deals, this includes renovations, rent increases, and operational improvements." 
                  },
                  { 
                    icon: PieChart, 
                    title: "4. Distributions & Exit", 
                    desc: "Investors receive quarterly cash flow distributions. After 3-7 years, the property is sold or refinanced, capital is returned, and profits are split per the waterfall." 
                  },
                ].map((item) => (
                  <div key={item.title} className="p-6 rounded-2xl bg-card border border-border">
                    <item.icon className="h-10 w-10 text-primary mb-4" />
                    <h4 className="font-semibold text-foreground text-lg mb-2">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>

              <h3 className="font-display text-2xl font-semibold text-foreground mt-10 mb-4">
                Key Return Metrics Explained
              </h3>

              <p className="text-muted-foreground leading-relaxed mb-4">
                Understanding these metrics is essential for evaluating syndication opportunities:
              </p>

              <div className="not-prose space-y-4 my-8">
                <div className="p-5 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <Percent className="h-6 w-6 text-primary" />
                    <h4 className="font-semibold text-foreground text-lg">IRR (Internal Rate of Return)</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    IRR measures your annualized return accounting for the timing of all cash flows. 
                    An 18% IRR over 5 years means your investment grew at 18% per year, compounded. 
                    IRR is the gold standard metric because it captures both the magnitude and timing 
                    of returns. Getting your money back sooner increases IRR even if total profit is the same.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    <h4 className="font-semibold text-foreground text-lg">Equity Multiple</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Equity multiple shows total cash received divided by cash invested. A 2.0x equity 
                    multiple means you doubled your money. If you invested $100,000 and received 
                    $200,000 total (including return of capital), that's 2.0x. Unlike IRR, equity 
                    multiple ignores timing—it simply shows how many times you got your money back.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="h-6 w-6 text-primary" />
                    <h4 className="font-semibold text-foreground text-lg">Cash-on-Cash Return</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Cash-on-cash measures annual cash distributions as a percentage of invested capital. 
                    If you invested $100,000 and receive $8,000 in annual distributions, that's 8% 
                    cash-on-cash. This metric shows ongoing yield but doesn't capture appreciation 
                    or final sale proceeds.
                  </p>
                </div>
              </div>

              <h3 className="font-display text-2xl font-semibold text-foreground mt-10 mb-4">
                Preferred Return & Waterfall Distributions
              </h3>
              
              <p className="text-muted-foreground leading-relaxed mb-4">
                The waterfall structure determines how profits are split between GPs and LPs. 
                Most syndications include a preferred return (pref) that protects LP investors:
              </p>

              <div className="not-prose bg-card border border-border rounded-xl p-6 my-6">
                <h4 className="font-semibold text-foreground mb-4">Example Waterfall Structure</h4>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">1</div>
                    <div>
                      <div className="font-medium text-foreground">Return of Capital</div>
                      <div className="text-muted-foreground">LPs receive 100% of distributions until original investment is returned</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">2</div>
                    <div>
                      <div className="font-medium text-foreground">Preferred Return (8% pref)</div>
                      <div className="text-muted-foreground">LPs receive 100% of distributions until they've earned 8% annualized return</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">3</div>
                    <div>
                      <div className="font-medium text-foreground">GP Catch-Up</div>
                      <div className="text-muted-foreground">GP receives distributions until they've "caught up" to their profit share</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">4</div>
                    <div>
                      <div className="font-medium text-foreground">Profit Split (70/30)</div>
                      <div className="text-muted-foreground">Remaining profits split 70% to LPs and 30% to GP (the promote)</div>
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="font-display text-2xl font-semibold text-foreground mt-10 mb-4">
                Example 5-Year Syndication Deal
              </h3>
              
              <p className="text-muted-foreground leading-relaxed mb-4">
                Let's walk through a realistic value-add multifamily syndication to illustrate 
                how the numbers work:
              </p>

              <div className="not-prose bg-card border border-border rounded-xl p-6 my-6">
                <h4 className="font-semibold text-foreground mb-4">200-Unit Apartment Complex</h4>
                <div className="grid sm:grid-cols-2 gap-6 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-2 font-medium">Sources & Uses</div>
                    <ul className="space-y-1 text-foreground">
                      <li>Purchase Price: <strong>$25,000,000</strong></li>
                      <li>CapEx/Renovation: <strong>$3,000,000</strong></li>
                      <li>Closing/Reserves: <strong>$1,500,000</strong></li>
                      <li className="pt-2 border-t border-border">Total Uses: <strong>$29,500,000</strong></li>
                      <li className="pt-2">Senior Debt (65% LTV): <strong>$19,175,000</strong></li>
                      <li>LP Equity (90%): <strong>$9,292,500</strong></li>
                      <li>GP Equity (10%): <strong>$1,032,500</strong></li>
                    </ul>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-2 font-medium">5-Year Projections</div>
                    <ul className="space-y-1 text-foreground">
                      <li>Year 1 NOI: <strong>$1,875,000</strong></li>
                      <li>Year 5 NOI: <strong>$2,500,000</strong></li>
                      <li>Exit Cap Rate: <strong>5.5%</strong></li>
                      <li>Sale Price (Year 5): <strong>$45,450,000</strong></li>
                      <li className="pt-2 border-t border-border">Total LP Distributions: <strong>$18,585,000</strong></li>
                      <li className="font-semibold text-primary">LP Equity Multiple: 2.0x</li>
                      <li className="font-semibold text-primary">LP IRR: 17.2%</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-muted-foreground text-sm">
                    <strong>Deal Summary:</strong> LPs invest $9.29M, receive $18.59M over 5 years 
                    (2.0x multiple, 17.2% IRR). GP earns ~$5M in promote on a $1M co-invest plus fees.
                  </div>
                </div>
              </div>

              <h3 className="font-display text-2xl font-semibold text-foreground mt-10 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
                Common Syndication Mistakes
              </h3>
              
              <p className="text-muted-foreground leading-relaxed mb-4">
                Whether you're a GP or LP, watch out for these common pitfalls:
              </p>
              
              <div className="not-prose space-y-3 my-6">
                {[
                  { 
                    title: "Overpaying for the Property", 
                    desc: "Aggressive underwriting with unrealistic rent growth or cap rate compression assumptions. If your deal only works with 5% annual rent growth, you're taking on significant risk." 
                  },
                  { 
                    title: "Underestimating CapEx", 
                    desc: "Value-add renovations almost always cost more and take longer than projected. Build in 15-20% contingency and realistic timelines." 
                  },
                  { 
                    title: "Ignoring Debt Risk", 
                    desc: "Floating rate debt, short-term loans, and aggressive leverage can sink deals when rates rise. The 2022-2024 period showed how quickly this can happen." 
                  },
                  { 
                    title: "Not Vetting the Sponsor", 
                    desc: "Past performance, track record, and alignment of interests matter enormously. Ask about deals that didn't go well—how did the sponsor handle adversity?" 
                  },
                  { 
                    title: "Illiquidity Underestimation", 
                    desc: "Your capital is locked for 3-7 years minimum. Don't invest funds you might need access to. There's no secondary market for most syndication interests." 
                  },
                ].map((mistake) => (
                  <div key={mistake.title} className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-foreground">{mistake.title}</div>
                      <div className="text-sm text-muted-foreground">{mistake.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="font-display text-2xl font-semibold text-foreground mt-10 mb-4 flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-primary" />
                When Syndication Makes Sense
              </h3>
              
              <p className="text-muted-foreground leading-relaxed mb-4">
                Syndication investing works best when:
              </p>
              
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
                <li>You want exposure to institutional-quality real estate without managing properties</li>
                <li>You have capital to invest but limited time for active real estate management</li>
                <li>You're an accredited investor seeking passive income and depreciation benefits</li>
                <li>You want portfolio diversification beyond stocks and bonds</li>
                <li>You can commit capital for 3-7 years without needing liquidity</li>
                <li>You've thoroughly vetted the sponsor and understand the deal structure</li>
              </ul>

              <p className="text-muted-foreground leading-relaxed mb-4">
                Syndication may not be ideal when:
              </p>
              
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
                <li>You need access to your capital in the short term</li>
                <li>You prefer direct control over investment decisions</li>
                <li>You haven't done due diligence on the sponsor's track record</li>
                <li>The projected returns seem too good to be true (they probably are)</li>
                <li>You don't understand the waterfall structure or fee arrangements</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <InlineAd />

      {/* What You Get */}
      <section className="py-16 bg-cream-dark">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-foreground text-center mb-4">
            What Our Syndication Calculator Provides
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Model complete syndication structures with professional-grade proforma projections.
          </p>
          
          <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-4">
            {[
              "GP/LP waterfall modeling",
              "Multi-tier promote structures",
              "IRR calculation (LP & GP)",
              "Equity multiple projections",
              "Preferred return tracking",
              "5-10 year proforma cash flows",
              "Sources & uses breakdown",
              "Sensitivity analysis tables",
              "Debt sizing and DSCR",
              "Free PDF/CSV/Excel export",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mid-CTA */}
      <section className="py-12 border-y border-border">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Calculator className="h-6 w-6 text-primary" />
            <h3 className="font-display text-2xl font-bold text-foreground">
              Ready to Model Your Syndication?
            </h3>
          </div>
          <p className="text-muted-foreground mb-6">
            Create professional proformas and waterfall models in minutes
          </p>
          <Button variant="hero" size="lg" asChild>
            <Link to="/syndication">
              Open Syndication Analyzer
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <HelpCircle className="h-6 w-6 text-primary" />
              <h2 className="font-display text-3xl font-bold text-foreground text-center">
                Frequently Asked Questions
              </h2>
            </div>
            <p className="text-muted-foreground text-center mb-10">
              Everything you need to know about real estate syndications and our calculator
            </p>
            
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-card border border-border rounded-xl px-6"
                >
                  <AccordionTrigger className="text-left text-foreground hover:no-underline py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <InlineAd />

      {/* Final CTA */}
      <section className="py-16 bg-cream-dark">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              Start Modeling Your Syndication Today
            </h2>
            <p className="text-muted-foreground mb-8">
              Professional waterfall modeling, IRR projections, and proforma analysis—completely free.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/syndication">
                  Launch Syndication Analyzer
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
