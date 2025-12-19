import { Layout } from "@/components/layout/Layout";
import { FileText } from "lucide-react";

export default function TermsOfService() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Terms of Service
          </h1>
        </div>
        
        <p className="text-muted-foreground mb-8">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" , year: "numeric" })}
        </p>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using DealCalc ("the Service"), you agree to be bound by these Terms of 
              Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              2. Description of Service
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              DealCalc is a real estate underwriting calculator that provides tools for analyzing 
              residential investment properties. The Service includes financial calculations, report 
              generation, and analysis storage features.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              3. User Accounts
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p className="leading-relaxed">
                To access certain features, you must create an account. You are responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Providing accurate and complete information</li>
                <li>Notifying us immediately of any unauthorized access</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              4. Subscription and Payment
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p className="leading-relaxed">
                DealCalc offers a subscription service at $3 per month for unlimited analyses. By 
                subscribing, you agree to the following:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Subscriptions are billed monthly on a recurring basis</li>
                <li>You authorize us to charge your payment method automatically</li>
                <li>Prices may change with 30 days notice</li>
                <li>Refunds are provided at our sole discretion</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              5. Free Trial
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              New users receive one free analysis upon signup. This free trial is limited to one analysis 
              per user and is intended to allow evaluation of the Service before subscribing.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              6. Cancellation
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              You may cancel your subscription at any time through your account settings or by contacting 
              us. Upon cancellation, you will retain access to the Service until the end of your current 
              billing period. No partial refunds are provided for unused portions of a billing period.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              7. Acceptable Use
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p className="leading-relaxed">You agree not to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Use the Service for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Resell or redistribute the Service without authorization</li>
                <li>Use automated means to access the Service without permission</li>
                <li>Upload malicious code or content</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              8. Disclaimer of Warranties
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER 
              EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, 
              OR SECURE. THE CALCULATIONS AND ANALYSES PROVIDED ARE FOR INFORMATIONAL PURPOSES ONLY AND 
              SHOULD NOT BE RELIED UPON AS THE SOLE BASIS FOR INVESTMENT DECISIONS.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              9. Limitation of Liability
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, DEALCALC SHALL NOT BE LIABLE FOR ANY INDIRECT, 
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS 
              OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE. 
              OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING 
              THE CLAIM.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              10. Investment Disclaimer
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              DealCalc is a calculation tool and does not provide investment, financial, legal, or tax 
              advice. The analyses and projections generated by the Service are estimates based on the 
              information you provide and various assumptions. Actual results may vary significantly. 
              Always consult with qualified professionals before making investment decisions.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              11. Intellectual Property
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service, including its content, features, and functionality, is owned by DealCalc and 
              is protected by copyright, trademark, and other intellectual property laws. You may not 
              copy, modify, distribute, or create derivative works based on the Service without our 
              express written permission.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              12. Indemnification
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify, defend, and hold harmless DealCalc and its officers, directors, 
              employees, and agents from any claims, damages, losses, or expenses arising out of your 
              use of the Service or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              13. Modifications to Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify you of material 
              changes by posting the updated Terms on the Service and updating the "Last updated" date. 
              Your continued use of the Service after such changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              14. Termination
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may terminate or suspend your account and access to the Service at our sole discretion, 
              without prior notice, for conduct that we believe violates these Terms or is harmful to 
              other users, us, or third parties.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              15. Governing Law
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the United 
              States, without regard to its conflict of law provisions. Any disputes arising from these 
              Terms or the Service shall be resolved in the courts of the United States.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              16. Severability
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              If any provision of these Terms is found to be unenforceable, the remaining provisions 
              will continue in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              17. Contact Us
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about these Terms of Service, please contact us at:{" "}
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
