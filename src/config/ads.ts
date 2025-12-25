/**
 * Ad Configuration
 * 
 * To configure ads:
 * 1. Set `enabled` to true
 * 2. Set `provider` to "adsense" 
 * 3. Add your Google AdSense client ID (ca-pub-XXXXXXXXXXXXXXXX)
 * 4. For each AdSlot, provide the appropriate slot ID from your AdSense account
 * 
 * To disable ads (for dev/staging):
 * - Set `enabled` to false
 * 
 * Slot IDs are configured per placement location.
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

export const adConfig: AdConfig = {
  // Set to true to show ads (enabled for production)
  enabled: true,
  
  // Use placeholder for development, adsense for production
  // NOTE: Change to "adsense" and add your real client ID before go-live
  provider: "placeholder",
  
  // Replace with your Google AdSense client ID when ready
  // Get your client ID from https://www.google.com/adsense/
  clientId: "ca-pub-XXXXXXXXXXXXXXXX",
  
  // Replace with your AdSense slot IDs from your AdSense account
  slots: {
    homeBetweenSections: "1234567890",
    rightRail: "2345678901",
    rightRailSecondary: "3456789012",
    mobileInContent: "4567890123",
  },
};

/**
 * Helper to check if ads should be shown
 */
export const shouldShowAds = (): boolean => {
  return adConfig.enabled && adConfig.provider !== "placeholder";
};
