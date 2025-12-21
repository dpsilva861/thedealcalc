// Centralized entitlement functions for calculator access
import { CalculatorMetadata } from "./calculators/types";

export type PlanTier = "free" | "basic" | "pro";

/**
 * Check if a user can access a specific calculator
 */
export function canAccessCalculator(
  planTier: PlanTier,
  calculatorId: string,
  basicSelectedCalculatorId: string | null,
  isSubscribed: boolean
): boolean {
  // Pro subscribers can access all calculators
  if (planTier === "pro" && isSubscribed) {
    return true;
  }

  // Basic subscribers can only access their selected calculator
  if (planTier === "basic" && isSubscribed) {
    return basicSelectedCalculatorId !== null && calculatorId === basicSelectedCalculatorId;
  }

  // Free tier (not subscribed) - can try any calculator during free trial
  return true;
}

/**
 * Check if a Basic user needs to select their calculator
 */
export function requiresBasicSelection(
  planTier: PlanTier,
  basicSelectedCalculatorId: string | null,
  isSubscribed: boolean
): boolean {
  return planTier === "basic" && isSubscribed && basicSelectedCalculatorId === null;
}

/**
 * Get list of accessible calculators for a user
 */
export function getAccessibleCalculators(
  planTier: PlanTier,
  basicSelectedCalculatorId: string | null,
  isSubscribed: boolean,
  allCalculators: CalculatorMetadata[]
): CalculatorMetadata[] {
  // Pro subscribers get all live calculators
  if (planTier === "pro" && isSubscribed) {
    return allCalculators.filter(c => c.status === "available");
  }

  // Basic subscribers get only their selected calculator
  if (planTier === "basic" && isSubscribed) {
    if (!basicSelectedCalculatorId) {
      return [];
    }
    return allCalculators.filter(
      c => c.status === "available" && c.id === basicSelectedCalculatorId
    );
  }

  // Free tier - all live calculators (trial mode)
  return allCalculators.filter(c => c.status === "available");
}

/**
 * Check if a calculator is locked for the user
 */
export function isCalculatorLocked(
  planTier: PlanTier,
  calculatorId: string,
  basicSelectedCalculatorId: string | null,
  isSubscribed: boolean
): boolean {
  return !canAccessCalculator(planTier, calculatorId, basicSelectedCalculatorId, isSubscribed);
}

/**
 * Get the route for a calculator after access check
 */
export function getCalculatorRoute(calculatorId: string): string {
  switch (calculatorId) {
    case "residential":
      return "/underwrite";
    case "brrrr":
      return "/brrrr";
    case "syndication":
      return "/syndication";
    default:
      return "/underwrite";
  }
}

// Plan pricing configuration
export const PLAN_PRICING = {
  basic: {
    price: 3,
    name: "Basic",
    description: "1 calculator, unlimited scenarios",
    features: [
      "Access to 1 calculator of your choice",
      "Unlimited scenario runs",
      "Professional PDF reports",
      "Excel & CSV exports",
      "Save unlimited analyses",
    ],
  },
  pro: {
    price: 7,
    name: "Pro",
    description: "All calculators, unlimited scenarios",
    features: [
      "Access to ALL calculators",
      "Unlimited scenario runs across all calculators",
      "Professional PDF reports",
      "Excel & CSV exports",
      "Save unlimited analyses",
      "Switch calculators freely",
      "Priority support",
    ],
  },
} as const;
