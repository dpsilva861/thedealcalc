import { Link, useLocation } from "react-router-dom";
import { Calculator, Menu, X, Tag } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { CalculatorSelector } from "@/components/calculators/CalculatorSelector";

export function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  // Close menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent background scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Close menu on ESC key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && mobileMenuOpen) {
      setMobileMenuOpen(false);
      buttonRef.current?.focus();
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Focus trap within mobile menu
  useEffect(() => {
    if (mobileMenuOpen && menuRef.current) {
      const focusableElements = menuRef.current.querySelectorAll<HTMLElement>(
        'a[href], button, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }, [mobileMenuOpen]);

  const toggleMenu = () => setMobileMenuOpen(prev => !prev);

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
          ref={buttonRef}
          className="md:hidden p-2 rounded-lg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          onClick={toggleMenu}
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          ref={menuRef}
          role="navigation"
          aria-label="Mobile navigation"
          className="md:hidden border-t border-border bg-background animate-slide-up fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto"
        >
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {navLinks.map(link => {
              const IconComponent = link.icon;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary",
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
            
            {/* Calculator links directly in mobile menu */}
            <div className="border-t border-border pt-4 mt-2">
              <span className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Calculators
              </span>
              <div className="mt-2 flex flex-col gap-1">
                <Link
                  to="/brrrr"
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary",
                    location.pathname === "/brrrr"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Calculator className="h-4 w-4" />
                  BRRRR Calculator
                </Link>
                <Link
                  to="/underwrite"
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary",
                    location.pathname === "/underwrite"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Calculator className="h-4 w-4" />
                  Underwrite
                </Link>
                <Link
                  to="/syndication"
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary",
                    location.pathname === "/syndication"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Calculator className="h-4 w-4" />
                  Syndication
                </Link>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
