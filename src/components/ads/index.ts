/**
 * Advertisement Components
 *
 * Provides a suite of ad placement components with lazy loading,
 * responsive behavior, and configurable providers (AdSense, placeholder).
 *
 * @module components/ads
 */

// Core Components
export { AdSlot } from "./AdSlot";
export { AdRail } from "./AdRail";
export { InlineAd } from "./InlineAd";
export { MobileAd } from "./MobileAd";

// Configuration and Utilities
export { adConfig, shouldShowAds } from "@/config/ads";

// Types
export type { AdConfig, AdProvider, AdFormat } from "@/config/ads";
