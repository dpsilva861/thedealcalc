import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Cookie } from "lucide-react";

export default function CookiePolicy() {
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
        "name": "Cookie Policy",
        "item": "https://thedealcalc.com/cookies"
      }
    ]
  };

  return (
    <Layout>
      <Helmet>
        <title>Cookie Policy | TheDealCalc</title>
        <meta name="description" content="Cookie policy for TheDealCalc explaining how we use cookies, advertising technologies, and analytics." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thedealcalc.com/cookies" />
        <meta property="og:title" content="Cookie Policy | TheDealCalc" />
        <meta property="og:description" content="Learn how TheDealCalc uses cookies and tracking technologies." />
        <meta property="og:url" content="https://thedealcalc.com/cookies" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Cookie className="h-8 w-8 text-primary" />
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Cookie Policy
          </h1>
        </div>
        
        <p className="text-muted-foreground mb-8">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              1. What Are Cookies
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Cookies are small text files placed on your device when you visit a website. They 
              help the website remember information about your visit, making your next visit 
              easier and the site more useful to you.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              2. How We Use Cookies
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              TheDealCalc uses cookies and similar technologies for the following purposes:
            </p>
            
            <div className="space-y-4">
              <div className="p-4 bg-card border border-border rounded-lg">
                <h3 className="font-semibold text-foreground mb-2">Essential Cookies</h3>
                <p className="text-muted-foreground text-sm">
                  These cookies are necessary for the website to function properly. They enable 
                  basic functions like page navigation and access to secure areas. The website 
                  cannot function properly without these cookies.
                </p>
              </div>
              
              <div className="p-4 bg-card border border-border rounded-lg">
                <h3 className="font-semibold text-foreground mb-2">Analytics Cookies</h3>
                <p className="text-muted-foreground text-sm">
                  We use Google Analytics to understand how visitors interact with our website. 
                  These cookies collect information such as pages visited, time spent on pages, 
                  and how you arrived at our site. This data helps us improve our calculators 
                  and user experience.
                </p>
              </div>
              
              <div className="p-4 bg-card border border-border rounded-lg">
                <h3 className="font-semibold text-foreground mb-2">Advertising Cookies</h3>
                <p className="text-muted-foreground text-sm">
                  We use Google AdSense to display advertisements that help fund our free 
                  calculators. These cookies are used to serve ads relevant to you and your 
                  interests. They also limit the number of times you see an ad and help 
                  measure the effectiveness of advertising campaigns.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              3. Third-Party Advertising
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We use Google AdSense to serve advertisements on our website. Google AdSense uses 
              cookies to serve ads based on your prior visits to our website or other websites 
              on the Internet.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Google's use of advertising cookies enables it and its partners to serve ads to 
              you based on your visit to our site and/or other sites on the Internet. You may 
              opt out of personalized advertising by visiting{" "}
              <a 
                href="https://www.google.com/settings/ads" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google Ads Settings
              </a>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              4. Third-Party Analytics
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We use Google Analytics to collect information about how visitors use our website. 
              Google Analytics collects information such as how often users visit the site, 
              what pages they visit, and what other sites they used prior to coming to our site.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We use the information we get from Google Analytics to improve our website and 
              calculators. Google Analytics collects the IP address assigned to you on the 
              date you visit our site, but not your name or other identifying information.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You can opt out of Google Analytics by installing the{" "}
              <a 
                href="https://tools.google.com/dlpage/gaoptout" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google Analytics Opt-out Browser Add-on
              </a>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              5. Managing Cookies
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Most web browsers allow you to control cookies through their settings. You can:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
              <li>View cookies stored on your device</li>
              <li>Delete all or specific cookies</li>
              <li>Block all cookies or cookies from specific websites</li>
              <li>Block third-party cookies</li>
              <li>Accept all cookies</li>
              <li>Be notified when a cookie is set</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Please note that blocking or deleting cookies may impact your experience on our 
              website and you may not be able to access certain features.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              6. Cookie Retention
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Cookie retention periods vary depending on the type of cookie:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
              <li><strong>Session cookies:</strong> Deleted when you close your browser</li>
              <li><strong>Persistent cookies:</strong> Remain for a set period (varies by cookie)</li>
              <li><strong>Google Analytics:</strong> Up to 2 years</li>
              <li><strong>Google AdSense:</strong> Varies; see Google's privacy policy</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              7. Updates to This Policy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Cookie Policy from time to time. Any changes will be posted 
              on this page with an updated "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              8. Contact Us
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about our use of cookies, please contact us at:{" "}
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
