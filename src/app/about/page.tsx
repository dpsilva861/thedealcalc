import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About | CREagentic",
  description:
    "CREagentic is building the AI operating system for commercial real estate. Learn about our platform and self-learning AI engine.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-navy">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h1 className="text-4xl font-bold text-white mb-8">About CREagentic</h1>

        <div className="space-y-12 text-slate-300 leading-relaxed">
          {/* Platform Vision */}
          <section>
            <p className="text-lg text-slate-300">
              CREagentic is building the AI operating system for commercial real
              estate. We are creating a suite of intelligent agents that handle
              the most time-consuming tasks in CRE, from LOI redlining to lease
              analysis to deal underwriting. Each agent is purpose-built for a
              specific workflow, learns from every document it processes, and
              gets smarter over time.
            </p>
            <p className="mt-4">
              Our first tool, the LOI Redlining Agent, analyzes Letters of
              Intent against industry-standard benchmarks in 60 seconds. More
              agents are on the way: lease analysis, CAM reconciliation, and
              deal underwriting.
            </p>
          </section>

          {/* Mission */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Our Mission
            </h2>
            <p>
              We are building the standard AI platform for commercial real
              estate. Our goal is to democratize institutional-grade analysis so
              that every landlord, broker, and tenant representative has access
              to thorough, consistent, and affordable tools regardless of
              deal size or budget.
            </p>
            <p className="mt-4">
              Starting at $2 per document, there is no longer a reason to skip
              thorough review. Whether you are a solo broker handling 5 deals a
              month or a property management firm processing 100, CREagentic
              delivers the same institutional-grade analysis on every document.
            </p>
          </section>

          {/* Self-Learning */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              The Self-Learning Engine
            </h2>
            <p>
              Every document we analyze makes CREagentic better. Our AI
              continuously learns from real deal patterns, user feedback, and
              market trends. When users accept, reject, or modify our
              recommendations, those signals feed into a nightly aggregation
              engine that identifies which provisions matter most, which
              benchmarks need updating, and where our analysis can improve.
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
              What CREagentic is Not
            </h2>
            <p>
              We are not a law firm. We do not provide legal advice. We do not
              represent landlords, tenants, or brokers in any transaction.
              CREagentic is a technology platform that helps CRE professionals
              work faster and catch issues they might otherwise miss.
            </p>
            <p className="mt-4">
              Every suggestion, deal score, and recommendation should be
              reviewed by qualified legal and real estate professionals before
              implementation. CREagentic gives you a faster, more consistent
              starting point. The final decisions are yours.
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
                href="mailto:hello@creagentic.ai"
                className="text-electric hover:text-electric-hover underline"
              >
                hello@creagentic.ai
              </a>
            </p>
          </section>

          {/* CTA */}
          <div className="pt-4">
            <Link
              href="/redline"
              className="inline-flex items-center justify-center px-8 py-3 bg-electric hover:bg-electric-hover text-white font-semibold rounded-lg transition-colors"
            >
              Try CREagentic for $2
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
