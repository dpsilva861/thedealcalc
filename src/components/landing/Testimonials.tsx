import { Quote } from "lucide-react";

const testimonials = [
  {
    role: "CRE Asset Manager",
    company: "National REIT",
    quote:
      "We process dozens of LOIs every month. Having an AI that catches the provisions we might rush past has been a real advantage in negotiations.",
  },
  {
    role: "Commercial Broker",
    company: "Boutique Brokerage",
    quote:
      "I used to spend hours reviewing LOIs or pay outside counsel for a first pass. Now I get a thorough analysis in a minute for two dollars. The ROI is not even close.",
  },
  {
    role: "Leasing Director",
    company: "Regional Developer",
    quote:
      "The deal scoring feature alone is worth it. Being able to quickly compare how different LOIs stack up against market benchmarks saves our team significant time.",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="relative py-24 sm:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-electric/[0.02] to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-electric tracking-wide uppercase mb-3">
            Testimonials
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Trusted by CRE Professionals
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            See how teams across commercial real estate use RedlineIQ to streamline their LOI review process.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((t) => (
            <div
              key={t.role}
              className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-8 hover:border-white/[0.1] transition-colors"
            >
              <Quote className="w-8 h-8 text-electric/30 mb-4" />
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-electric/10 border border-electric/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-electric">
                    {t.role
                      .split(" ")
                      .map((w) => w[0])
                      .join("")}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{t.role}</p>
                  <p className="text-xs text-slate-500">{t.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
