import { Metadata } from "next";
import Link from "next/link";
import { Check, Clock, Users, Code2 } from "lucide-react";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";

export const metadata: Metadata = {
  title: "Pricing | CREagentic",
  description:
    "CREagentic costs $2 per LOI. No subscription, no hidden fees. Get institutional-grade CRE LOI redlining in 60 seconds.",
};

const features = [
  "Institutional-grade LOI analysis with severity-rated findings",
  "DOCX with tracked changes and redline markup",
  "PDF executive summary with deal overview",
  "Deal score and risk assessment across all provisions",
  "Negotiation strategy recommendations tailored to your deal",
  "Missing provision detection against 15-point checklist",
  "Self-learning AI that improves with every document processed",
  "Property-type-specific benchmarks and market standards",
];

const faqs = [
  {
    question: "How does billing work?",
    answer:
      "You pay $2 per LOI analysis at the time of submission. Payment is processed securely through Stripe before the analysis begins. There is no subscription, no account minimum, and no recurring charges.",
  },
  {
    question: "Is there a subscription option?",
    answer:
      "Not currently. CREagentic operates on a simple per-document model. Pay only when you need an analysis. Bulk pricing packages are coming soon for teams that process high volumes of LOIs.",
  },
  {
    question: "What payment methods are accepted?",
    answer:
      "We accept all major credit and debit cards (Visa, Mastercard, American Express, Discover) through our payment processor, Stripe. Apple Pay and Google Pay are also supported.",
  },
  {
    question: "Can I get a refund?",
    answer:
      "Because AI processing costs are incurred immediately when you submit an LOI, we cannot offer refunds on completed analyses. If the system encounters a technical error and cannot complete your analysis, you will not be charged.",
  },
  {
    question: "What if the analysis fails or produces an error?",
    answer:
      "If CREagentic is unable to complete your analysis due to a system error, your payment will not be processed. If you believe an analysis was incomplete or inaccurate, contact us at support@creagentic.ai and we will review it promptly.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-navy">
      <SchemaMarkup type="SoftwareApplication" />
      <SchemaMarkup
        type="FAQPage"
        data={{ faqs }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            No subscriptions. No hidden fees. Pay per document, get
            institutional-grade LOI analysis in 60 seconds.
          </p>
        </div>

        {/* Main Pricing Card */}
        <div className="max-w-lg mx-auto mb-20">
          <div className="relative border border-electric/30 rounded-2xl bg-navy-light/50 p-8 text-center">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-electric text-white text-xs font-semibold rounded-full">
              Per Document
            </div>

            <div className="mt-4 mb-2">
              <span className="text-6xl font-bold text-white">$2</span>
              <span className="text-slate-400 ml-2">/ LOI</span>
            </div>
            <p className="text-slate-400 mb-8">
              One price. Everything included.
            </p>

            <ul className="text-left space-y-3 mb-8">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-electric shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/redline"
              className="block w-full py-3 bg-electric hover:bg-electric-hover text-white font-semibold rounded-lg transition-colors text-center"
            >
              Start with One LOI for $2
            </Link>

            <p className="text-xs text-slate-500 mt-4">
              No account required to try. Sign in to save your history.
            </p>
          </div>
        </div>

        {/* Legal note */}
        <p className="text-[11px] text-slate-600 text-center mb-16 -mt-6 max-w-lg mx-auto leading-relaxed">
          CREagentic is not a law firm and does not provide legal advice. All redline analysis and recommendations are automated suggestions based on industry benchmarks. See our{" "}
          <a href="/terms" className="text-electric hover:underline">Terms of Service</a>.
        </p>

        {/* Coming Soon */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Coming Soon
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-white/10 rounded-xl bg-navy-light/30 p-6">
              <div className="w-10 h-10 bg-electric/10 rounded-lg flex items-center justify-center border border-electric/20 mb-4">
                <Clock className="w-5 h-5 text-electric" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Bulk Pricing
              </h3>
              <p className="text-sm text-slate-400 mb-3">
                Volume discounts for high-throughput teams.
              </p>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>10 LOIs for $15 (save 25%)</li>
                <li>50 LOIs for $60 (save 40%)</li>
              </ul>
            </div>

            <div className="border border-white/10 rounded-xl bg-navy-light/30 p-6">
              <div className="w-10 h-10 bg-electric/10 rounded-lg flex items-center justify-center border border-electric/20 mb-4">
                <Users className="w-5 h-5 text-electric" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Team Accounts
              </h3>
              <p className="text-sm text-slate-400">
                Shared dashboards, team history, and centralized billing for
                brokerage firms and property management companies.
              </p>
            </div>

            <div className="border border-white/10 rounded-xl bg-navy-light/30 p-6">
              <div className="w-10 h-10 bg-electric/10 rounded-lg flex items-center justify-center border border-electric/20 mb-4">
                <Code2 className="w-5 h-5 text-electric" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                API Access
              </h3>
              <p className="text-sm text-slate-400">
                Integrate CREagentic directly into your deal management workflow.
                RESTful API with programmatic LOI submission and results
                retrieval.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="border border-white/5 rounded-lg p-6 bg-navy-light/30"
              >
                <h3 className="text-lg font-medium text-white mb-3">
                  {faq.question}
                </h3>
                <p className="text-slate-400 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Redline Your Next LOI?
          </h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            Upload your LOI and get institutional-grade redlines in 60 seconds.
            No subscription required.
          </p>
          <Link
            href="/redline"
            className="inline-flex items-center justify-center px-8 py-3 bg-electric hover:bg-electric-hover text-white font-semibold rounded-lg transition-colors"
          >
            Upload LOI for $2
          </Link>
        </div>
      </div>
    </div>
  );
}
