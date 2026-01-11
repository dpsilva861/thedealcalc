import { Link, useLocation } from "react-router-dom";
import { Calculator, Menu, Tag } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CalculatorSelector } from "@/components/calculators/CalculatorSelector";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/blog", label: "Blog" },
    { href: "/blog/tags", label: "Tags", icon: Tag },
  ];

  const calculatorLinks = [
    { href: "/brrrr", label: "BRRRR Calculator" },
    { href: "/underwrite", label: "Underwrite" },
    { href: "/syndication", label: "Syndication" },
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

  const isCalculatorActive = (path: string) => location.pathname === path;

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
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

        {/* Mobile Menu using Sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-left">Navigation</SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-2">
              {navLinks.map(link => {
                const IconComponent = link.icon;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={handleLinkClick}
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
              
              {/* Calculator links directly in mobile menu */}
              <div className="border-t border-border pt-4 mt-2">
                <span className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Calculators
                </span>
                <div className="mt-2 flex flex-col gap-1">
                  {calculatorLinks.map(link => (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={handleLinkClick}
                      className={cn(
                        "px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                        isCalculatorActive(link.href)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <Calculator className="h-4 w-4" />
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
