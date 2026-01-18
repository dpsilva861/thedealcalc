import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { InlineAd, AdSlot, adConfig } from "@/components/ads";
import { buildCalculatorPageSchema } from "@/lib/seo/schemaBuilders";
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
    answer: "Fix and flip is a real estate investment strategy where you buy a distressed property, renovate it to increase value, and sell it for profit. Unlike buy-and-hold strategies, the goal is to exit quickly after repairs are complete."
  },
  {
    question: "How do I calculate fix and flip profit?",
    answer: "Profit = Sale Price - Purchase Price - Renovation Costs - Holding Costs - Selling Costs. Selling costs include agent commissions (typically 5-6%) and seller closing costs (1-2%)."
  },
  {
    question: "What is ARV in fix and flip?",
    answer: "ARV (After Repair Value) is the estimated market value of the property after all renovations are complete. It's determined by comparing to similar recently sold properties (comps). Accurate ARV estimation is critical—overestimating can turn a profitable flip into a loss."
  },
  {
    question: "What is the 70% rule in house flipping?",
    answer: "The 70% rule states you should pay no more than 70% of ARV minus repair costs. For example: if ARV is $300,000 and repairs are $50,000, max purchase = ($300,000 × 0.70) - $50,000 = $160,000. This builds in profit margin and cost cushion."
  },
  {
    question: "What holding costs should I include?",
    answer: "Include: loan interest payments, property taxes, insurance, utilities, and any HOA fees during the renovation and selling period. A 6-month hold at $2,000/month adds $12,000 to your costs."
  },
  {
    question: "What selling costs should I budget?",
    answer: "Budget 8-10% of sale price for selling costs: 5-6% for real estate agent commissions, 1-2% for seller closing costs, and 1-2% for staging, photography, and contingency."
  },
];

export default function FixAndFlipCalculator() {
  const jsonLd = buildCalculatorPageSchema(
    {
      name: "Fix and Flip Calculator",
      description: "Free fix and flip calculator for house flippers. Analyze rehab costs, holding costs, profit, and ROI instantly.",
      canonicalPath: "/fix-and-flip-calculator"
    },
    [
      { name: "Home", path: "/" },
      { name: "Calculators", path: "/calculators" },
      { name: "Fix and Flip Calculator", path: "/fix-and-flip-calculator" }
    ],
    faqs
  );

  return (
    <Layout>
      <Helmet>
        <title>Fix and Flip Calculator (Free) | Rehab Costs, Profit, ROI — TheDealCalc</title>
        <meta name="description" content="Free fix and flip calculator: analyze rehab costs, holding costs, selling costs, profit, and ROI. Perfect for house flippers. No signup required." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thedealcalc.com/fix-and-flip-calculator" />
        <meta property="og:title" content="Fix and Flip Calculator (Free) | Rehab Costs, Profit, ROI — TheDealCalc" />
        <meta property="og:description" content="Free fix and flip calculator with rehab costs, holding costs, profit, and ROI analysis. Export to PDF, CSV, Excel." />
        <meta property="og:url" content="https://thedealcalc.com/fix-and-flip-calculator" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://thedealcalc.com/og/og-fix-flip.png" />
        <meta property="og:site_name" content="TheDealCalc" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Fix and Flip Calculator (Free) | Rehab Costs, Profit, ROI — TheDealCalc" />
        <meta name="twitter:description" content="Free fix and flip calculator for house flippers." />
        <meta name="twitter:image" content="https://thedealcalc.com/og/og-fix-flip.png" />
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
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

      {/* Mid-page Ad */}
      <AdSlot
        slotId={adConfig.slots.calculatorMid}
        minHeight={280}
        className="my-12"
      />

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

      {/* Educational Content Section */}
      <section className="py-16 bg-cream-dark">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">
              What is Fix and Flip Real Estate Investing?
            </h2>
            <p className="text-muted-foreground mb-4">
              Fix and flip is a short-term real estate investment strategy where you purchase a property below market value (often distressed or outdated), renovate it to increase its value, and then sell it quickly for profit. Unlike buy-and-hold strategies like BRRRR or traditional rentals, the goal is to exit the deal within months—typically 3 to 12 months—rather than hold for long-term appreciation and rental income.
            </p>
            <p className="text-muted-foreground mb-4">
              Successful house flipping requires accurate estimation of repair costs, realistic After Repair Value (ARV) projections, and careful management of holding costs during the renovation and sale process. Many experienced flippers follow the "70% rule" as a guideline: don't pay more than 70% of ARV minus repair costs for any property.
            </p>

            <h3 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
              Why Fix and Flip Analysis Matters
            </h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
              <li><strong>Prevents costly mistakes:</strong> Accurate deal analysis helps you avoid overpaying for properties or underestimating renovation costs</li>
              <li><strong>Projects realistic profit:</strong> Know your expected profit and Return on Investment (ROI) before committing capital</li>
              <li><strong>Accounts for all costs:</strong> Holding costs (loan interest, taxes, insurance, utilities) and selling costs (agent commissions, closing costs) can easily consume 10-15% of sale price</li>
              <li><strong>Validates the deal:</strong> If numbers don't work with conservative assumptions, walk away and find a better opportunity</li>
            </ul>

            <h3 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
              How to Calculate Fix and Flip Profit
            </h3>
            <p className="text-muted-foreground mb-4">
              Net profit on a flip equals your sale price minus all costs: purchase price, closing costs (buying), renovation costs, holding costs during rehab and sale period, and selling costs (agent commissions plus seller closing costs). Your ROI is then your net profit divided by your total investment (all cash put into the deal), expressed as a percentage.
            </p>

            <h3 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
              How to Interpret Your Fix and Flip Results
            </h3>
            <p className="text-muted-foreground mb-4">
              Most experienced flippers target 15-25% ROI on their total investment. If you invest $200,000 total (purchase, rehab, holding, selling), you'd want $30,000 to $50,000 in profit to justify the effort and risk. Deals with lower ROI may not adequately compensate for unexpected cost overruns, market shifts, or the time and effort involved.
            </p>
            <p className="text-muted-foreground mb-4">
              Always calculate your "break-even sale price"—the minimum you need to sell for to get your money back. This creates a safety margin and helps you understand your downside risk.
            </p>

            <h3 className="font-display text-xl font-semibold text-foreground mt-8 mb-4">
              Common Fix and Flip Mistakes
            </h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
              <li><strong>Overestimating ARV:</strong> Use comparable sales from the last 3-6 months, not optimistic future projections. This is the most common mistake that turns flips into losses.</li>
              <li><strong>Underestimating rehab costs:</strong> Add a 10-20% contingency to your renovation budget. Unexpected issues are the rule, not the exception.</li>
              <li><strong>Ignoring holding costs:</strong> Each month of delays costs money—loan interest, taxes, insurance, utilities. A 6-month flip at $2,500/month holding costs is $15,000 off your profit.</li>
              <li><strong>Underestimating selling costs:</strong> Budget 8-10% of sale price for agent commissions, seller closing costs, staging, and contingencies.</li>
              <li><strong>Using too much leverage:</strong> Hard money loans at 12-15% annual interest rates can quickly erode profits if the project takes longer than expected.</li>
            </ul>
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
