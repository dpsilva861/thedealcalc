import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { InlineAd } from "@/components/ads";
import {
  RefreshCcw,
  Hammer,
  Home,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Calculator,
  Lightbulb,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is the BRRRR strategy?",
    answer: "BRRRR stands for Buy, Rehab, Rent, Refinance, Repeat. It's a real estate investment strategy where you buy a distressed property below market value, renovate it, rent it out, refinance to pull out your initial investment, and repeat the process with a new property. The goal is to recycle your capital infinitely while building a portfolio of cash-flowing rental properties."
  },
  {
    question: "How does the BRRRR calculator work?",
    answer: "Our BRRRR calculator models the entire investment lifecycle: initial purchase with bridge or hard money financing, renovation costs and holding period expenses, rental income projections, and refinance at the new appraised value (ARV). It calculates how much cash you can pull out at refinance, your ongoing cash flow, and key metrics like cash-on-cash return and DSCR."
  },
  {
    question: "What is ARV (After Repair Value)?",
    answer: "ARV is the estimated market value of a property after all renovations are complete. It's crucial for BRRRR because your refinance loan amount is based on a percentage (LTV) of ARV. Accurate ARV estimation is key to a successful BRRRR deal—overestimate it, and you'll leave more cash in the deal than expected."
  },
  {
    question: "How much cash should I leave in a BRRRR deal?",
    answer: "Ideally, a successful BRRRR leaves little to no cash in the deal after refinance—this is called an 'infinite return' because you've pulled out 100% of your capital. However, leaving 10-25% of your initial investment is still considered a good deal, especially if the property cash flows well and appreciates over time."
  },
  {
    question: "What LTV can I get on a BRRRR refinance?",
    answer: "Most conventional lenders offer 70-75% LTV on investment property refinances, while some portfolio lenders and credit unions go up to 80%. Our calculator lets you model different LTV scenarios to see how they affect your cash-out amount and ongoing returns."
  },
  {
    question: "What holding costs should I include?",
    answer: "Include: property taxes (prorated), insurance, utilities, bridge loan interest during rehab, and any HOA fees. Don't forget closing costs on both the acquisition and refinance. Our calculator has fields for monthly holding costs and automatically calculates total holding costs based on your renovation timeline."
  },
  {
    question: "How do I know if a BRRRR deal is good?",
    answer: "Look for: positive cash flow after refinance (ideally $200+/month), DSCR above 1.2 (preferably 1.25+), most or all of your cash back at refinance, and all-in costs below 75% of ARV. Our calculator includes risk flags that automatically identify potential issues with your deal."
  },
  {
    question: "Is this BRRRR calculator free?",
    answer: "Yes! TheDealCalc is 100% free with no signup required. Analyze unlimited BRRRR deals and export results to PDF, CSV, or Excel. We never store your deal data—all calculations run in your browser."
  },
  {
    question: "Can I use BRRRR for commercial properties?",
    answer: "BRRRR is primarily used for residential 1-4 unit properties because conventional refinance loans are readily available. For commercial properties (5+ units), similar value-add strategies exist but involve commercial financing with different terms, such as shorter loan terms, balloon payments, and debt yield requirements."
  },
  {
    question: "What's the difference between BRRRR and fix-and-flip?",
    answer: "With fix-and-flip, you sell the property after renovation for a one-time profit. With BRRRR, you keep the property as a rental and refinance to pull out your capital. BRRRR builds long-term wealth through cash flow and appreciation, while flipping generates quicker but one-time returns."
  },
];

