import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { InlineAd, AdSlot, adConfig } from "@/components/ads";
import { buildCalculatorPageSchema } from "@/lib/seo/schemaBuilders";
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
  const jsonLd = buildCalculatorPageSchema(
    {
      name: "Cap Rate Calculator",
      description: "Free cap rate calculator for real estate investors. Calculate capitalization rate, NOI, and property value instantly.",
      canonicalPath: "/cap-rate-calculator"
    },
    [
      { name: "Home", path: "/" },
      { name: "Calculators", path: "/calculators" },
      { name: "Cap Rate Calculator", path: "/cap-rate-calculator" }
    ],
    faqs
  );

  return (
    <Layout>
      <Helmet>
        <title>Cap Rate Calculator (Free) | Capitalization Rate, NOI — TheDealCalc</title>
        <meta name="description" content="Free cap rate calculator: calculate capitalization rate, NOI, and property value. Compare investment properties and assess risk. No signup required." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thedealcalc.com/cap-rate-calculator" />
        <meta property="og:title" content="Cap Rate Calculator (Free) | Capitalization Rate, NOI — TheDealCalc" />
        <meta property="og:description" content="Free cap rate calculator with NOI, property value, and risk analysis. Export to PDF, CSV, Excel." />
        <meta property="og:url" content="https://thedealcalc.com/cap-rate-calculator" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://thedealcalc.com/og/og-cap-rate.png" />
        <meta property="og:site_name" content="TheDealCalc" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Cap Rate Calculator (Free) | Capitalization Rate, NOI — TheDealCalc" />
        <meta name="twitter:description" content="Free cap rate calculator with NOI and property value analysis." />
        <meta name="twitter:image" content="https://thedealcalc.com/og/og-cap-rate.png" />
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
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

      {/* Educational Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">
              What is Capitalization Rate (Cap Rate)?
            </h2>
            <p className="text-muted-foreground mb-4">
              Capitalization rate, commonly known as cap rate, is one of the most fundamental metrics in real estate investing. It measures the annual return you would expect from a property if you purchased it entirely with cash—no mortgage or financing involved. This makes cap rate an "unlevered" return metric, allowing investors to compare properties objectively without the complications of different financing structures.
            </p>
            <p className="text-muted-foreground mb-4">
              Think of cap rate as the property's earning power relative to its price. A property generating $50,000 in annual Net Operating Income (NOI) that sells for $500,000 has a 10% cap rate. That means you'd earn 10% annually on your investment before any mortgage payments or income taxes.
            </p>

            <h3 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
              Why Cap Rate Matters for Real Estate Investors
            </h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
              <li><strong>Compare properties objectively:</strong> Cap rate removes financing from the equation, so you can compare a fully-financed property to an all-cash purchase on equal terms</li>
              <li><strong>Assess risk levels:</strong> Higher cap rates typically indicate higher risk and/or lower demand markets, while lower cap rates suggest more stable, desirable locations</li>
              <li><strong>Estimate property value:</strong> If you know the NOI and prevailing cap rates in an area, you can estimate what a property should be worth (Value = NOI ÷ Cap Rate)</li>
              <li><strong>Screen deals quickly:</strong> Cap rate is often the first metric investors check to see if a deal warrants deeper analysis</li>
            </ul>

            <h3 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
              How to Calculate Cap Rate
            </h3>
            <p className="text-muted-foreground mb-4">
              The cap rate formula is straightforward: divide the property's Net Operating Income by its current market value or purchase price, then multiply by 100 to express it as a percentage. NOI equals gross rental income minus all operating expenses—including property taxes, insurance, maintenance, property management fees, and vacancy allowance. Importantly, NOI does <em>not</em> include mortgage payments, capital expenditures, or depreciation.
            </p>

            <h3 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
              How to Interpret Cap Rate Results
            </h3>
            <p className="text-muted-foreground mb-4">
              Cap rates vary significantly by location, property type, and market conditions. In major metropolitan areas like New York or San Francisco, Class A apartment buildings might trade at 3-5% cap rates because they're considered safe, stable investments with strong appreciation potential. In secondary or tertiary markets, cap rates of 7-10% or higher are common, reflecting higher perceived risk but also higher potential cash returns.
            </p>
            <p className="text-muted-foreground mb-4">
              Remember: a "good" cap rate depends entirely on your investment goals. Income-focused investors might prefer higher cap rates for better cash flow, while appreciation-focused investors might accept lower cap rates in markets with strong growth potential.
            </p>

            <h3 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
              Common Cap Rate Mistakes to Avoid
            </h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
              <li><strong>Using gross income instead of NOI:</strong> Always subtract operating expenses. Using gross rent dramatically overstates cap rate.</li>
              <li><strong>Including mortgage payments in expenses:</strong> Cap rate measures unlevered returns. Debt service should never be in your NOI calculation.</li>
              <li><strong>Ignoring vacancy and reserves:</strong> Pro forma NOI should include realistic vacancy allowances (typically 5-10%) and maintenance reserves.</li>
              <li><strong>Comparing across property types:</strong> Retail, multifamily, industrial, and office properties have different risk profiles and typical cap rates. Compare apples to apples.</li>
            </ul>
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
