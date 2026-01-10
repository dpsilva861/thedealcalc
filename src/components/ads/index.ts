/**
 * Advertisement Components
 *
 * Provides a suite of ad placement components with lazy loading,
 * responsive behavior, consent management, and configurable providers.
 *
 * @module components/ads
 */

// Core Components
export { AdSlot } from "./AdSlot";
export { AdRail } from "./AdRail";
export { InlineAd } from "./InlineAd";
export { MobileAd } from "./MobileAd";

// Consent-Gated AdSense Loader
export { AdSenseLoader, useAdSense, useAdSenseReady } from "./AdSenseLoader";

// Configuration and Utilities
export { adConfig, shouldShowAds } from "@/config/ads";
export { isAdAllowedRoute, CONTENT_PAGES, BLOCKED_ROUTES } from "@/config/adRoutes";

// Types
export type { AdConfig, AdProvider, AdFormat } from "@/config/ads";
