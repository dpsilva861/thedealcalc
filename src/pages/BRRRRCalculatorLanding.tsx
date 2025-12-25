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
    answer: "BRRRR stands for Buy, Rehab, Rent, Refinance, Repeat. It's a real estate investment strategy where you buy a distressed property below market value, renovate it, rent it out, refinance to pull out your initial investment, and repeat the process with a new property."
  },
  {
    question: "How does the BRRRR calculator work?",
    answer: "Our BRRRR calculator models the entire process: purchase with bridge financing, renovation costs and holding period, refinance at the new appraised value (ARV), and ongoing rental cash flow. It calculates how much cash you can pull out and your long-term returns."
  },
  {
    question: "What is ARV (After Repair Value)?",
    answer: "ARV is the estimated market value of a property after all renovations are complete. It's crucial for BRRRR because your refinance loan amount is based on a percentage of ARV. Accurate ARV estimation is key to a successful BRRRR deal."
  },
  {
    question: "How much cash should I leave in a BRRRR deal?",
    answer: "Ideally, a successful BRRRR leaves little to no cash in the deal after refinance—this is called an 'infinite return' because you've pulled out all your capital. However, leaving 10-25% of your initial investment is still considered a good deal."
  },
  {
    question: "What LTV can I get on a BRRRR refinance?",
    answer: "Most conventional lenders offer 70-75% LTV on investment property refinances, while some portfolio lenders go up to 80%. Our calculator lets you model different LTV scenarios to see how they affect your cash-out and returns."
  },
  {
    question: "What holding costs should I include?",
    answer: "Include: property taxes, insurance, utilities, loan interest during rehab, and any HOA fees. Our calculator has fields for monthly holding costs and automatically calculates total holding costs based on your renovation timeline."
  },
  {
    question: "How do I know if a BRRRR deal is good?",
    answer: "Look for: positive cash flow after refinance, DSCR above 1.2, most or all of your cash back at refinance, and all-in costs below ARV. Our calculator includes risk flags that automatically identify potential issues."
  },
  {
    question: "Is this BRRRR calculator free?",
    answer: "Yes! TheDealCalc is 100% free with no signup required. Analyze unlimited BRRRR deals and export results to PDF, CSV, or Excel. We never store your deal data."
  },
];

export default function BRRRRCalculatorLanding() {
  return (
    <Layout>
      <Helmet>
        <title>BRRRR Calculator (Free) | Buy, Rehab, Rent, Refinance Analysis — TheDealCalc</title>
        <meta name="description" content="Free BRRRR calculator: analyze rehab costs, holding period, refinance cash-out, and rental returns. Complete Buy-Rehab-Rent-Refinance-Repeat analysis." />
        <link rel="canonical" href="https://thedealcalc.com/brrrr-calculator" />
        <meta property="og:title" content="BRRRR Calculator (Free) | Buy, Rehab, Rent, Refinance Analysis — TheDealCalc" />
        <meta property="og:description" content="Free BRRRR calculator with rehab costs, holding period, refinance cash-out, and rental cash flow analysis. No signup required." />
        <meta property="og:url" content="https://thedealcalc.com/brrrr-calculator" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
              }
            }))
          })}
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

      {/* BRRRR Phases */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-foreground text-center mb-12">
            Complete BRRRR Analysis
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Home, title: "Buy", desc: "Purchase price, down payment, closing costs, and bridge financing" },
              { icon: Hammer, title: "Rehab", desc: "Renovation budget, holding costs, and timeline" },
              { icon: DollarSign, title: "Rent", desc: "Rental income, vacancy, expenses, and cash flow" },
              { icon: TrendingUp, title: "Refinance", desc: "ARV, LTV, cash-out calculation, and new loan terms" },
            ].map((item) => (
              <div key={item.title} className="p-6 rounded-2xl bg-card border border-border text-center">
                <item.icon className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <InlineAd />

      {/* What You Get */}
      <section className="py-16 bg-cream-dark">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-foreground text-center mb-12">
            What Our BRRRR Calculator Provides
          </h2>
          
          <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-4">
            {[
              "Cash left in deal calculation",
              "Cash-on-cash return",
              "DSCR analysis",
              "Monthly cash flow projection",
              "Refinance cash-out amount",
              "Risk flags for problem deals",
              "Sensitivity tables (rent & ARV)",
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
