import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { FileText } from "lucide-react";

export default function TermsOfService() {
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
        "name": "Terms of Service",
        "item": "https://thedealcalc.com/terms"
      }
    ]
  };

  return (
    <Layout>
      <Helmet>
        <title>Terms of Service | TheDealCalc</title>
        <meta name="description" content="Terms of service for using TheDealCalc free real estate investment calculators. Understand your rights and responsibilities." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thedealcalc.com/terms" />
        <meta property="og:title" content="Terms of Service | TheDealCalc" />
        <meta property="og:description" content="Terms of service for TheDealCalc free real estate calculators." />
        <meta property="og:url" content="https://thedealcalc.com/terms" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://thedealcalc.com/og/og-default.png" />
        <meta property="og:site_name" content="TheDealCalc" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Terms of Service | TheDealCalc" />
        <meta name="twitter:description" content="Terms of service for TheDealCalc free real estate calculators." />
        <meta name="twitter:image" content="https://thedealcalc.com/og/og-default.png" />
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Terms of Service
          </h1>
        </div>
        
        <p className="text-muted-foreground mb-8">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              1. Agreement to Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using TheDealCalc (the "Service"), you agree to be bound by these Terms of 
              Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              2. Description of Service
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              TheDealCalc provides free real estate investment calculators for informational and 
              educational purposes. The Service is ad-supported and requires no user account or 
              payment. All calculations are performed in your browser, and we do not store your 
              deal data.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              3. Free Service
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              TheDealCalc is provided completely free of charge. We reserve the right to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
              <li>Display advertisements to support the Service</li>
              <li>Modify or discontinue any feature at any time</li>
              <li>Change these terms with reasonable notice</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              4. Not Financial or Legal Advice
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>IMPORTANT:</strong> The calculators and content provided by TheDealCalc are for 
              informational purposes only and do not constitute financial, investment, legal, or tax 
              advice. See our{" "}
              <Link to="/disclaimer" className="text-primary hover:underline">Disclaimer</Link>{" "}
              for complete details.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Always consult with qualified professionals before making real estate investment decisions.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              5. User Conduct
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree not to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to interfere with or disrupt the Service</li>
              <li>Scrape, crawl, or use automated tools to access the Service in a way that impacts performance</li>
              <li>Misrepresent your affiliation with any person or entity</li>
              <li>Use the Service to harm or defraud others</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              6. Intellectual Property
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service and its original content, features, and functionality are owned by TheDealCalc 
              and are protected by copyright, trademark, and other intellectual property laws. You may 
              not copy, modify, distribute, or create derivative works without our express permission.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              7. Third-Party Advertising
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service displays third-party advertisements. We are not responsible for the content, 
              accuracy, or opinions expressed in advertisements. Your interactions with advertisers 
              are solely between you and the advertiser.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              8. Disclaimer of Warranties
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
              EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, 
              SECURE, OR ERROR-FREE, OR THAT THE CALCULATIONS WILL BE ACCURATE OR COMPLETE.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              9. Limitation of Liability
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, THEDEALCALC SHALL NOT BE LIABLE FOR ANY 
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR 
              USE OF THE SERVICE, INCLUDING BUT NOT LIMITED TO FINANCIAL LOSSES FROM INVESTMENT 
              DECISIONS MADE USING OUR CALCULATORS.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              10. Privacy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Your use of the Service is also governed by our{" "}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>{" "}
              and{" "}
              <Link to="/cookies" className="text-primary hover:underline">Cookie Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              11. Changes to Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. We will post any changes on 
              this page with an updated "Last updated" date. Your continued use of the Service 
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              12. Governing Law
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the 
              United States, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              13. Contact
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about these Terms, please contact us at:{" "}
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
