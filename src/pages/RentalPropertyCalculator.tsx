import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { InlineAd, AdSlot } from "@/components/ads";
import {
  Calculator,
  TrendingUp,
  DollarSign,
  PieChart,
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
    question: "What is a rental property calculator?",
    answer: "A rental property calculator is a tool that helps real estate investors analyze the potential returns of an investment property. It calculates key metrics like cash flow, cap rate, cash-on-cash return, and IRR based on your purchase price, rental income, expenses, and financing terms."
  },
  {
    question: "How do I calculate cash flow on a rental property?",
    answer: "Cash flow is calculated by subtracting all expenses (mortgage, taxes, insurance, maintenance, vacancy, property management) from your gross rental income. Positive cash flow means your rental income exceeds your expenses. Our calculator models this monthly and annually."
  },
  {
    question: "What is a good cash-on-cash return for rental property?",
    answer: "Most investors target 8-12% cash-on-cash return for rental properties, though this varies by market and risk tolerance. Cash-on-cash return measures your annual pre-tax cash flow divided by the total cash invested. Higher returns typically come with higher risk."
  },
  {
    question: "What is cap rate and why does it matter?",
    answer: "Cap rate (capitalization rate) is the ratio of Net Operating Income (NOI) to property value. It measures the property's return independent of financing. A 5-7% cap rate is common in stable markets, while higher cap rates (8-10%+) are found in emerging or riskier markets."
  },
  {
    question: "What expenses should I include in my rental property analysis?",
    answer: "Include: property taxes, insurance, property management (8-10%), maintenance/repairs (5-10% of rent), vacancy allowance (5-10%), capital expenditure reserves, utilities (if owner-paid), HOA fees, and any other recurring costs. Our calculator accounts for all these categories."
  },
  {
    question: "How does financing affect my rental property returns?",
    answer: "Financing through a mortgage allows you to leverage your investment, potentially increasing returns (cash-on-cash and IRR) when the property's return exceeds your borrowing cost. However, leverage also increases risk if the property underperforms."
  },
  {
    question: "What is IRR and how is it calculated?",
    answer: "IRR (Internal Rate of Return) is the annualized return that accounts for the time value of money across your entire investment period, including cash flows and final sale proceeds. It's considered the most comprehensive measure of investment performance."
  },
  {
    question: "Is this rental property calculator free?",
    answer: "Yes! TheDealCalc is 100% free to use. No signup required, no limits on analyses, and free exports to PDF, CSV, and Excel. We never store your deal data—your privacy is protected."
  },
];

export default function RentalPropertyCalculator() {
  return (
    <Layout>
      <Helmet>
        <title>Rental Property Calculator (Free) | Cash Flow, Cap Rate, IRR — TheDealCalc</title>
        <meta name="description" content="Free rental property calculator: analyze cash flow, NOI, cap rate, cash-on-cash return, and IRR. Instant results with 30-year projections. No signup required." />
        <link rel="canonical" href="https://thedealcalc.com/rental-property-calculator" />
        <meta property="og:title" content="Rental Property Calculator (Free) | Cash Flow, Cap Rate, IRR — TheDealCalc" />
        <meta property="og:description" content="Free rental property calculator with cash flow, NOI, cap rate, cash-on-cash return, and IRR analysis. Export to PDF, CSV, Excel." />
        <meta property="og:url" content="https://thedealcalc.com/rental-property-calculator" />
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
              <Calculator className="h-4 w-4" />
              <span>100% Free • No Signup Required</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              Rental Property Calculator
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Analyze any rental property investment with professional-grade accuracy. 
              Calculate cash flow, cap rate, cash-on-cash return, and IRR instantly.
            </p>
            
            <Button variant="hero" size="xl" asChild>
              <Link to="/underwrite">
                Start Free Analysis
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
            What Our Rental Property Calculator Provides
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: DollarSign, title: "Cash Flow Analysis", desc: "Monthly and annual cash flow projections with detailed expense breakdown" },
              { icon: TrendingUp, title: "Key Metrics", desc: "IRR, cash-on-cash return, cap rate, DSCR, and equity multiple" },
              { icon: PieChart, title: "NOI Breakdown", desc: "Net Operating Income with all expenses itemized" },
              { icon: Calculator, title: "Sensitivity Tables", desc: "See how returns change with different assumptions" },
            ].map((item) => (
              <div key={item.title} className="p-6 rounded-2xl bg-card border border-border">
                <item.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <InlineAd />

      {/* How It Works */}
      <section className="py-16 bg-cream-dark">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-foreground text-center mb-12">
            How to Use the Rental Property Calculator
          </h2>
          
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              { step: "1", title: "Enter Property Details", desc: "Purchase price, closing costs, and hold period" },
              { step: "2", title: "Add Income & Expenses", desc: "Rent, vacancy rate, taxes, insurance, and operating costs" },
              { step: "3", title: "Configure Financing", desc: "Loan amount, interest rate, and amortization terms" },
              { step: "4", title: "Get Instant Results", desc: "View all metrics and export to PDF, CSV, or Excel" },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 p-4 rounded-xl bg-card border border-border">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-3xl font-bold text-foreground text-center mb-8">
              Why Choose TheDealCalc
            </h2>
            
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "100% free, no signup required",
                "Professional-grade calculations",
                "30-year cash flow projections",
                "Sensitivity analysis included",
                "Export to PDF, CSV, Excel",
                "Mobile-friendly design",
                "No data storage—privacy first",
                "Instant results",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3 p-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mid-page Ad */}
      <AdSlot
        slotId="calculator-mid"
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
                Frequently Asked Questions
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
            Ready to Analyze Your Rental Property?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Start your free analysis now. No signup, no limits, no hidden fees.
          </p>
          <Button variant="secondary" size="xl" asChild>
            <Link to="/underwrite">
              Start Free Calculator
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
