import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { InlineAd } from "@/components/ads";
import {
  PieChart,
  Calculator,
  TrendingUp,
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
    question: "What is cap rate in real estate?",
    answer: "Cap rate (capitalization rate) is the ratio of a property's Net Operating Income (NOI) to its current market value or purchase price. Cap Rate = NOI / Property Value. It measures the property's return independent of financing."
  },
  {
    question: "How do I calculate cap rate?",
    answer: "Cap Rate = Annual Net Operating Income ÷ Property Value × 100. For example: if NOI is $50,000 and property value is $500,000, cap rate = $50,000 ÷ $500,000 = 10%. Our calculator handles this automatically."
  },
  {
    question: "What is a good cap rate?",
    answer: "Cap rates vary by market, property type, and risk. Generally: 4-6% for Class A properties in prime markets, 6-8% for Class B in secondary markets, 8-10%+ for Class C or tertiary markets. Lower cap rates indicate lower risk but also lower returns."
  },
  {
    question: "Cap rate vs cash-on-cash return: what's the difference?",
    answer: "Cap rate measures unlevered return (ignores financing), while cash-on-cash measures levered return (accounts for your actual cash investment and debt service). Cap rate is property-focused; cash-on-cash is investor-focused."
  },
  {
    question: "Why do cap rates matter for investors?",
    answer: "Cap rates help you: compare properties across markets, estimate property value (Value = NOI / Cap Rate), assess risk level, and determine if a deal is priced fairly relative to similar properties."
  },
  {
    question: "What is NOI for cap rate calculation?",
    answer: "NOI (Net Operating Income) = Gross Rental Income - Operating Expenses. Operating expenses include taxes, insurance, maintenance, management, and utilities—but NOT mortgage payments or capital expenditures."
  },
  {
    question: "How do cap rates affect property values?",
    answer: "Cap rates and property values have an inverse relationship. When cap rates compress (go down), property values increase. When cap rates expand (go up), property values decrease. Value = NOI / Cap Rate."
  },
  {
    question: "Is this cap rate calculator free?",
    answer: "Yes! TheDealCalc is 100% free with no signup required. Calculate cap rates, NOI, and property values instantly. Export to PDF, CSV, or Excel."
  },
];

export default function CapRateCalculator() {
  return (
    <Layout>
      <Helmet>
        <title>Cap Rate Calculator (Free) | Capitalization Rate, NOI — TheDealCalc</title>
        <meta name="description" content="Free cap rate calculator: calculate capitalization rate, NOI, and property value. Compare investment properties and assess risk. No signup required." />
        <link rel="canonical" href="https://thedealcalc.com/cap-rate-calculator" />
        <meta property="og:title" content="Cap Rate Calculator (Free) | Capitalization Rate, NOI — TheDealCalc" />
        <meta property="og:description" content="Free cap rate calculator with NOI, property value, and risk analysis. Export to PDF, CSV, Excel." />
        <meta property="og:url" content="https://thedealcalc.com/cap-rate-calculator" />
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
              <PieChart className="h-4 w-4" />
              <span>100% Free • No Signup Required</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              Cap Rate Calculator
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Calculate capitalization rate, Net Operating Income, and property value instantly.
              Compare investment properties and assess risk with professional accuracy.
            </p>
            
            <Button variant="hero" size="xl" asChild>
              <Link to="/underwrite">
                Calculate Cap Rate
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
            Cap Rate Analysis Features
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: PieChart, title: "Cap Rate", desc: "Calculate capitalization rate from NOI and property value" },
              { icon: TrendingUp, title: "NOI Analysis", desc: "Break down income and expenses to determine Net Operating Income" },
              { icon: Calculator, title: "Property Valuation", desc: "Estimate property value using cap rate and NOI" },
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

      {/* Cap Rate Formula */}
      <section className="py-16 bg-cream-dark">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl font-bold text-foreground mb-8">
              Cap Rate Formula
            </h2>
            
            <div className="p-8 bg-card border border-border rounded-2xl mb-8">
              <p className="text-2xl font-display font-bold text-primary mb-4">
                Cap Rate = NOI ÷ Property Value × 100
              </p>
              <p className="text-muted-foreground">
                Where NOI = Gross Income - Operating Expenses
              </p>
            </div>
            
            <p className="text-muted-foreground">
              Our calculator automatically computes NOI from your income and expense inputs,
              then calculates cap rate based on your purchase price or property value.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-4">
            {[
              "Instant cap rate calculation",
              "NOI breakdown",
              "Property value estimation",
              "Compare cap rates across deals",
              "Risk assessment",
              "Market comparison",
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

      {/* FAQ Section */}
      <section className="py-16 bg-cream-dark">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-8">
              <HelpCircle className="h-6 w-6 text-primary" />
              <h2 className="font-display text-3xl font-bold text-foreground">
                Cap Rate FAQ
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
            Calculate Your Cap Rate Now
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Free, instant, no signup required.
          </p>
          <Button variant="secondary" size="xl" asChild>
            <Link to="/underwrite">
              Open Cap Rate Calculator
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
