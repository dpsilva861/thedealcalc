"use client";

import { Upload, Brain, Download } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload Your Document",
    description:
      "Drop a PDF, DOCX, or paste text. We support any document format from any market.",
  },
  {
    number: "02",
    icon: Brain,
    title: "AI Analyzes Every Detail",
    description:
      "Our engine checks against industry-standard benchmarks, identifies risks, and generates specific recommendations.",
  },
  {
    number: "03",
    icon: Download,
    title: "Download Your Results",
    description:
      "Get a professional DOCX with tracked changes and a PDF executive summary. Ready to send.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-electric tracking-wide uppercase mb-3">
            How It Works
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Three Steps to Institutional-Grade Analysis
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            No learning curve. No complex setup. Upload your document and get actionable results in under a minute.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-electric/20 to-transparent" />

          {steps.map((step, i) => (
            <div key={step.number} className="relative text-center group">
              {/* Number badge */}
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-6 group-hover:border-electric/20 transition-colors relative">
                <step.icon className="w-10 h-10 text-electric" />
                <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-electric/10 border border-electric/20 flex items-center justify-center text-xs font-bold text-electric">
                  {step.number}
                </span>
              </div>

              {/* Arrow connector (mobile) */}
              {i < steps.length - 1 && (
                <div className="md:hidden flex justify-center my-4">
                  <div className="w-px h-8 bg-white/10" />
                </div>
              )}

              <h3 className="text-xl font-semibold text-white mb-3">
                {step.title}
              </h3>
              <p className="text-slate-400 leading-relaxed max-w-sm mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Currently available note */}
        <p className="text-center text-sm text-slate-500 mt-12">
          Currently available: <span className="text-electric">LOI Redlining Agent</span>
        </p>
      </div>
    </section>
  );
}
