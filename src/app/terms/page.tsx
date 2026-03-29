import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | CREagentic",
  description:
    "Terms and conditions for using CREagentic. Includes service description, payment terms, and legal disclaimers.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-navy">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h1 className="text-4xl font-bold text-white mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-slate-500 mb-12">
          Effective Date: March 28, 2026
        </p>

        <div className="space-y-10 text-slate-300 leading-relaxed">
          {/* LEGAL DISCLAIMER - Prominent */}
          <section className="border-2 border-yellow-500/40 bg-yellow-500/5 rounded-xl p-6">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">
              Important Legal Disclaimer
            </h2>
            <p className="text-white font-medium leading-relaxed">
              CREagentic provides automated analysis and recommendations based on
              industry-standard commercial real estate practices. It is NOT legal
              advice. CREagentic is not a law firm and does not provide legal
              representation. All redline suggestions, deal scores, and
              negotiation recommendations should be reviewed by qualified legal
              and real estate professionals before implementation. Users are
              solely responsible for their decisions regarding any LOI or lease
              transaction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              1. Service Description
            </h2>
            <p>
              CREagentic is an AI-powered LOI analysis tool designed for
              commercial real estate professionals. The service accepts uploaded
              Letter of Intent documents (DOCX, PDF, or pasted text), analyzes
              each provision against commercial real estate benchmarks and market
              standards, and returns redline recommendations, a deal score, risk
              assessments, and negotiation strategy suggestions. The service is
              accessed through the CREagentic website and does not require a
              subscription.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              2. Acceptance of Terms
            </h2>
            <p>
              By using CREagentic, you agree to these Terms of Service. If you do
              not agree, do not use the service. We reserve the right to update
              these terms at any time. Continued use of CREagentic after changes
              are posted constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              3. Acceptable Use
            </h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc list-outside ml-6 space-y-2">
              <li>
                Upload any content that is illegal, fraudulent, or violates the
                rights of any third party
              </li>
              <li>
                Attempt to reverse-engineer, decompile, or extract the
                underlying AI models, algorithms, or training data
              </li>
              <li>
                Use automated tools, bots, or scrapers to access the service or
                extract data from it
              </li>
              <li>
                Circumvent rate limits, authentication mechanisms, or payment
                requirements
              </li>
              <li>
                Resell, sublicense, or redistribute CREagentic analysis results
                as a competing service
              </li>
              <li>
                Upload documents containing malicious code, viruses, or any
                content designed to disrupt the service
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              4. Payment Terms
            </h2>
            <p className="mb-4">
              CREagentic charges $2 per LOI analysis. Payment is collected at the
              time of submission through Stripe before the analysis begins.
            </p>
            <p className="mb-4">
              Analyses are non-refundable once delivered because the AI
              processing cost is incurred immediately upon submission. If the
              system fails to complete an analysis due to a technical error, no
              charge will be applied.
            </p>
            <p>
              Pricing may change with notice. Any price changes will apply only
              to future analyses, not to analyses already submitted.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              5. Account Responsibilities
            </h2>
            <p>
              If you create an account, you are responsible for maintaining the
              security of your login credentials. You are responsible for all
              activity that occurs under your account. If you believe your
              account has been compromised, contact us immediately at{" "}
              <a
                href="mailto:support@creagentic.ai"
                className="text-electric hover:text-electric-hover underline"
              >
                support@creagentic.ai
              </a>
              . CREagentic is not liable for any loss resulting from unauthorized
              access to your account due to your failure to protect your
              credentials.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              6. Intellectual Property
            </h2>
            <p className="mb-4">
              <strong className="text-white">Your content:</strong> You retain
              full ownership of all documents you upload and all analysis results
              generated from your documents. CREagentic does not claim any
              ownership rights over your uploaded content or your analysis
              results.
            </p>
            <p>
              <strong className="text-white">Our platform:</strong> CREagentic
              retains all rights to the platform, software, AI models, user
              interface, and any learned patterns derived from anonymized and
              aggregated usage data. The learned patterns are statistical
              insights about commercial real estate provisions and do not contain
              any individual user&apos;s document content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              7. Limitation of Liability
            </h2>
            <p className="mb-4">
              CREagentic is provided &quot;as is&quot; without warranties of any
              kind, express or implied, including but not limited to warranties
              of merchantability, fitness for a particular purpose, or
              non-infringement.
            </p>
            <p className="mb-4">
              CREagentic&apos;s total liability for any claim arising from or
              related to the service is limited to the amount you paid for the
              specific analysis that is the subject of the claim.
            </p>
            <p>
              In no event shall CREagentic be liable for any indirect, incidental,
              special, consequential, or punitive damages, including but not
              limited to loss of profits, loss of data, or loss of business
              opportunities, regardless of whether we were advised of the
              possibility of such damages.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              8. Indemnification
            </h2>
            <p>
              You agree to indemnify, defend, and hold harmless CREagentic, its
              officers, directors, employees, and agents from and against any
              claims, liabilities, damages, losses, or expenses (including
              reasonable legal fees) arising from: (a) your use of the service,
              (b) your violation of these terms, (c) your reliance on the
              analysis results without independent professional review, or (d)
              any LOI or lease transaction you enter into based in whole or in
              part on CREagentic analysis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              9. Termination
            </h2>
            <p className="mb-4">
              Either party may terminate this relationship at any time. You may
              stop using the service at any time without notice. CREagentic
              reserves the right to suspend or terminate your access if you
              violate these terms.
            </p>
            <p>
              Upon termination, your right to use the service ceases
              immediately. Any analyses already completed and paid for remain
              available for download according to our standard 30-day retention
              policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              10. Governing Law
            </h2>
            <p>
              These terms are governed by and construed in accordance with the
              laws of the State of Delaware, without regard to its conflict of
              law principles. Any disputes arising from these terms or your use
              of CREagentic shall be resolved in the state or federal courts
              located in Delaware.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              11. Contact
            </h2>
            <p>
              For questions about these Terms of Service, contact us at{" "}
              <a
                href="mailto:legal@creagentic.ai"
                className="text-electric hover:text-electric-hover underline"
              >
                legal@creagentic.ai
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
