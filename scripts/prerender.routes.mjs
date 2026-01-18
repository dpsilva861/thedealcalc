/**
 * Prerender Routes - Single Source of Truth
 * 
 * This file defines which routes should be prerendered.
 * Import this in both prerender.mjs and verify-prerender.mjs
 */

// Routes to prerender (indexable public pages)
export const ROUTES_TO_PRERENDER = [
  '/',
  '/calculators',
  '/npv-calculator',
  '/rental-property-calculator',
  '/brrrr-calculator',
  '/syndication-calculator',
  '/cap-rate-calculator',
  '/cash-on-cash-calculator',
  '/fix-and-flip-calculator',
  '/real-estate-investment-calculator',
  '/blog',
  '/how-it-works',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/cookies',
  '/disclaimer',
  '/ad-tech-providers',
];

// Routes that should NEVER be prerendered
export const EXCLUDED_ROUTES = [
  '/results',
  '/brrrr/results',
  '/syndication/results',
  '/admin',
  '/seo-debug',
  '/sitemap-debug',
  '/structured-data-debug',
];

// Validate that no excluded routes are in the prerender list
export function validateRoutes() {
  for (const route of ROUTES_TO_PRERENDER) {
    for (const excluded of EXCLUDED_ROUTES) {
      if (route === excluded || route.startsWith(excluded + '/')) {
        throw new Error(`Route "${route}" is in the exclusion list and should not be prerendered.`);
      }
    }
  }
  return true;
}
