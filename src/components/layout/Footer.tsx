import { Link } from "react-router-dom";
import { Calculator } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-cream-dark">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-sage">
                <Calculator className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-semibold text-foreground">
                DealCalc
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-md">
              Professional residential real estate underwriting made simple. 
              100% free. We never store your deal data.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/underwrite" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Underwriting Tool
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
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} DealCalc. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Your deal data is never stored. Privacy first.
          </p>
        </div>
      </div>
    </footer>
  );
}
