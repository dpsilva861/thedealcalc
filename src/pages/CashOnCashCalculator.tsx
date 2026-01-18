import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { InlineAd, AdSlot, adConfig } from "@/components/ads";
import {
  DollarSign,
  Calculator,
  TrendingUp,
  Percent,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is cash-on-cash return?",
    answer: "Cash-on-cash return (CoC) measures your annual pre-tax cash flow relative to the total cash you invested. CoC = Annual Cash Flow ÷ Total Cash Invested × 100. It's one of the most important metrics for rental property investors."
  },
  {
    question: "How do I calculate cash-on-cash return?",
    answer: "Cash-on-Cash = (Annual Cash Flow ÷ Total Cash Invested) × 100. Annual Cash Flow = NOI - Debt Service. Total Cash Invested = Down Payment + Closing Costs + Rehab Costs + Any Other Cash Outlay."
  },
  {
    question: "What is a good cash-on-cash return?",
    answer: "Most investors target 8-12% cash-on-cash return. However, 'good' varies: 6-8% may be acceptable in stable markets with strong appreciation potential, while 12%+ is expected in riskier or cash-flow-focused markets."
  },
  {
    question: "Cash-on-cash vs cap rate: what's the difference?",
    answer: "Cap rate ignores financing (measures unlevered return), while cash-on-cash accounts for your actual cash investment and debt payments. Cash-on-cash is what you actually earn on YOUR money; cap rate is what the property earns overall."
  },
  {
    question: "Why is cash-on-cash return important?",
    answer: "Cash-on-cash tells you the actual return on your invested capital. It helps you: compare deals, assess whether leverage is helping or hurting, and determine if a property meets your investment criteria."
  },
  {
    question: "How does leverage affect cash-on-cash return?",
    answer: "Leverage can amplify cash-on-cash return when the property's return exceeds your borrowing cost. With 75% LTV at 7% interest on a 9% cap rate property, your cash-on-cash can exceed 15%. But leverage also increases risk if returns fall."
  },
  {
    question: "Should I focus on cash-on-cash or appreciation?",
    answer: "It depends on your goals. Cash-on-cash is important for income investors who need regular cash flow. Appreciation investors may accept lower cash-on-cash in exchange for expected property value growth. Most investors want both."
  },
  {
    question: "Is this cash-on-cash calculator free?",
    answer: "Yes! TheDealCalc is 100% free with no signup required. Calculate cash-on-cash return, compare scenarios, and export results to PDF, CSV, or Excel."
  },
];

export default function CashOnCashCalculator() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://thedealcalc.com/" },
          { "@type": "ListItem", "position": 2, "name": "Calculators", "item": "https://thedealcalc.com/calculators" },
          { "@type": "ListItem", "position": 3, "name": "Cash-on-Cash Calculator", "item": "https://thedealcalc.com/cash-on-cash-calculator" }
        ]
      },
      {
        "@type": "SoftwareApplication",
        "name": "Cash-on-Cash Return Calculator",
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Any",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "description": "Free cash-on-cash return calculator for real estate investors. Analyze your actual return on invested capital with leverage scenarios.",
        "url": "https://thedealcalc.com/cash-on-cash-calculator"
      },
      {
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
        }))
      }
    ]
  };

  return (
    <Layout>
      <Helmet>
        <title>Cash-on-Cash Return Calculator (Free) | CoC Analysis — TheDealCalc</title>
        <meta name="description" content="Free cash-on-cash return calculator: analyze your actual return on invested capital. Compare leverage scenarios and optimize your real estate investment." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thedealcalc.com/cash-on-cash-calculator" />
        <meta property="og:title" content="Cash-on-Cash Return Calculator (Free) | CoC Analysis — TheDealCalc" />
        <meta property="og:description" content="Free cash-on-cash return calculator with leverage analysis. Calculate your actual return on invested capital." />
        <meta property="og:url" content="https://thedealcalc.com/cash-on-cash-calculator" />
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
              <Percent className="h-4 w-4" />
              <span>100% Free • No Signup Required</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              Cash-on-Cash Return Calculator
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Calculate your actual return on invested capital. Understand how leverage
              affects your real estate investment returns.
            </p>
            
            <Button variant="hero" size="xl" asChild>
              <Link to="/underwrite">
                Calculate Cash-on-Cash
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* What You Can Calculate */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-foreground text-center mb-12">
            Cash-on-Cash Analysis Features
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: DollarSign, title: "Year 1 CoC", desc: "Cash-on-cash return for the first year of ownership" },
              { icon: TrendingUp, title: "Stabilized CoC", desc: "Long-term cash-on-cash after stabilization" },
              { icon: Calculator, title: "Leverage Impact", desc: "See how different LTV scenarios affect returns" },
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

      {/* Formula */}
      <section className="py-16 bg-cream-dark">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl font-bold text-foreground mb-8">
              Cash-on-Cash Formula
            </h2>
            
            <div className="p-8 bg-card border border-border rounded-2xl mb-8">
              <p className="text-2xl font-display font-bold text-primary mb-4">
                CoC = Annual Cash Flow ÷ Total Cash Invested × 100
              </p>
              <p className="text-muted-foreground">
                Annual Cash Flow = NOI - Annual Debt Service
              </p>
            </div>
            
            <p className="text-muted-foreground">
              Our calculator computes annual cash flow from your income, expenses, and financing,
              then calculates cash-on-cash return based on your total equity investment.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-4">
            {[
              "Year 1 cash-on-cash",
              "Stabilized cash-on-cash",
              "Cash flow projection",
              "Leverage scenario analysis",
              "Debt service calculation",
              "Total return comparison",
              "Free PDF/CSV export",
              "No signup required",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mid-page Ad */}
      <AdSlot
        slotId={adConfig.slots.calculatorMid}
        minHeight={280}
        className="my-12"
      />

      {/* FAQ Section */}
      <section className="py-16 bg-cream-dark">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-8">
              <HelpCircle className="h-6 w-6 text-primary" />
              <h2 className="font-display text-3xl font-bold text-foreground">
                Cash-on-Cash FAQ
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
            Calculate Your Cash-on-Cash Return
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Free, instant, no signup required.
          </p>
          <Button variant="secondary" size="xl" asChild>
            <Link to="/underwrite">
              Open Calculator
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
