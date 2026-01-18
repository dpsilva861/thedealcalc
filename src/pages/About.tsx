import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Target, 
  Zap, 
  Shield, 
  Calculator, 
  ArrowRight,
  CheckCircle2,
  Building2,
  TrendingUp,
  FileText
} from "lucide-react";

export default function About() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
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
        "name": "About",
        "item": "https://thedealcalc.com/about"
      }
    ]
  };

  return (
    <Layout>
      <Helmet>
        <title>About TheDealCalc | Free Real Estate Investment Calculator</title>
        <meta name="description" content="Learn about TheDealCalc - the free real estate investment calculator built by investors for investors. No signup required, no hidden fees." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thedealcalc.com/about" />
        <meta property="og:title" content="About TheDealCalc | Free Real Estate Investment Calculator" />
        <meta property="og:description" content="Learn about TheDealCalc - the free real estate investment calculator built by investors for investors." />
        <meta property="og:url" content="https://thedealcalc.com/about" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://thedealcalc.com/og/og-default.png" />
        <meta property="og:site_name" content="TheDealCalc" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About TheDealCalc" />
        <meta name="twitter:description" content="Free real estate investment calculator built by investors for investors." />
        <meta name="twitter:image" content="https://thedealcalc.com/og/og-default.png" />
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            About TheDealCalc
          </h1>
        </div>

        <article className="prose prose-slate max-w-none">
          {/* Mission Section */}
          <section className="mb-12">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Our Mission
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg mb-4">
              TheDealCalc was created with a simple mission: to provide real estate investors with 
              professional-grade underwriting tools without the barriers of expensive software 
              subscriptions or complicated spreadsheets.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We believe that every investor—whether you're analyzing your first rental property or 
              your fiftieth—deserves access to accurate, reliable financial analysis tools. That's 
              why TheDealCalc is completely free, with no signup required and no limits on how many 
              deals you can analyze.
            </p>
          </section>

          {/* Who We Built This For */}
          <section className="mb-12">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              Who We Built This For
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              TheDealCalc serves a diverse community of real estate professionals and investors:
            </p>
            <div className="grid sm:grid-cols-2 gap-4 not-prose mb-6">
              {[
                { title: "New Investors", desc: "Learning to analyze their first deals with confidence" },
                { title: "Experienced Investors", desc: "Quickly screening properties before deeper due diligence" },
                { title: "Real Estate Agents", desc: "Helping clients understand investment potential" },
                { title: "Property Managers", desc: "Evaluating properties for owners and investors" },
                { title: "Syndicators", desc: "Modeling complex deal structures and waterfalls" },
                { title: "Lenders & Brokers", desc: "Quickly validating deal economics" },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground">{item.title}</div>
                    <div className="text-sm text-muted-foreground">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Why Free */}
          <section className="mb-12">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              Why It's Free
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We've all been there: you find a promising property, need to run the numbers quickly, 
              and suddenly you're faced with a paywall or a complicated Excel template that takes 
              hours to set up. We built TheDealCalc to solve that problem.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Our service is supported by advertising, which allows us to keep the calculators 
              completely free. We don't require you to create an account, we don't collect your 
              personal information beyond basic analytics, and we don't store your deal data—all 
              calculations run entirely in your browser.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              This means you can analyze as many deals as you want, export unlimited reports, and 
              never worry about hitting a usage limit or being upsold to a premium tier.
            </p>
          </section>

          {/* What We Offer */}
          <section className="mb-12">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calculator className="h-6 w-6 text-primary" />
              What We Offer
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              TheDealCalc provides a suite of specialized calculators for different investment strategies:
            </p>
            <div className="not-prose space-y-4 mb-6">
              {[
                {
                  title: "Quick Underwrite",
                  desc: "Fast analysis for rental properties with cash flow projections, cap rates, and cash-on-cash returns."
                },
                {
                  title: "BRRRR Calculator",
                  desc: "Complete Buy-Rehab-Rent-Refinance-Repeat modeling with bridge financing, renovation costs, and refinance cash-out analysis."
                },
                {
                  title: "Syndication Analyzer",
                  desc: "Professional-grade tool for modeling GP/LP splits, waterfall distributions, and investor-level returns."
                },
              ].map((calc) => (
                <div key={calc.title} className="p-4 bg-card rounded-xl border border-border">
                  <div className="font-semibold text-foreground mb-1">{calc.title}</div>
                  <div className="text-sm text-muted-foreground">{calc.desc}</div>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Each calculator produces detailed metrics including IRR, equity multiple, DSCR, NOI, 
              and cash flow projections. You can export your analysis to PDF, CSV, or Excel format 
              for sharing with partners, lenders, or your own records.
            </p>
          </section>

          {/* Our Approach */}
          <section className="mb-12">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              Our Approach to Calculations
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Unlike some tools that use oversimplified formulas or "AI-powered" estimates, TheDealCalc 
              uses deterministic, month-by-month financial modeling. This means:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li>Every calculation is reproducible—same inputs always produce the same outputs</li>
              <li>Cash flows are modeled monthly, not just as annual averages</li>
              <li>Loan amortization schedules are calculated precisely, not approximated</li>
              <li>Growth rates and escalations are applied on a proper time-value basis</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              We've validated our calculations against industry-standard spreadsheets and 
              professional underwriting software to ensure accuracy. Our IRR calculations use proper 
              Newton-Raphson iteration, and all metrics follow NCREIF and real estate industry conventions.
            </p>
          </section>

          {/* Privacy & Security */}
          <section className="mb-12">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Privacy & Data Security
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Your deal data is yours. We designed TheDealCalc with privacy as a core principle:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li><strong>No data transmission:</strong> All calculations run in your browser</li>
              <li><strong>No account required:</strong> Use the tool immediately without signup</li>
              <li><strong>No deal storage:</strong> We never see or store your property data</li>
              <li><strong>Your exports, your data:</strong> Downloaded files belong entirely to you</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              We use basic analytics to understand how people use our site (which pages are popular, 
              common user flows, etc.) but this never includes your deal-specific information. For 
              full details, see our{" "}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          {/* Limitations */}
          <section className="mb-12">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Understanding Limitations
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              While we strive for accuracy, it's important to understand what TheDealCalc can and 
              cannot do:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li>Our calculators are tools for analysis, not guarantees of returns</li>
              <li>Results depend entirely on the accuracy of your inputs and assumptions</li>
              <li>We can't predict market conditions, vacancy rates, or expense changes</li>
              <li>This is not financial, legal, or tax advice—consult professionals for decisions</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Always perform thorough due diligence and work with qualified professionals before 
              making investment decisions. See our{" "}
              <Link to="/disclaimer" className="text-primary hover:underline">Disclaimer</Link>{" "}
              for complete details.
            </p>
          </section>

          {/* Contact CTA */}
          <section className="not-prose mt-12 p-8 bg-sage-light rounded-2xl text-center">
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              Questions or Feedback?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              We're always looking to improve TheDealCalc. If you have questions, suggestions, 
              or feedback, we'd love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" asChild>
                <Link to="/contact">
                  Contact Us
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/underwrite">Start Analyzing</Link>
              </Button>
            </div>
          </section>
        </article>
      </div>
    </Layout>
  );
}
