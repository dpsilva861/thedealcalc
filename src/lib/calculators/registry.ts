// Calculator Registry
// Central registry of all available calculators

import { CalculatorMetadata } from "./types";

export const CALCULATOR_REGISTRY: CalculatorMetadata[] = [
  {
    id: "residential",
    name: "Residential Underwriting",
    shortDescription: "Single-family & small multifamily analysis",
    description: "Full underwriting calculator for single-family and small multifamily properties with 30-year projections, sensitivity analysis, and professional exports.",
    icon: "Home",
    tier: "basic",
    status: "available",
    path: "/underwrite",
  },
  {
    id: "brrrr",
    name: "BRRRR Calculator",
    shortDescription: "Buy, Rehab, Rent, Refinance, Repeat",
    description: "Complete BRRRR analysis with cash-out calculations, risk flags, sensitivity tables, and deal snapshots for the BRRRR investment strategy.",
    icon: "RefreshCcw",
    tier: "basic",
    status: "available",
    path: "/brrrr",
  },
];

export const COMING_SOON_CALCULATORS: Omit<CalculatorMetadata, "path" | "status">[] = [
  {
    id: "commercial",
    name: "Commercial Underwriting",
    shortDescription: "Office, retail, and industrial properties",
    description: "Analyze commercial properties including office, retail, and industrial with NNN lease structures and cap rate analysis.",
    icon: "Building2",
    tier: "pro",
  },
  {
    id: "multifamily-large",
    name: "Large Multifamily",
    shortDescription: "50+ unit apartment buildings",
    description: "Underwrite large apartment complexes with unit mix analysis, expense ratios, and institutional-grade reporting.",
    icon: "Building",
    tier: "pro",
  },
  {
    id: "syndication",
    name: "Syndication Analyzer",
    shortDescription: "LP/GP waterfall structures",
    description: "Model complex syndication structures with preferred returns, promote calculations, and investor distributions.",
    icon: "Users",
    tier: "pro",
  },
];

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
