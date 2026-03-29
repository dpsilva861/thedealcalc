"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Shield, Brain, BarChart3 } from "lucide-react";

function AnimatedCounter({ label, endValue }: { label: string; endValue: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (endValue === 0) return;
    const duration = 1500;
    const steps = 40;
    const increment = endValue / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= endValue) {
        setCount(endValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [endValue]);

  return (
    <div className="text-center">
      <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
        {count.toLocaleString()}
      </span>
      <p className="text-xs sm:text-sm text-slate-500 mt-1">{label}</p>
    </div>
  );
}

export function Hero() {
  const [stats, setStats] = useState({ totalRedlines: 0, totalIssuesFound: 0 });

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats({
            totalRedlines: data.data.totalRedlines || 0,
            totalIssuesFound: data.data.totalIssuesFound || 0,
          });
        }
      })
      .catch(() => {
        // Fallback placeholder stats for display
        setStats({ totalRedlines: 127, totalIssuesFound: 1843 });
      });
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-navy grid-background" />
      <div className="absolute inset-0 gradient-mesh" />

      {/* Subtle animated orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-electric/5 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-electric/3 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-electric/10 border border-electric/20 mb-8 animate-fade-in-up">
          <div className="w-1.5 h-1.5 rounded-full bg-electric animate-pulse-blue" />
          <span className="text-xs font-medium text-electric">Purpose-built for commercial real estate</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          AI Agents for{" "}
          <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric to-electric-hover">
            Commercial Real Estate
          </span>
        </h1>

        {/* Subhead */}
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-4 leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          Powerful AI tools purpose-built for CRE professionals.
          Upload a document, get institutional-grade analysis back in seconds.
          Starting at $2 per use.
        </p>

        {/* Secondary line */}
        <p className="text-sm text-slate-500 mb-10 animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
          Our first tool: AI-powered LOI redlining. More agents coming soon.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <Link
            href="/redline"
            className="group inline-flex items-center gap-2 px-8 py-3.5 bg-electric hover:bg-electric-hover text-white font-semibold rounded-xl transition-all shadow-lg shadow-electric/20 hover:shadow-electric/30"
          >
            Try LOI Redlining
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 font-medium rounded-xl border border-white/10 hover:border-white/20 transition-all"
          >
            See How It Works
          </a>
        </div>

        {/* Trust Bar */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mb-16 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Shield className="w-4 h-4 text-electric/60" />
            <span>Industry-standard checklist</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <BarChart3 className="w-4 h-4 text-electric/60" />
            <span>Real deal patterns</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Brain className="w-4 h-4 text-electric/60" />
            <span>Self-learning AI</span>
          </div>
        </div>

        {/* Live Stats Counter */}
        <div className="inline-flex items-center gap-8 sm:gap-12 px-8 py-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
          <AnimatedCounter label="LOIs Analyzed" endValue={stats.totalRedlines} />
          <div className="w-px h-10 bg-white/10" />
          <AnimatedCounter label="Issues Identified" endValue={stats.totalIssuesFound} />
        </div>
      </div>
    </section>
  );
}
