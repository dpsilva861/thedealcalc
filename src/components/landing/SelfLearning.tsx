"use client";

import { Layers, MessageSquareText, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Layers,
    title: "Pattern Recognition",
    description:
      "Discovers common issues across property types, deal structures, and markets. Every LOI strengthens the knowledge base.",
  },
  {
    icon: MessageSquareText,
    title: "Language Refinement",
    description:
      "Continuously improves recommended redline language based on what works. Tracks clause variants across thousands of deals.",
  },
  {
    icon: TrendingUp,
    title: "Market Intelligence",
    description:
      "Identifies regional trends and property-specific negotiation patterns. Surfaces insights no single attorney could track.",
  },
];

export function SelfLearning() {
  return (
    <section id="self-learning" className="relative py-24 sm:py-32">
      {/* Subtle background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-electric/[0.02] to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-electric tracking-wide uppercase mb-3">
            Self-Learning Engine
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            An AI That Gets Smarter Every Day
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
            RedlineIQ learns from every LOI it processes. New patterns, better language, sharper analysis. The more it works, the better it gets.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="card-glow rounded-2xl bg-white/[0.03] border border-white/[0.06] p-8 hover:border-electric/20 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-electric/10 border border-electric/20 flex items-center justify-center mb-5 group-hover:bg-electric/15 transition-colors">
                <feature.icon className="w-6 h-6 text-electric" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Stats Row */}
        <div className="mt-12 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
          {[
            { value: "15", label: "Provision Categories" },
            { value: "10+", label: "Deal Pattern Types" },
            { value: "24/7", label: "Always Learning" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-electric">{stat.value}</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
