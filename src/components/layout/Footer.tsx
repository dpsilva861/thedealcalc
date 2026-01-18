import { Link } from "react-router-dom";
import { Calculator, Settings, ChevronDown } from "lucide-react";
import { useConsent } from "@/components/cmp";
import { getAllCalculatorsForDisplay } from "@/lib/calculators/registry";
import { useEffect, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export function Footer() {
  const { openPreferences } = useConsent();
  const calculators = getAllCalculatorsForDisplay();
  
  // Mobile collapsible state
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);

  // Dev-only warning if footer doesn't render all calculators
  useEffect(() => {
    if (import.meta.env.DEV) {
      const expectedCount = calculators.length;
      const footerCalcLinks = document.querySelectorAll('[data-footer-calc-link]');
      if (footerCalcLinks.length !== expectedCount) {
        console.warn(
          `[Footer] Calculator count mismatch: rendered ${footerCalcLinks.length}, registry has ${expectedCount}`
        );
      }
    }
  }, [calculators.length]);

  // Split calculators into columns for desktop (2 columns)
  const midpoint = Math.ceil(calculators.length / 2);
  const column1 = calculators.slice(0, midpoint);
  const column2 = calculators.slice(midpoint);

  const renderCalculatorLink = (calc: typeof calculators[0]) => {
    if (calc.status === "available") {
      return (
        <li key={calc.id}>
          <Link 
            to={calc.path} 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-footer-calc-link
          >
            {calc.name}
          </Link>
        </li>
      );
    }
    return (
      <li key={calc.id}>
        <span 
          className="text-sm text-muted-foreground/60 cursor-default"
          data-footer-calc-link
        >
          {calc.name} <span className="text-xs">(Coming Soon)</span>
        </span>
      </li>
    );
  };

  return (
    <footer className="border-t border-border bg-cream-dark">
      <div className="container mx-auto px-4 py-12">
        {/* Desktop Layout */}
        <div className="hidden md:grid gap-8 md:grid-cols-5">
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

          {/* Calculators - Column 1 */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Calculators</h4>
            <ul className="space-y-2">
              {column1.map(renderCalculatorLink)}
            </ul>
          </div>

          {/* Calculators - Column 2 (if needed) */}
          {column2.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground mb-4 invisible">More</h4>
              <ul className="space-y-2">
                {column2.map(renderCalculatorLink)}
              </ul>
            </div>
          )}

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
                <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/blog/tags" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Browse Tags
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

        {/* Mobile Layout - Collapsible Sections */}
        <div className="md:hidden space-y-6">
          {/* Brand */}
          <div>
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

          {/* Calculators - Collapsible */}
          <Collapsible open={isCalcOpen} onOpenChange={setIsCalcOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 border-b border-border">
              <h4 className="font-semibold text-foreground">Calculators</h4>
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                isCalcOpen && "rotate-180"
              )} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <ul className="space-y-3">
                {calculators.map(renderCalculatorLink)}
              </ul>
            </CollapsibleContent>
          </Collapsible>

          {/* Resources - Collapsible */}
          <Collapsible open={isResourcesOpen} onOpenChange={setIsResourcesOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 border-b border-border">
              <h4 className="font-semibold text-foreground">Resources</h4>
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                isResourcesOpen && "rotate-180"
              )} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <ul className="space-y-3">
                <li>
                  <Link to="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/blog/tags" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Browse Tags
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
            </CollapsibleContent>
          </Collapsible>

          {/* Legal - Collapsible */}
          <Collapsible open={isLegalOpen} onOpenChange={setIsLegalOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 border-b border-border">
              <h4 className="font-semibold text-foreground">Legal</h4>
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                isLegalOpen && "rotate-180"
              )} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <ul className="space-y-3">
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
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} TheDealCalc. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={openPreferences}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              aria-label="Change privacy settings"
            >
              <Settings className="w-3 h-3" />
              Privacy Settings
            </button>
            <p className="text-sm text-muted-foreground">
              Your data stays in your browser.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
