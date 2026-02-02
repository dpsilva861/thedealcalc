import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { InlineAd, AdSlot, adConfig, HeaderLeaderboard, MobileFixedBanner } from "@/components/ads";
import { buildCalculatorPageSchema } from "@/lib/seo/schemaBuilders";
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
    answer: "Cash-on-cash return (CoC) measures your annual pre-tax cash flow relative to the total cash you invested. CoC = Annual Cash Flow ÷ Total Cash Invested × 100. It shows the return on your actual out-of-pocket investment."
  },
  {
    question: "How do I calculate cash-on-cash return?",
    answer: "Cash-on-Cash = (Annual Cash Flow ÷ Total Cash Invested) × 100. Annual Cash Flow = NOI - Debt Service. Total Cash Invested = Down Payment + Closing Costs + Rehab Costs + Any Other Cash Outlay."
  },
  {
    question: "What is a typical cash-on-cash return target?",
    answer: "Many investors target 8-12% cash-on-cash return. However, acceptable returns vary: 6-8% may work in stable markets with appreciation potential, while 12%+ is often expected in riskier or cash-flow-focused strategies."
  },
  {
    question: "Cash-on-cash vs cap rate: what's the difference?",
    answer: "Cap rate ignores financing (measures unlevered return), while cash-on-cash accounts for your actual cash investment and debt payments. Cash-on-cash shows what you earn on YOUR invested capital; cap rate shows what the property earns overall."
  },
  {
    question: "How does leverage affect cash-on-cash return?",
    answer: "Leverage can amplify cash-on-cash return when the property's yield exceeds your borrowing cost (positive leverage). With 75% LTV at 7% interest on a 9% cap rate property, cash-on-cash can exceed 15%. But leverage also increases risk."
  },
  {
    question: "What is positive vs negative leverage?",
    answer: "Positive leverage occurs when borrowing increases your returns (property yield > loan cost). Negative leverage occurs when borrowing reduces returns (property yield < loan cost). Rising interest rates can turn positive leverage negative."
  },
];

export default function CashOnCashCalculator() {
  const jsonLd = buildCalculatorPageSchema(
    {
      name: "Cash-on-Cash Return Calculator",
      description: "Free cash-on-cash return calculator for real estate investors. Analyze your actual return on invested capital with leverage scenarios.",
      canonicalPath: "/cash-on-cash-calculator"
    },
    [
      { name: "Home", path: "/" },
      { name: "Calculators", path: "/calculators" },
      { name: "Cash-on-Cash Calculator", path: "/cash-on-cash-calculator" }
    ],
    faqs
  );

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
        <meta property="og:image" content="https://thedealcalc.com/og/og-coc.png" />
        <meta property="og:site_name" content="TheDealCalc" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Cash-on-Cash Return Calculator (Free) | CoC Analysis — TheDealCalc" />
        <meta name="twitter:description" content="Free cash-on-cash return calculator with leverage analysis." />
        <meta name="twitter:image" content="https://thedealcalc.com/og/og-coc.png" />
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      {/* Desktop Leaderboard Ad */}
      <HeaderLeaderboard />

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

      {/* Educational Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">
              What is Cash-on-Cash Return?
            </h2>
            <p className="text-muted-foreground mb-4">
              Cash-on-cash return (often abbreviated as CoC or CCR) measures the annual pre-tax cash flow you receive relative to the actual cash you invested in a property. Unlike cap rate, which ignores financing, cash-on-cash return accounts for leverage—your mortgage payments, down payment, and closing costs all factor into this metric.
            </p>
            <p className="text-muted-foreground mb-4">
              This makes cash-on-cash return one of the most practical metrics for investors because it answers a simple question: "For every dollar I put into this deal, how many cents am I getting back each year in cash flow?" If you invested $100,000 in a rental property and it generates $10,000 in annual cash flow after all expenses and debt service, your cash-on-cash return is 10%.
            </p>

            <h3 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
              Why Cash-on-Cash Return Matters
            </h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
              <li><strong>Measures your actual return:</strong> While cap rate is theoretical, cash-on-cash shows what you're really earning on the money you invested</li>
              <li><strong>Reveals the power of leverage:</strong> Smart use of debt can dramatically increase cash-on-cash returns above cap rate—sometimes doubling or tripling it</li>
              <li><strong>Helps compare investment opportunities:</strong> You can compare real estate cash-on-cash to stock dividends, bond yields, or other investment returns</li>
              <li><strong>Sets investment criteria:</strong> Many investors have minimum cash-on-cash thresholds (e.g., "I only buy properties with 8%+ CoC")</li>
            </ul>

            <h3 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
              How to Calculate Cash-on-Cash Return
            </h3>
            <p className="text-muted-foreground mb-4">
              Cash-on-cash return equals your annual pre-tax cash flow divided by your total cash invested, multiplied by 100. Annual cash flow is your Net Operating Income (NOI) minus your annual mortgage payments (principal and interest). Total cash invested includes your down payment, closing costs, and any initial renovation or capital expenditure costs.
            </p>

            <h3 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
              How to Interpret Your Results
            </h3>
            <p className="text-muted-foreground mb-4">
              Most rental property investors target cash-on-cash returns between 8% and 12%, though this varies based on market conditions, property type, and individual investment goals. In high-appreciation markets like coastal cities, investors might accept 4-6% cash-on-cash in exchange for expected property value gains. In cash-flow-focused markets in the Midwest or South, 10-15%+ cash-on-cash is achievable.
            </p>
            <p className="text-muted-foreground mb-4">
              Be aware that very high cash-on-cash returns (20%+) may indicate either exceptional opportunity or hidden risks—perhaps the property is in a declining area, has deferred maintenance, or the projections are overly optimistic.
            </p>

            <h3 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
              Common Mistakes When Calculating Cash-on-Cash Return
            </h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
              <li><strong>Forgetting closing costs:</strong> Always include buyer closing costs (typically 2-5% of purchase price) in your total cash invested</li>
              <li><strong>Using NOI instead of cash flow:</strong> Cash-on-cash must subtract mortgage payments. NOI is before debt service; cash flow is after.</li>
              <li><strong>Ignoring initial repairs:</strong> If you spend $20,000 on repairs before renting, that's part of your cash invested</li>
              <li><strong>Confusing with cap rate:</strong> Cap rate ignores financing entirely. Cash-on-cash is a levered return metric. They answer different questions.</li>
              <li><strong>Not accounting for vacancy:</strong> Use realistic vacancy rates (5-10% typically) in your cash flow projections</li>
            </ul>
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

      {/* Mobile Fixed Banner Ad */}
      <MobileFixedBanner />
    </Layout>
  );
}
