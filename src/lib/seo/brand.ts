/**
 * Brand Constants - Single Source of Truth
 * 
 * All brand-related constants used across SEO schemas and meta tags.
 * This ensures consistency across Organization, WebSite, and page-level schemas.
 */

// Core brand identity
export const BRAND_NAME = "TheDealCalc";
export const BRAND_URL = "https://thedealcalc.com";

// Logo URL - uses the existing OG image as the brand logo
// This is an absolute URL to a real image in the public folder
export const BRAND_LOGO_URL = `${BRAND_URL}/og-image.png`;

// Brand description - factual, no marketing claims
export const BRAND_DESCRIPTION = 
  "Real estate investment calculators for analyzing rental properties, BRRRR deals, syndications, and NPV.";

// Social profiles - only include verified, existing profiles
// TODO: Add verified social profile URLs once created (do not guess)
// Examples: "https://twitter.com/thedealcalc", "https://linkedin.com/company/thedealcalc"
export const BRAND_SAME_AS: string[] = [];

// Logo dimensions (for ImageObject in schema)
export const BRAND_LOGO_WIDTH = 1200;
export const BRAND_LOGO_HEIGHT = 630;

