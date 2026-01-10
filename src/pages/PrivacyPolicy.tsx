import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
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
        "name": "Privacy Policy",
        "item": "https://thedealcalc.com/privacy"
      }
    ]
  };

  return (
    <Layout>
      <Helmet>
        <title>Privacy Policy | TheDealCalc</title>
        <meta name="description" content="Privacy policy for TheDealCalc explaining how we handle your data, use cookies, and protect your privacy. We never store your deal data." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thedealcalc.com/privacy" />
        <meta property="og:title" content="Privacy Policy | TheDealCalc" />
        <meta property="og:description" content="Learn how TheDealCalc protects your privacy. All calculations run locally—we never see your deal data." />
        <meta property="og:url" content="https://thedealcalc.com/privacy" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Privacy Policy
          </h1>
        </div>
        
        <p className="text-muted-foreground mb-8">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              1. Introduction
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              TheDealCalc ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
              explains how we collect, use, and safeguard your information when you use our free real estate 
              underwriting calculators.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong>Key Point:</strong> TheDealCalc is a free, ad-supported service. We do not require 
              user accounts, and we do not store your deal calculations or property data on our servers.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              2. Information We Collect
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Calculator Data</h3>
                <p className="text-muted-foreground leading-relaxed">
                  All calculations run entirely in your browser. <strong>We do not transmit, store, or 
                  have access to the property data or financial information you enter into our calculators.</strong> 
                  Your deal data stays on your device.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Analytics Data</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We use Google Analytics to understand how visitors use our website. This includes 
                  information such as pages visited, time on site, browser type, device type, and 
                  general geographic location. This data is aggregated and does not personally 
                  identify you.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Advertising Data</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We use Google AdSense to display advertisements that fund our free service. 
                  Google and its ad technology partners may collect data to serve personalized ads 
                  based on your browsing history and interests. This includes cookies and device identifiers.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-2">
                  <strong>Your choices:</strong> You can opt out of personalized advertising at{" "}
                  <a 
                    href="https://www.google.com/settings/ads" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google Ads Settings
                  </a>. For a complete list of our advertising partners, see our{" "}
                  <Link to="/ad-tech-providers" className="text-primary hover:underline">
                    Ad Technology Providers
                  </Link> page.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              3. How We Use Information
            </h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>To provide and maintain our free calculator service</li>
              <li>To analyze usage patterns and improve our calculators</li>
              <li>To display relevant advertisements that support our free service</li>
              <li>To detect and prevent abuse or technical issues</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              4. Cookies and Tracking Technologies
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar technologies for analytics and advertising. For detailed 
              information about the cookies we use, how to manage them, and how to opt out of 
              personalized advertising, please see our{" "}
              <Link to="/cookies" className="text-primary hover:underline">Cookie Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              5. Third-Party Advertising & Technology Providers
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We partner with Google AdSense to serve advertisements. Google and its advertising 
              partners use cookies and similar technologies to collect information for ad 
              personalization and measurement purposes.
            </p>
            <div className="bg-card border border-border rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-foreground mb-2">How Personalized Advertising Works</h3>
              <p className="text-muted-foreground text-sm">
                Google's advertising network may use information about your visits to this site 
                and other websites to provide advertisements about goods and services that may 
                interest you. This is commonly referred to as "interest-based" or "personalized" 
                advertising.
              </p>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              For a complete list of ad technology providers that may serve ads on this site, 
              please visit our{" "}
              <Link to="/ad-tech-providers" className="text-primary hover:underline">
                Ad Technology Providers
              </Link>{" "}
              page. Each provider has their own privacy policy governing how they collect and 
              use your data.
            </p>
            <h3 className="font-semibold text-foreground mb-2">Key Third-Party Services</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>
                <strong>Google Analytics:</strong> For website analytics.{" "}
                <a 
                  href="https://policies.google.com/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google Privacy Policy
                </a>
              </li>
              <li>
                <strong>Google AdSense:</strong> For advertising.{" "}
                <a 
                  href="https://policies.google.com/technologies/ads" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  How Google Uses Information
                </a>
              </li>
              <li>
                <strong>Google Funding Choices:</strong> For consent management (EU/EEA/UK/CH users).{" "}
                <a 
                  href="https://policies.google.com/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Privacy Policy
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              6. Data Security
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Because we do not store your calculator data, there is minimal risk of your financial 
              information being compromised through our service. All data you enter stays in your 
              browser and is cleared when you close the page or your browser.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              7. Your Rights
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Depending on your location, you may have rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Opt out of personalized advertising via{" "}
                <a 
                  href="https://www.google.com/settings/ads" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google Ads Settings
                </a>
              </li>
              <li>Opt out of Google Analytics via the{" "}
                <a 
                  href="https://tools.google.com/dlpage/gaoptout" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  GA Opt-out Browser Add-on
                </a>
              </li>
              <li>Control cookies through your browser settings</li>
              <li>Request information about data we may have collected</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              8. Children's Privacy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Our service is not directed to individuals under 18 years of age. We do not knowingly 
              collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              9. Changes to This Policy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by 
              posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              10. Contact Us
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at:{" "}
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
