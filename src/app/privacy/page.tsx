import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | CREagentic",
  description:
    "How CREagentic collects, uses, and protects your data. Learn about document processing, retention, and your privacy rights.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-navy">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-12">
          Effective Date: March 28, 2026
        </p>

        <div className="space-y-10 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              1. Information We Collect
            </h2>
            <p className="mb-4">
              When you use CREagentic, we collect the following information:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-2">
              <li>
                <strong className="text-white">Account information:</strong>{" "}
                Your email address, name, and company name when you create an
                account or sign in through an authentication provider.
              </li>
              <li>
                <strong className="text-white">Uploaded documents:</strong>{" "}
                The LOI files (DOCX, PDF) or pasted text you submit for
                analysis.
              </li>
              <li>
                <strong className="text-white">Usage analytics:</strong>{" "}
                Pages visited, features used, time on page, and interaction
                patterns to help us improve the product.
              </li>
              <li>
                <strong className="text-white">Payment information:</strong>{" "}
                Payment details are collected and processed by Stripe. See
                Section 5 below.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              2. How Documents Are Processed
            </h2>
            <p className="mb-4">
              When you upload an LOI for analysis, the following process occurs:
            </p>
            <ol className="list-decimal list-outside ml-6 space-y-2">
              <li>
                Text is extracted from your uploaded DOCX or PDF file.
              </li>
              <li>
                The extracted text is sent to an AI model for analysis. The AI
                evaluates each provision against commercial real estate
                benchmarks and generates redline recommendations.
              </li>
              <li>
                The original uploaded file is deleted from our servers after
                processing is complete.
              </li>
              <li>
                The analysis results (redline findings, deal score, and
                recommendations) are stored so you can access them.
              </li>
            </ol>
            <p className="mt-4">
              We do not use your uploaded documents to train our AI models. The
              self-learning system uses only anonymized, aggregated patterns from
              feedback data, never raw document content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              3. Document Retention
            </h2>
            <p>
              Analysis results are stored for 30 days so you can re-download
              your redlined DOCX and PDF summary. After 30 days, results are
              automatically deleted. You may request earlier deletion at any time
              by contacting us at{" "}
              <a
                href="mailto:privacy@creagentic.ai"
                className="text-electric hover:text-electric-hover underline"
              >
                privacy@creagentic.ai
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              4. How We Use Your Information
            </h2>
            <ul className="list-disc list-outside ml-6 space-y-2">
              <li>To provide and improve the LOI analysis service</li>
              <li>To process payments and maintain your account</li>
              <li>
                To generate anonymized, aggregated insights that improve our
                analysis benchmarks (no individual document content is used)
              </li>
              <li>To send transactional emails related to your analyses</li>
              <li>To monitor and improve platform performance and reliability</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              5. Payment Processing
            </h2>
            <p>
              All payments are processed by Stripe. CREagentic never sees, stores,
              or has access to your full credit card number, CVV, or other
              sensitive payment details. Stripe is PCI DSS Level 1 certified,
              the highest level of payment security certification. For more
              information, see{" "}
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-electric hover:text-electric-hover underline"
              >
                Stripe&apos;s Privacy Policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              6. Analytics
            </h2>
            <p className="mb-4">
              We use the following analytics tools to understand how users
              interact with CREagentic:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-2">
              <li>
                <strong className="text-white">Google Analytics:</strong>{" "}
                Tracks usage patterns including pages visited, session duration,
                and feature engagement. Google Analytics uses cookies to collect
                this data.
              </li>
              <li>
                <strong className="text-white">Vercel Analytics:</strong>{" "}
                Monitors application performance, page load times, and
                infrastructure metrics.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              7. Cookies
            </h2>
            <p>
              CREagentic uses the following cookies:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-2 mt-4">
              <li>
                <strong className="text-white">Session cookies:</strong>{" "}
                Required for authentication. These cookies keep you signed in
                and expire when you close your browser or after a set period.
              </li>
              <li>
                <strong className="text-white">Analytics cookies:</strong>{" "}
                Used by Google Analytics to distinguish users and throttle
                request rates. These cookies persist for up to 2 years.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              8. Data Sharing
            </h2>
            <p>
              We do not sell, rent, or share your personal data or uploaded
              documents with third parties. Ever. We share data only with service
              providers necessary to operate CREagentic (Stripe for payments,
              cloud infrastructure for hosting), and only to the extent required
              for those services to function.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              9. Data Security
            </h2>
            <p>
              All data transmitted between your browser and CREagentic is
              encrypted in transit using HTTPS (TLS 1.2 or higher). Data stored
              on our servers is encrypted at rest. We implement industry-standard
              security measures including access controls, monitoring, and
              regular security reviews to protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              10. Your Rights
            </h2>
            <p>
              You have the right to request deletion of your account and all
              associated data at any time. To exercise this right, email{" "}
              <a
                href="mailto:privacy@creagentic.ai"
                className="text-electric hover:text-electric-hover underline"
              >
                privacy@creagentic.ai
              </a>{" "}
              with the subject line &quot;Data Deletion Request.&quot; We will
              process your request within 30 days and confirm deletion by email.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              11. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. If we make
              material changes, we will notify you by email or by posting a
              notice on the site. Your continued use of CREagentic after any
              changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              12. Contact
            </h2>
            <p>
              For questions about this Privacy Policy or your data, contact us at{" "}
              <a
                href="mailto:privacy@creagentic.ai"
                className="text-electric hover:text-electric-hover underline"
              >
                privacy@creagentic.ai
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
