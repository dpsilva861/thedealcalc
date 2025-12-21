// Stripe Configuration
// Price IDs for subscription plans

// These should be replaced with actual Stripe Price IDs from your Stripe Dashboard
// To get these IDs:
// 1. Go to Stripe Dashboard > Products
// 2. Create products for Basic ($3/mo) and Pro ($7/mo)
// 3. Copy the Price IDs (start with "price_")

export const STRIPE_PRICES = {
  // Basic Plan - $3/month
  // Access to 1 calculator, unlimited scenarios
  BASIC_MONTHLY: process.env.STRIPE_PRICE_BASIC_MONTHLY || "price_basic_placeholder",
  
  // Pro Plan - $7/month  
  // Access to ALL calculators, unlimited scenarios
  PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY || "price_pro_placeholder",
} as const;

// Plan configuration
export const STRIPE_PLANS = {
  basic: {
    priceId: STRIPE_PRICES.BASIC_MONTHLY,
    amount: 300, // $3.00 in cents
    name: "Basic Plan",
    description: "Access to 1 calculator, unlimited scenarios",
  },
  pro: {
    priceId: STRIPE_PRICES.PRO_MONTHLY,
    amount: 700, // $7.00 in cents
    name: "Pro Plan",
    description: "Access to ALL calculators, unlimited scenarios",
  },
} as const;

// Check if Stripe is properly configured
export function isStripeConfigured(): boolean {
  return (
    !STRIPE_PRICES.BASIC_MONTHLY.includes("placeholder") &&
    !STRIPE_PRICES.PRO_MONTHLY.includes("placeholder")
  );
}
