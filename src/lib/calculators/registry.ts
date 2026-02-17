// Calculator Registry
// Central registry of all calculators (available + coming soon)

import { CalculatorMetadata } from "./types";

// Single source of truth for all calculators
export const CALCULATORS: CalculatorMetadata[] = [
  {
    id: "residential",
    name: "Residential Underwriting",
    shortDescription: "Single-family & small multifamily analysis",
    description:
      "Full underwriting calculator for single-family and small multifamily properties with 30-year projections, sensitivity analysis, and professional exports.",
    icon: "Home",
    tier: "basic",
    status: "available",
    path: "/underwrite",
  },
  {
    id: "brrrr",
    name: "BRRRR Calculator",
    shortDescription: "Buy, Rehab, Rent, Refinance, Repeat",
    description:
      "Complete BRRRR analysis with cash-out calculations, risk flags, sensitivity tables, and deal snapshots for the BRRRR investment strategy.",
    icon: "RefreshCcw",
    tier: "basic",
    status: "available",
    path: "/brrrr",
  },
  {
    id: "syndication",
    name: "Syndication Analyzer",
    shortDescription: "LP/GP waterfall structures",
    description:
      "Model complex syndication structures with preferred returns, promote calculations, investor distributions, and full waterfall audit trails.",
    icon: "Users",
    tier: "basic",
    status: "available",
    path: "/syndication",
  },
  {
    id: "npv",
    name: "NPV Calculator",
    shortDescription: "Net Present Value analysis",
    description:
      "Calculate Net Present Value with support for multiple period frequencies, beginning/end timing conventions, and custom or recurring cash flows.",
    icon: "Calculator",
    tier: "basic",
    status: "available",
    path: "/npv-calculator",
  },
  {
    id: "lease-redline",
    name: "Lease Redlining Agent",
    shortDescription: "AI-powered landlord lease review",
    description:
      "AI-powered commercial lease and LOI redlining from the landlord perspective. Covers rent, TI, CAM, use clauses, exclusives, co-tenancy, and more with institutional-grade analysis.",
    icon: "Scale",
    tier: "pro",
    status: "available",
    path: "/lease-redline",
  },
  {
    id: "commercial",
    name: "Commercial Underwriting",
    shortDescription: "Office, retail, and industrial properties",
    description:
      "Analyze commercial properties including office, retail, and industrial with NNN lease structures and cap rate analysis.",
    icon: "Building2",
    tier: "pro",
    status: "coming_soon",
    path: "/pricing",
  },
  {
    id: "multifamily-large",
    name: "Large Multifamily",
    shortDescription: "50+ unit apartment buildings",
    description:
      "Underwrite large apartment complexes with unit mix analysis, expense ratios, and institutional-grade reporting.",
    icon: "Building",
    tier: "pro",
    status: "coming_soon",
    path: "/pricing",
  },
];

// All available calculators (user-facing)
export const CALCULATOR_REGISTRY: CalculatorMetadata[] = CALCULATORS.filter(
  (c) => c.status === "available"
);

// Coming soon calculators for display purposes
export const COMING_SOON_CALCULATORS: Omit<CalculatorMetadata, "path" | "status">[] =
  CALCULATORS.filter((c) => c.status === "coming_soon").map(({ path, status, ...rest }) => rest);

/**
 * Get all public (available) calculators sorted by name
 * Used for navigation menus, footers, etc.
 */
export const getPublicCalculators = (): CalculatorMetadata[] => {
  return CALCULATOR_REGISTRY.filter((calc) => calc.status === "available")
    .sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Get all calculators including coming soon, for footer display
 */
export const getAllCalculatorsForDisplay = (): CalculatorMetadata[] => {
  return CALCULATORS.sort((a, b) => {
    // Available calculators first, then coming soon
    if (a.status === "available" && b.status !== "available") return -1;
    if (a.status !== "available" && b.status === "available") return 1;
    return a.name.localeCompare(b.name);
  });
};

export const getCalculatorById = (id: string): CalculatorMetadata | undefined => {
  return CALCULATOR_REGISTRY.find((calc) => calc.id === id);
};

export const getAvailableCalculators = (): CalculatorMetadata[] => {
  return CALCULATOR_REGISTRY.filter((calc) => calc.status === "available");
};

export const getCalculatorsForTier = (tier: "free" | "basic" | "pro"): CalculatorMetadata[] => {
  const available = getAvailableCalculators();
  
  if (tier === "pro") {
    return available;
  }
  
  if (tier === "basic") {
    return available.filter((calc) => calc.tier === "basic");
  }
  
  // Free tier - return first calculator only
  return available.slice(0, 1);
};
