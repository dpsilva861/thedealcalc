import { Layout } from "@/components/layout/Layout";
import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <Layout>
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
              DealCalc ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
              explains how we collect, use, disclose, and safeguard your information when you use our 
              real estate underwriting application.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              2. Information We Collect
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Account Information</h3>
                <p className="text-muted-foreground leading-relaxed">
                  When you create an account, we collect your email address for authentication and 
                  communication purposes.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Saved Analyses</h3>
                <p className="text-muted-foreground leading-relaxed">
                  If you choose to save your analyses, we store the property address, inputs, and 
                  calculation results associated with your account.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Aggregate Analytics</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We collect ZIP codes from analyses to understand market trends and improve our service. 
                  This data is aggregated and not personally identifiable.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Usage Data and Cookies</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We automatically collect certain information when you visit our application, including 
                  your IP address, browser type, operating system, referring URLs, and pages viewed. We 
                  use cookies and similar tracking technologies to enhance your experience.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Payment Information</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Payment processing is handled by Stripe. We do not store your credit card information 
                  on our servers. Please refer to Stripe's privacy policy for information about their 
                  data handling practices.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              3. How We Use Your Information
            </h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>To provide and maintain our service</li>
              <li>To process your subscription and payments</li>
              <li>To save and retrieve your analyses (when you choose to save them)</li>
              <li>To analyze market trends using aggregated ZIP code data</li>
              <li>To send you service-related communications</li>
              <li>To improve our application and user experience</li>
              <li>To detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              4. Data Sharing and Disclosure
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We do not sell your personal information. We may share your information only in the 
              following circumstances:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>With service providers who assist in operating our application (e.g., Stripe for payments)</li>
              <li>To comply with legal obligations or respond to lawful requests</li>
              <li>To protect our rights, privacy, safety, or property</li>
              <li>In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              5. Data Security
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational measures to protect your information. 
              However, no method of transmission over the Internet or electronic storage is 100% secure. 
              While we strive to use commercially acceptable means to protect your information, we cannot 
              guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              6. Data Retention
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your account information and saved analyses for as long as your account is active 
              or as needed to provide you services. You may delete your saved analyses at any time. If you 
              wish to delete your account entirely, please contact us.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              7. Your Rights
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Depending on your location, you may have certain rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Access and receive a copy of your data</li>
              <li>Rectify inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict certain processing</li>
              <li>Data portability</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              8. Cookies
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar technologies to maintain your session, remember your preferences, 
              and analyze usage patterns. You can control cookies through your browser settings, though 
              disabling them may affect functionality.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              9. Third-Party Links
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Our application may contain links to third-party websites. We are not responsible for the 
              privacy practices of these external sites. We encourage you to review their privacy policies.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              10. Children's Privacy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Our service is not directed to individuals under 18 years of age. We do not knowingly 
              collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              11. Changes to This Policy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by 
              posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              12. Contact Us
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy or our data practices, please contact us at:{" "}
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
