import Link from "next/link";
import { FileText } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Features", href: "#self-learning" },
    { label: "Upload LOI", href: "/redline" },
  ],
  Resources: [
    { label: "Blog", href: "/blog" },
    { label: "CRE Glossary", href: "/glossary" },
    { label: "FAQ", href: "#faq" },
    { label: "LOI Guide", href: "/blog/what-is-a-letter-of-intent" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-navy border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-electric/10 rounded-lg flex items-center justify-center border border-electric/20">
                <FileText className="w-4 h-4 text-electric" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Redline<span className="text-electric">IQ</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed">
              AI-powered LOI redlining built for commercial real estate professionals.
            </p>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-white mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            &copy; {new Date().getFullYear()} RedlineIQ. All rights reserved.
          </p>
          <p className="text-sm text-slate-600">
            RedlineIQ: AI-Powered CRE LOI Analysis
          </p>
        </div>
      </div>
    </footer>
  );
}
