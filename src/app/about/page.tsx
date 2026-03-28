import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About | RedlineIQ",
  description:
    "RedlineIQ brings institutional-grade LOI analysis to every CRE professional. Learn about our mission and self-learning AI engine.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-navy">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h1 className="text-4xl font-bold text-white mb-8">About RedlineIQ</h1>

        <div className="space-y-12 text-slate-300 leading-relaxed">
          {/* The Problem */}
          <section>
            <p className="text-lg text-slate-300">
              RedlineIQ was built to solve a simple problem: LOI review in
              commercial real estate takes too long, costs too much, and often
              misses critical issues.
            </p>
            <p className="mt-4">
              A typical LOI review costs $500 to $2,000 and takes 2 to 5
              business days. For large institutional deals, that investment makes
              sense. But for the thousands of mid-market LOIs negotiated every
              week, the cost of professional review often exceeds what deal teams
              are willing to spend. The result: LOIs go unreviewed, provisions
              get missed, and landlords and tenants leave money on the table.
            </p>
          </section>

          {/* Mission */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Our Mission
            </h2>
            <p>
              We are building the standard tool for commercial real estate LOI
              analysis. Our goal is to democratize institutional-grade review so
              that every landlord, broker, and tenant representative has access
              to thorough, consistent, and affordable LOI analysis regardless of
              deal size or budget.
            </p>
            <p className="mt-4">
              At $2 per document, there is no longer a reason to send back an
              LOI without reviewing every provision against market standards.
              Whether you are a solo broker handling 5 deals a month or a
              property management firm processing 100, RedlineIQ delivers the
              same institutional-grade analysis on every document.
            </p>
          </section>

          {/* Self-Learning */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              The Self-Learning Engine
            </h2>
            <p>
              Every LOI we analyze makes RedlineIQ better. Our AI continuously
              learns from real deal patterns, user feedback, and market trends.
              When users accept, reject, or modify our recommendations, those
              signals feed into a nightly aggregation engine that identifies
              which provisions matter most, which benchmarks need updating, and
              where our analysis can improve.
            </p>
            <p className="mt-4">
              The result is an engine that gets measurably smarter over time. The
              analysis you receive today is better than last month, and next
              month will be better still. This is not a static tool with fixed
              rules. It is a system that evolves with the market.
            </p>
          </section>

          {/* What We Are Not */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              What RedlineIQ is Not
            </h2>
            <p>
              We are not a law firm. We do not provide legal advice. We do not
              represent landlords, tenants, or brokers in any transaction.
              RedlineIQ is a technology tool that helps CRE professionals work
              faster and catch issues they might otherwise miss.
            </p>
            <p className="mt-4">
              Every redline suggestion, deal score, and negotiation
              recommendation should be reviewed by qualified legal and real
              estate professionals before implementation. RedlineIQ gives you a
              faster, more consistent starting point. The final decisions are
              yours.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Contact Us
            </h2>
            <p>
              Questions, feedback, or partnership inquiries:{" "}
              <a
                href="mailto:hello@redlineiq.com"
                className="text-electric hover:text-electric-hover underline"
              >
                hello@redlineiq.com
              </a>
            </p>
          </section>

          {/* CTA */}
          <div className="pt-4">
            <Link
              href="/redline"
              className="inline-flex items-center justify-center px-8 py-3 bg-electric hover:bg-electric-hover text-white font-semibold rounded-lg transition-colors"
            >
              Try RedlineIQ for $2
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
