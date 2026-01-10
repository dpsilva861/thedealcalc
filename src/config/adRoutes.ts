/**
 * Ad Route Configuration
 * 
 * Defines which routes are allowed to display ads per Google AdSense policies.
 * Calculator flows, steppers, and results pages are NOT allowed to show ads.
 */

/**
 * Routes where ads are ALLOWED to appear.
 * These are content-rich pages that meet AdSense publisher content requirements.
 */
export const CONTENT_PAGES: string[] = [
  '/',
  '/how-it-works',
  '/brrrr-calculator',
  '/syndication-calculator',
  '/rental-property-calculator',
  '/fix-and-flip-calculator',
  '/cap-rate-calculator',
  '/cash-on-cash-calculator',
  '/real-estate-investment-calculator',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/disclaimer',
  '/cookies',
];

/**
 * Routes where ads are BLOCKED (calculator flows, results, steppers).
 * These pages don't have enough publisher content for AdSense compliance.
 */
export const BLOCKED_ROUTES: string[] = [
  '/brrrr',
  '/syndication',
  '/underwrite',
  '/results',
];

/**
 * Check if a given pathname is allowed to display ads.
 * Returns true only for content pages, false for calculator flows.
 */
export function isAdAllowedRoute(pathname: string): boolean {
  // Normalize pathname
  const normalizedPath = pathname.endsWith('/') && pathname !== '/' 
    ? pathname.slice(0, -1) 
    : pathname;

  // Check if it's explicitly blocked (calculator flows)
  for (const blocked of BLOCKED_ROUTES) {
    if (normalizedPath === blocked || normalizedPath.startsWith(blocked + '/')) {
      return false;
    }
  }

  // Check if it's an allowed content page
  for (const allowed of CONTENT_PAGES) {
    if (normalizedPath === allowed || normalizedPath.startsWith(allowed + '/')) {
      return true;
    }
  }

  // Default: block ads on unknown routes
  return false;
}
