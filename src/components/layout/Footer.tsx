import { Link } from "react-router-dom";
import { Calculator } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-cream-dark">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-sage">
                <Calculator className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-semibold text-foreground">
                TheDealCalc
              </span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Free real estate investment calculators. 
              100% free, no signup required.
            </p>
          </div>

          {/* Calculators */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Calculators</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/underwrite" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Residential Underwriting
                </Link>
              </li>
              <li>
                <Link to="/brrrr" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  BRRRR Calculator
                </Link>
              </li>
              <li>
                <Link to="/syndication" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Syndication Analyzer
                </Link>
              </li>
              <li>
                <span className="text-sm text-muted-foreground/60 cursor-default">
                  Commercial Underwriting (Coming Soon)
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground/60 cursor-default">
                  Large Multifamily (Coming Soon)
                </span>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link to="/ad-tech-providers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Ad Technology Providers
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} TheDealCalc. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Your data stays in your browser. We never store your deal calculations.
          </p>
        </div>
      </div>
    </footer>
  );
}
