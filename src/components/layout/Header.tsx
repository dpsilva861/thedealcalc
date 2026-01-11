import { Link, useLocation } from "react-router-dom";
import { Calculator, Menu, X, Tag } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CalculatorSelector } from "@/components/calculators/CalculatorSelector";

export function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/blog", label: "Blog" },
    { href: "/blog/tags", label: "Tags", icon: Tag },
  ];

  // Check if active - for blog routes, highlight both Blog and Tags appropriately
  const isActive = (path: string) => {
    if (path === "/blog/tags") {
      return location.pathname === "/blog/tags" || location.pathname.startsWith("/blog/tag/");
    }
    if (path === "/blog") {
      // Don't highlight Blog link if we're on tags pages
      if (location.pathname === "/blog/tags" || location.pathname.startsWith("/blog/tag/")) {
        return false;
      }
      return location.pathname.startsWith("/blog");
    }
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Calculator className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-semibold text-foreground">TheDealCalc</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => {
            const IconComponent = link.icon;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                  isActive(link.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {IconComponent && <IconComponent className="h-3.5 w-3.5" />}
                {link.label}
              </Link>
            );
          })}
          <CalculatorSelector />
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-muted"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background animate-slide-up">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {navLinks.map(link => {
              const IconComponent = link.icon;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                    isActive(link.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {IconComponent && <IconComponent className="h-4 w-4" />}
                  {link.label}
                </Link>
              );
            })}
            <div className="px-4 py-2">
              <CalculatorSelector />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
