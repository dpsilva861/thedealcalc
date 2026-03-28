import Link from "next/link";
import { FileText, Home, BookOpen, Upload } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-navy flex items-center justify-center">
      <div className="max-w-lg mx-auto px-4 text-center">
        <div className="w-16 h-16 bg-electric/10 rounded-2xl flex items-center justify-center border border-electric/20 mx-auto mb-8">
          <FileText className="w-8 h-8 text-electric" />
        </div>

        <h1 className="text-4xl font-bold text-white mb-4">Page Not Found</h1>
        <p className="text-slate-400 mb-10">
          The page you are looking for does not exist or has been moved.
        </p>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3 mb-10">
          <Link
            href="/"
            className="flex items-center gap-2 justify-center px-4 py-3 border border-white/10 rounded-lg text-sm text-slate-400 hover:text-white hover:border-electric/30 transition-colors"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
          <Link
            href="/redline"
            className="flex items-center gap-2 justify-center px-4 py-3 border border-white/10 rounded-lg text-sm text-slate-400 hover:text-white hover:border-electric/30 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload an LOI
          </Link>
          <Link
            href="/blog"
            className="flex items-center gap-2 justify-center px-4 py-3 border border-white/10 rounded-lg text-sm text-slate-400 hover:text-white hover:border-electric/30 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Blog
          </Link>
          <Link
            href="/glossary"
            className="flex items-center gap-2 justify-center px-4 py-3 border border-white/10 rounded-lg text-sm text-slate-400 hover:text-white hover:border-electric/30 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Glossary
          </Link>
        </div>

        {/* CTA */}
        <Link
          href="/redline"
          className="inline-flex items-center justify-center px-8 py-3 bg-electric hover:bg-electric-hover text-white font-semibold rounded-lg transition-colors"
        >
          Redline an LOI for $2
        </Link>
      </div>
    </div>
  );
}
