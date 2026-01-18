/**
 * Breadcrumb Schema Generator
 * 
 * Generates JSON-LD BreadcrumbList schema for SEO.
 */

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  const baseUrl = "https://thedealcalc.com";
  
  return {
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `${baseUrl}${item.path}`
    }))
  };
}

/**
 * Common breadcrumb paths for reuse
 */
export const BREADCRUMBS = {
  home: { name: "Home", path: "/" },
  calculators: { name: "Calculators", path: "/calculators" },
  brrrr: { name: "BRRRR Calculator", path: "/brrrr-calculator" },
  syndication: { name: "Syndication Calculator", path: "/syndication-calculator" },
  rental: { name: "Rental Property Calculator", path: "/rental-property-calculator" },
  capRate: { name: "Cap Rate Calculator", path: "/cap-rate-calculator" },
  cashOnCash: { name: "Cash on Cash Calculator", path: "/cash-on-cash-calculator" },
  fixAndFlip: { name: "Fix and Flip Calculator", path: "/fix-and-flip-calculator" },
  realEstateInvestment: { name: "Investment Calculator", path: "/real-estate-investment-calculator" },
  npv: { name: "NPV Calculator", path: "/npv-calculator" },
  howItWorks: { name: "How It Works", path: "/how-it-works" },
  about: { name: "About", path: "/about" },
  contact: { name: "Contact", path: "/contact" },
  privacy: { name: "Privacy Policy", path: "/privacy" },
  terms: { name: "Terms of Service", path: "/terms" },
  cookies: { name: "Cookie Policy", path: "/cookies" },
  disclaimer: { name: "Disclaimer", path: "/disclaimer" },
} as const;
