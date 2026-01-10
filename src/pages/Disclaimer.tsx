import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { AlertTriangle } from "lucide-react";

export default function Disclaimer() {
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
        "name": "Disclaimer",
        "item": "https://thedealcalc.com/disclaimer"
      }
    ]
  };

  return (
    <Layout>
      <Helmet>
        <title>Disclaimer | TheDealCalc</title>
        <meta name="description" content="Important disclaimers regarding the use of TheDealCalc real estate investment calculators." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thedealcalc.com/disclaimer" />
        <meta property="og:title" content="Disclaimer | TheDealCalc" />
        <meta property="og:description" content="Important disclaimers for using TheDealCalc calculators." />
        <meta property="og:url" content="https://thedealcalc.com/disclaimer" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <AlertTriangle className="h-8 w-8 text-accent" />
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Disclaimer
          </h1>
        </div>
        
        <p className="text-muted-foreground mb-8">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              1. Not Financial, Legal, or Tax Advice
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>TheDealCalc is for informational and educational purposes only.</strong> The 
              calculators, analyses, projections, and any other content provided on this website 
              do not constitute financial advice, investment advice, legal advice, tax advice, 
              or any other form of professional advice.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Before making any real estate investment decisions, you should consult with qualified 
              professionals including but not limited to: licensed real estate attorneys, certified 
              public accountants (CPAs), registered investment advisors, licensed real estate 
              brokers, and mortgage professionals.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              2. No Guarantee of Accuracy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              While we strive to provide accurate calculations and projections, TheDealCalc makes 
              no representations or warranties of any kind, express or implied, about the 
              completeness, accuracy, reliability, suitability, or availability of the 
              calculations or information provided.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Real estate investments involve numerous variables that cannot be fully captured 
              in any calculator. Actual results may vary significantly from projections based on 
              market conditions, property-specific factors, economic changes, and other 
              unpredictable circumstances.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              3. Investment Risk Warning
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Real estate investing involves substantial risk, including the potential 
              loss of principal.</strong> Past performance does not guarantee future results. 
              The projections shown by our calculators are hypothetical and based on assumptions 
              that may not reflect actual market conditions or your specific situation.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You should only invest funds that you can afford to lose. Do not make investment 
              decisions based solely on calculator outputs. Always conduct thorough due diligence 
              and independent verification of all assumptions.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              4. User Responsibility
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              You are solely responsible for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
              <li>The accuracy of data you input into the calculators</li>
              <li>Verifying all calculations independently before making decisions</li>
              <li>Understanding the limitations and assumptions of each calculator</li>
              <li>Seeking appropriate professional advice for your specific situation</li>
              <li>Any investment decisions you make based on calculator outputs</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              5. Limitation of Liability
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, TheDealCalc and its operators shall not be 
              liable for any direct, indirect, incidental, consequential, special, or exemplary 
              damages arising from your use of this website or reliance on any calculations or 
              information provided herein.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              This includes, without limitation, damages for loss of profits, goodwill, data, 
              or other intangible losses, even if we have been advised of the possibility of 
              such damages.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              6. Third-Party Links and Content
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              This website may contain links to third-party websites or display third-party 
              advertisements. We do not endorse, control, or take responsibility for the 
              content, products, or services offered by third parties. Your interactions 
              with third parties are solely between you and the third party.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              7. Changes to This Disclaimer
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to update or modify this disclaimer at any time without 
              prior notice. Your continued use of the website following any changes constitutes 
              acceptance of the updated disclaimer.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              8. Contact
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this disclaimer, please contact us at:{" "}
              <a href="mailto:support@dealcalc.com" className="text-primary hover:underline">
                support@dealcalc.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
