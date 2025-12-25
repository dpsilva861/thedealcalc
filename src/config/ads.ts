/**
 * Ad Configuration
 * 
 * Configuration is read from environment variables.
 * If VITE_ADSENSE_CLIENT_ID is not set, ads are automatically disabled.
 * 
 * Required environment variables:
 * - VITE_ADSENSE_CLIENT_ID: Google AdSense client ID (ca-pub-XXXX)
 * - VITE_ADSENSE_SLOT_TOP: Slot ID for top/header ads
 * - VITE_ADSENSE_SLOT_INCONTENT: Slot ID for in-content ads
 * - VITE_ADSENSE_SLOT_FOOTER: Slot ID for footer/rail ads
 * 
 * Optional:
 * - VITE_GA_MEASUREMENT_ID: Google Analytics 4 measurement ID
 */

export type AdProvider = "adsense" | "placeholder";
export type AdFormat = "auto" | "rectangle" | "horizontal" | "vertical";

export interface AdConfig {
  /** Master switch to enable/disable all ads */
  enabled: boolean;
  /** Ad provider - use "placeholder" for development */
  provider: AdProvider;
  /** Google AdSense client ID (e.g., "ca-pub-1234567890123456") */
  clientId: string;
  /** Individual slot configurations */
  slots: {
    /** Ad between major sections on home page */
    homeBetweenSections: string;
    /** Right rail ad on content pages */
    rightRail: string;
    /** Secondary right rail ad */
    rightRailSecondary: string;
    /** Mobile in-content ad */
    mobileInContent: string;
  };
}

// Read from environment variables with graceful fallbacks
const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID || "";
const slotTop = import.meta.env.VITE_ADSENSE_SLOT_TOP || "";
const slotInContent = import.meta.env.VITE_ADSENSE_SLOT_INCONTENT || "";
const slotFooter = import.meta.env.VITE_ADSENSE_SLOT_FOOTER || "";

// Ads are only enabled if we have a valid client ID
const hasValidConfig = clientId.startsWith("ca-pub-") && clientId.length > 10;

export const adConfig: AdConfig = {
  // Only enable if we have valid AdSense credentials
  enabled: hasValidConfig,
  
  // Use adsense if configured, otherwise placeholder (for development)
  provider: hasValidConfig ? "adsense" : "placeholder",
  
  // Client ID from environment
  clientId,
  
  // Slot IDs from environment
  slots: {
    homeBetweenSections: slotTop || slotInContent,
    rightRail: slotFooter || slotInContent,
    rightRailSecondary: slotFooter,
    mobileInContent: slotInContent,
  },
};

/**
 * Helper to check if ads should be shown
 * Returns false if:
 * - Ads are disabled in config
 * - Using placeholder provider (no real AdSense)
 * - Missing required environment variables
 */
export const shouldShowAds = (): boolean => {
  return adConfig.enabled && adConfig.provider === "adsense" && !!adConfig.clientId;
};

/**
 * Helper to check if a specific slot is configured
 */
export const isSlotConfigured = (slotId: string): boolean => {
  return !!slotId && slotId.length > 0;
};
