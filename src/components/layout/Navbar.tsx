"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Menu, X } from "lucide-react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Pricing", href: "/pricing" },
    { label: "Blog", href: "/blog" },
    { label: "Glossary", href: "/glossary" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-navy/95 backdrop-blur-md border-b border-white/5 shadow-lg shadow-black/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-electric/10 rounded-lg flex items-center justify-center border border-electric/20 group-hover:border-electric/40 transition-colors">
              <FileText className="w-4 h-4 text-electric" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              CRE<span className="text-electric">agentic</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/auth/signin"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/redline"
              className="inline-flex items-center gap-2 px-4 py-2 bg-electric hover:bg-electric-hover text-white text-sm font-medium rounded-lg transition-colors"
            >
              Upload LOI
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-navy-light/95 backdrop-blur-md border-t border-white/5">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block text-sm text-slate-400 hover:text-white transition-colors py-2"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-white/5 space-y-3">
              <Link
                href="/auth/signin"
                onClick={() => setMobileOpen(false)}
                className="block text-sm text-slate-400 hover:text-white transition-colors py-2"
              >
                Sign In
              </Link>
              <Link
                href="/redline"
                onClick={() => setMobileOpen(false)}
                className="block text-center px-4 py-2.5 bg-electric hover:bg-electric-hover text-white text-sm font-medium rounded-lg transition-colors"
              >
                Upload LOI
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
