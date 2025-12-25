import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { InlineAd } from "@/components/ads";
import {
  Hammer,
  DollarSign,
  TrendingUp,
  Calculator,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
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
    question: "What is a fix and flip?",
    answer: "Fix and flip is a real estate investment strategy where you buy a distressed property, renovate it, and sell it quickly for profit. Unlike BRRRR, you don't hold the property long-term—the goal is to exit with profit after repairs are complete."
  },
  {
    question: "How do I calculate fix and flip profit?",
    answer: "Profit = Sale Price - Purchase Price - Renovation Costs - Holding Costs - Selling Costs (agent commissions, closing costs). Our calculator models all these components and shows your net profit and ROI."
  },
  {
    question: "What is ARV in fix and flip?",
    answer: "ARV (After Repair Value) is the estimated market value of the property after all renovations are complete. It's the price you expect to sell for. Accurate ARV estimation is critical—overestimating can turn a profitable flip into a loss."
  },
  {
    question: "What is the 70% rule in house flipping?",
    answer: "The 70% rule states you should pay no more than 70% of ARV minus repair costs. For example: if ARV is $300,000 and repairs are $50,000, max purchase = ($300,000 × 0.70) - $50,000 = $160,000. This builds in profit margin and cushion for unexpected costs."
  },
  {
    question: "What holding costs should I include?",
    answer: "Include: loan interest, property taxes, insurance, utilities, and any HOA fees during the renovation and selling period. These can add up quickly—a 6-month hold at $2,000/month is $12,000 off your profit."
  },
  {
    question: "What selling costs should I budget?",
    answer: "Budget 8-10% of sale price for selling costs: 5-6% for real estate agent commissions, 1-2% for seller closing costs, and 1-2% for staging, photography, and contingency. Our calculator lets you input your expected selling costs."
  },
  {
    question: "What is a good ROI for a fix and flip?",
    answer: "Most flippers target 15-25% ROI on their total investment. This means if you invest $200,000 total (purchase + rehab + holding + selling), you'd want $30,000-$50,000 profit. Higher ROI compensates for risk and effort."
  },
  {
    question: "Is this fix and flip calculator free?",
    answer: "Yes! TheDealCalc is 100% free with no signup required. Analyze unlimited fix and flip deals and export results to PDF, CSV, or Excel. We never store your deal data."
  },
];

export default function FixAndFlipCalculator() {
  return (
    <Layout>
      <Helmet>
        <title>Fix and Flip Calculator (Free) | Rehab Costs, Profit, ROI — TheDealCalc</title>
        <meta name="description" content="Free fix and flip calculator: analyze rehab costs, holding costs, selling costs, profit, and ROI. Perfect for house flippers. No signup required." />
        <link rel="canonical" href="https://thedealcalc.com/fix-and-flip-calculator" />
        <meta property="og:title" content="Fix and Flip Calculator (Free) | Rehab Costs, Profit, ROI — TheDealCalc" />
        <meta property="og:description" content="Free fix and flip calculator with rehab costs, holding costs, profit, and ROI analysis. Export to PDF, CSV, Excel." />
        <meta property="og:url" content="https://thedealcalc.com/fix-and-flip-calculator" />
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
              <Hammer className="h-4 w-4" />
              <span>100% Free • No Signup Required</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              Fix and Flip Calculator
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Analyze house flipping deals with precision. Calculate renovation costs, 
              holding costs, selling costs, net profit, and ROI instantly.
            </p>
            
            <Button variant="hero" size="xl" asChild>
              <Link to="/underwrite">
                Start Flip Analysis
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
            Complete Fix & Flip Analysis
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: DollarSign, title: "Acquisition Costs", desc: "Purchase price, closing costs, and financing" },
              { icon: Hammer, title: "Rehab Budget", desc: "Renovation costs and contingency" },
              { icon: Clock, title: "Holding Costs", desc: "Monthly costs during renovation period" },
              { icon: TrendingUp, title: "Profit & ROI", desc: "Net profit and return on investment" },
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

      {/* Features */}
      <section className="py-16 bg-cream-dark">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-foreground text-center mb-12">
            What Our Fix & Flip Calculator Provides
          </h2>
          
          <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-4">
            {[
              "Total investment calculation",
              "Net profit after all costs",
              "ROI percentage",
              "Break-even sale price",
              "70% rule verification",
              "Holding cost breakdown",
              "Sensitivity analysis",
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
                Fix and Flip FAQ
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
            Ready to Analyze Your Fix & Flip?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Start your free analysis now. No signup required.
          </p>
          <Button variant="secondary" size="xl" asChild>
            <Link to="/underwrite">
              Open Fix & Flip Calculator
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