export default function BRRRRCalculatorLanding() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": "https://thedealcalc.com/brrrr-calculator#app",
        "name": "BRRRR Calculator",
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "description": "Free BRRRR calculator for analyzing Buy-Rehab-Rent-Refinance-Repeat real estate deals with rehab costs, holding period, refinance cash-out, and rental returns.",
        "featureList": [
          "Cash left in deal calculation",
          "Cash-on-cash return analysis",
          "DSCR calculation",
          "Refinance cash-out modeling",
          "Holding cost calculation",
          "Risk flag identification",
          "PDF/Excel export"
        ]
      },
      {
        "@type": "WebPage",
        "@id": "https://thedealcalc.com/brrrr-calculator#webpage",
        "url": "https://thedealcalc.com/brrrr-calculator",
        "name": "BRRRR Calculator (Free) | Buy, Rehab, Rent, Refinance Analysis — TheDealCalc",
        "description": "Free BRRRR calculator: analyze rehab costs, holding period, refinance cash-out, and rental returns. Complete Buy-Rehab-Rent-Refinance-Repeat analysis.",
        "isPartOf": {
          "@id": "https://thedealcalc.com/#website"
        },
        "about": {
          "@id": "https://thedealcalc.com/brrrr-calculator#app"
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
        <title>BRRRR Calculator (Free) | Buy, Rehab, Rent, Refinance Analysis — TheDealCalc</title>
        <meta name="description" content="Free BRRRR calculator: analyze rehab costs, holding period, refinance cash-out, and rental returns. Complete Buy-Rehab-Rent-Refinance-Repeat analysis." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thedealcalc.com/brrrr-calculator" />
        <meta property="og:title" content="BRRRR Calculator (Free) | Buy, Rehab, Rent, Refinance Analysis — TheDealCalc" />
        <meta property="og:description" content="Free BRRRR calculator with rehab costs, holding period, refinance cash-out, and rental cash flow analysis. No signup required." />
        <meta property="og:url" content="https://thedealcalc.com/brrrr-calculator" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-cream-dark">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage-light border border-primary/20 text-primary text-sm font-medium mb-6">
              <RefreshCcw className="h-4 w-4" />
              <span>100% Free • No Signup Required</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              BRRRR Calculator
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Analyze Buy-Rehab-Rent-Refinance-Repeat deals with professional accuracy. 
              Calculate cash-out potential, rental returns, and risk factors instantly.
            </p>
            
            <Button variant="hero" size="xl" asChild>
              <Link to="/brrrr">
                Start BRRRR Analysis
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* What is BRRRR - Educational Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <article className="prose prose-slate max-w-none">
              <h2 className="font-display text-3xl font-bold text-foreground mb-6">
                What is the BRRRR Strategy?
              </h2>
              
              <p className="text-muted-foreground leading-relaxed text-lg mb-6">
                The BRRRR method (Buy, Rehab, Rent, Refinance, Repeat) is one of the most powerful 
                wealth-building strategies in real estate investing. Unlike traditional buy-and-hold 
                investing where your down payment stays locked in the property, BRRRR allows you to 
                recycle your capital and scale your portfolio faster.
              </p>
              
              <p className="text-muted-foreground leading-relaxed mb-6">
                The strategy works by purchasing distressed or undervalued properties below market 
                value, renovating them to increase value, renting them out for cash flow, and then 
                refinancing based on the new higher value (ARV). If executed correctly, you can pull 
                out most or all of your initial investment while keeping a cash-flowing rental property.
              </p>

              <h3 className="font-display text-2xl font-semibold text-foreground mt-10 mb-4">
                How BRRRR Works: Step by Step
              </h3>
              
              <div className="not-prose grid md:grid-cols-2 gap-6 my-8">
                {[
                  { 
                    icon: Home, 
                    title: "1. Buy", 
                    desc: "Find a distressed property at 65-75% of ARV. Use cash, hard money, or private lending for the purchase. Look for properties with cosmetic issues rather than structural problems." 
                  },
                  { 
                    icon: Hammer, 
                    title: "2. Rehab", 
                    desc: "Renovate the property to market standards. Focus on improvements that add the most value: kitchens, bathrooms, flooring, and paint. Budget 10-15% contingency for unexpected issues." 
                  },
                  { 
                    icon: DollarSign, 
                    title: "3. Rent", 
                    desc: "Find quality tenants and establish stable rental income. The property should cash flow even with the refinanced loan. Screen tenants thoroughly—a bad tenant can derail your BRRRR." 
                  },
                  { 
                    icon: TrendingUp, 
                    title: "4. Refinance", 
                    desc: "After seasoning period (typically 6 months), refinance into a conventional loan at 70-80% of ARV. This pays off your bridge loan and hopefully returns most of your capital." 
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
                Example BRRRR Deal Analysis
              </h3>
              
              <p className="text-muted-foreground leading-relaxed mb-4">
                Let's walk through a real-world BRRRR example to illustrate how the numbers work:
              </p>

              <div className="not-prose bg-card border border-border rounded-xl p-6 my-6">
                <h4 className="font-semibold text-foreground mb-4">Sample Property Analysis</h4>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-2">Acquisition</div>
                    <ul className="space-y-1 text-foreground">
                      <li>Purchase Price: <strong>$120,000</strong></li>
                      <li>Closing Costs: <strong>$3,000</strong></li>
                      <li>Rehab Budget: <strong>$35,000</strong></li>
                      <li>Holding Costs (4 mo): <strong>$4,000</strong></li>
                      <li className="pt-2 border-t border-border font-semibold">Total Investment: $162,000</li>
                    </ul>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-2">Refinance & Returns</div>
                    <ul className="space-y-1 text-foreground">
                      <li>After Repair Value: <strong>$210,000</strong></li>
                      <li>Refinance LTV: <strong>75%</strong></li>
                      <li>New Loan Amount: <strong>$157,500</strong></li>
                      <li>Cash Left in Deal: <strong>$4,500</strong></li>
                      <li className="pt-2 border-t border-border font-semibold">Monthly Cash Flow: $325</li>
                    </ul>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Result: Only $4,500 left in the deal with $325/month cash flow = 86% annualized return
                </p>
              </div>

              <h3 className="font-display text-2xl font-semibold text-foreground mt-10 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
                Common BRRRR Mistakes to Avoid
              </h3>
              
              <p className="text-muted-foreground leading-relaxed mb-4">
                While BRRRR can be incredibly profitable, many investors make costly mistakes:
              </p>
              
              <div className="not-prose space-y-3 my-6">
                {[
                  { 
                    title: "Overestimating ARV", 
                    desc: "Being too optimistic about post-rehab value is the #1 killer of BRRRR deals. Get multiple comps and be conservative." 
                  },
                  { 
                    title: "Underestimating Rehab Costs", 
                    desc: "Always add 15-20% contingency. Hidden issues like electrical, plumbing, or foundation problems can blow your budget." 
                  },
                  { 
                    title: "Ignoring Holding Costs", 
                    desc: "Bridge loan interest, insurance, taxes, and utilities add up fast. A 6-month rehab at $1,500/month is $9,000 in holding costs." 
                  },
                  { 
                    title: "Forgetting Seasoning Requirements", 
                    desc: "Most lenders require 6-12 months of ownership before refinancing. Factor this into your timeline and holding costs." 
                  },
                  { 
                    title: "Not Accounting for Vacancy", 
                    desc: "It may take 1-2 months to find a tenant after rehab. Budget for this gap in your cash flow projections." 
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
                When BRRRR Works Best
              </h3>
              
              <p className="text-muted-foreground leading-relaxed mb-4">
                BRRRR isn't right for every market or investor. It works best when:
              </p>
              
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
                <li>You can find properties significantly below market value (at least 20-30% discount)</li>
                <li>The local market has a good supply of distressed or dated properties</li>
                <li>Rents support positive cash flow even with a 75% LTV refinance</li>
                <li>You have access to bridge/hard money financing at reasonable rates</li>
                <li>You can manage or oversee renovations efficiently</li>
                <li>Property appreciation is stable or growing (not declining markets)</li>
              </ul>

              <p className="text-muted-foreground leading-relaxed">
                BRRRR may not work well in expensive coastal markets where purchase prices are too 
                high relative to rents, or in markets with limited inventory of distressed properties. 
                In these cases, traditional buy-and-hold or other strategies may be more appropriate.
              </p>
            </article>
          </div>
        </div>
      </section>

      <InlineAd />

      {/* What You Get */}
      <section className="py-16 bg-cream-dark">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-foreground text-center mb-4">
            What Our BRRRR Calculator Provides
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Our calculator models the complete BRRRR lifecycle with professional-grade accuracy.
          </p>
          
          <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-4">
            {[
              "Cash left in deal calculation",
              "Cash-on-cash return (pre & post refinance)",
              "DSCR (Debt Service Coverage Ratio)",
              "Monthly cash flow projection",
              "Refinance cash-out amount",
              "All-in cost vs ARV analysis",
              "Risk flags for problem deals",
              "Sensitivity tables (rent & ARV)",
              "Holding cost calculation",
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
              Ready to Analyze Your Deal?
            </h3>
          </div>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Our BRRRR calculator handles all the math so you can focus on finding great deals.
          </p>
          <Button variant="hero" size="lg" asChild>
            <Link to="/brrrr">
              Open BRRRR Calculator
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-8">
              <HelpCircle className="h-6 w-6 text-primary" />
              <h2 className="font-display text-3xl font-bold text-foreground">
                BRRRR Calculator FAQ
              </h2>
            </div>
            
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-card border border-border rounded-xl px-6"
                >
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 gradient-sage">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold text-primary-foreground mb-4">
            Ready to Analyze Your BRRRR Deal?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Start your free BRRRR analysis now. No signup, no limits.
          </p>
          <Button variant="secondary" size="xl" asChild>
            <Link to="/brrrr">
              Open BRRRR Calculator
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
