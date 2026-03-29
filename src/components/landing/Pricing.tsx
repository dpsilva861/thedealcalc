import Link from "next/link";
import { Check, Zap, Clock } from "lucide-react";

const features = [
  "Institutional-grade analysis",
  "DOCX with redline markup",
  "PDF executive summary",
  "Deal score and risk assessment",
  "Negotiation strategy",
  "No subscription required",
];

const comingSoon = [
  {
    name: "Lease Analysis Agent",
    description: "Full commercial lease review with clause-by-clause analysis.",
  },
  {
    name: "CAM Reconciliation Agent",
    description: "Automated CAM charge auditing and reconciliation.",
  },
  {
    name: "Deal Underwriting Agent",
    description: "AI-powered deal analysis with financial modeling.",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-electric tracking-wide uppercase mb-3">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            No monthly fees. No annual contracts. Pay only when you need it.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* LOI Redlining Card - Active */}
          <div className="relative rounded-2xl bg-white/[0.03] border border-electric/20 p-8 overflow-hidden">
            {/* Glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-electric/10 blur-3xl -translate-y-1/2" />

            <div className="relative">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-electric/10 border border-electric/20 mb-6">
                <Zap className="w-3.5 h-3.5 text-electric" />
                <span className="text-xs font-medium text-electric">Available Now</span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-white mb-2">LOI Redlining Agent</h3>

              {/* Price */}
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-white">$2</span>
                <span className="text-sm text-slate-400">per document</span>
              </div>
              <p className="text-sm text-slate-500 mb-6">
                Full analysis included.
              </p>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-electric/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-electric" />
                    </div>
                    <span className="text-sm text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/redline"
                className="block w-full text-center px-6 py-3 bg-electric hover:bg-electric-hover text-white font-semibold rounded-xl transition-all shadow-lg shadow-electric/20 hover:shadow-electric/30"
              >
                Try It Now
              </Link>
            </div>
          </div>

          {/* Coming Soon Cards */}
          {comingSoon.map((tool) => (
            <div
              key={tool.name}
              className="relative rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 flex flex-col"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 self-start">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-medium text-slate-500">Coming Soon</span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-white mb-3">{tool.name}</h3>

              {/* Description */}
              <p className="text-sm text-slate-500 leading-relaxed flex-1">
                {tool.description}
              </p>

              {/* Placeholder */}
              <div className="mt-6 w-full text-center px-6 py-3 bg-white/5 text-slate-500 text-sm font-medium rounded-xl border border-white/[0.06]">
                Coming Soon
              </div>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p className="text-center text-sm text-slate-500 mt-8">
          No subscription. No commitment. Pay per use.
        </p>
      </div>
    </section>
  );
}
