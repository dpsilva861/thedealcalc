import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  MessageSquare, 
  HelpCircle, 
  FileText, 
  ArrowRight,
  Clock,
  Shield
} from "lucide-react";

export default function Contact() {
  const contactEmail = "support@thedealcalc.com";

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
        "name": "Contact",
        "item": "https://thedealcalc.com/contact"
      }
    ]
  };

  return (
    <Layout>
      <Helmet>
        <title>Contact Us | TheDealCalc</title>
        <meta name="description" content="Get in touch with the TheDealCalc team. Questions about our free real estate investment calculators? We're here to help." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thedealcalc.com/contact" />
        <meta property="og:title" content="Contact Us | TheDealCalc" />
        <meta property="og:description" content="Get in touch with the TheDealCalc team for questions or feedback." />
        <meta property="og:url" content="https://thedealcalc.com/contact" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Mail className="h-8 w-8 text-primary" />
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Contact Us
          </h1>
        </div>

        <article className="prose prose-slate max-w-none">
          <section className="mb-12">
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Have questions about TheDealCalc? Need help with our calculators? Found a bug or 
              have a feature suggestion? We'd love to hear from you.
            </p>

            {/* Main Contact */}
            <div className="not-prose p-8 bg-card rounded-2xl border border-border text-center mb-8">
              <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
                Email Us
              </h2>
              <p className="text-muted-foreground mb-4">
                The best way to reach us is via email.
              </p>
              <a 
                href={`mailto:${contactEmail}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                <Mail className="h-5 w-5" />
                {contactEmail}
              </a>
            </div>

            {/* Response Time */}
            <div className="not-prose flex items-start gap-4 p-4 bg-sage-light rounded-xl mb-8">
              <Clock className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-foreground mb-1">Response Time</div>
                <div className="text-sm text-muted-foreground">
                  We typically respond within 1-2 business days. For urgent matters, please 
                  include "URGENT" in your subject line.
                </div>
              </div>
            </div>
          </section>

          {/* Common Topics */}
          <section className="mb-12">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-6">
              How Can We Help?
            </h2>
            <div className="not-prose grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: HelpCircle,
                  title: "Calculator Questions",
                  desc: "Need help understanding a metric or how to input your deal?"
                },
                {
                  icon: MessageSquare,
                  title: "Feature Requests",
                  desc: "Have an idea for a new calculator or feature?"
                },
                {
                  icon: FileText,
                  title: "Bug Reports",
                  desc: "Found something not working correctly? Let us know."
                },
                {
                  icon: Shield,
                  title: "Privacy Concerns",
                  desc: "Questions about how we handle your data?"
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border">
                  <item.icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground mb-1">{item.title}</div>
                    <div className="text-sm text-muted-foreground">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Before Contacting */}
          <section className="mb-12">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              Before Reaching Out
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You might find your answer in these resources:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li>
                <Link to="/how-it-works" className="text-primary hover:underline">
                  How It Works
                </Link>{" "}
                — Learn about our calculators and methodology
              </li>
              <li>
                <Link to="/brrrr-calculator" className="text-primary hover:underline">
                  BRRRR Calculator Guide
                </Link>{" "}
                — Detailed explanation of BRRRR analysis
              </li>
              <li>
                <Link to="/syndication-calculator" className="text-primary hover:underline">
                  Syndication Calculator Guide
                </Link>{" "}
                — Understanding syndication metrics
              </li>
              <li>
                <Link to="/disclaimer" className="text-primary hover:underline">
                  Disclaimer
                </Link>{" "}
                — Important information about using our tools
              </li>
              <li>
                <Link to="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>{" "}
                — How we handle your data
              </li>
            </ul>
          </section>

          {/* What We Can't Help With */}
          <section className="mb-12">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              What We Can't Help With
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              While we're happy to help with questions about our calculators, please understand 
              that we cannot provide:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Investment advice or recommendations</li>
              <li>Property valuations or appraisals</li>
              <li>Legal, tax, or financial advice</li>
              <li>Loan or financing services</li>
              <li>Deal-specific analysis or consulting</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              For these matters, please consult with qualified professionals in your area.
            </p>
          </section>

          {/* CTA */}
          <section className="not-prose mt-12 p-8 bg-sage-light rounded-2xl text-center">
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              Ready to Analyze a Deal?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Jump right in with our free calculators—no signup required.
            </p>
            <Button variant="hero" asChild>
              <Link to="/underwrite">
                Start Free Analysis
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </section>
        </article>
      </div>
    </Layout>
  );
}
