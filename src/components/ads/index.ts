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
export type {
  AdConfig,
  AdProvider,
  AdFormat,
  AdSlotConfig, // Export if it exists in your ads config
} from "@/config/ads";

// Re-export component prop types for external consumers
export type { AdSlotProps } from "./AdSlot";
export type { AdRailProps } from "./AdRail";
export type { InlineAdProps } from "./InlineAd";
export type { MobileAdProps } from "./MobileAd";
