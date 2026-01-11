/**
 * CMP (Consent Management Platform) Configuration
 * 
 * Controls consent banner behavior and script gating.
 * 
 * Rollback: Set VITE_CMP_ENABLED=false to disable CMP entirely.
 */

export interface CMPConfig {
  /** Master switch - set to false to disable CMP */
  enabled: boolean;
  /** Regions requiring consent (ISO 3166-1 alpha-2) */
  requiredRegions: string[];
  /** Cookie name for storing consent */
  cookieName: string;
  /** Cookie expiry in days */
  cookieExpiryDays: number;
  /** Version for consent record */
  consentVersion: string;
}

// Read from environment with fallback
const cmpEnabled = import.meta.env.VITE_CMP_ENABLED !== 'false';

export const cmpConfig: CMPConfig = {
  enabled: cmpEnabled,
  // EEA + UK + Switzerland + Brazil + California
  requiredRegions: [
    // EEA
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'LV', 'LI', 'LT', 'LU',
    'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
    // UK + CH
    'GB', 'CH',
    // LGPD
    'BR',
  ],
  cookieName: 'tdc_consent',
  cookieExpiryDays: 365,
  consentVersion: '1.0.0',
};

export type ConsentCategory = 'necessary' | 'analytics' | 'marketing';

export interface ConsentState {
  /** Categories user has consented to */
  categories: Record<ConsentCategory, boolean>;
  /** Timestamp of consent */
  timestamp: number;
  /** Version of consent format */
  version: string;
  /** Whether consent was explicitly given (vs default) */
  explicit: boolean;
}

/**
 * Default consent state - necessary always on, others denied
 */
export const defaultConsentState: ConsentState = {
  categories: {
    necessary: true,
    analytics: false,
    marketing: false,
  },
  timestamp: 0,
  version: cmpConfig.consentVersion,
  explicit: false,
};

/**
 * Helper to check if CMP is enabled
 */
export const isCMPEnabled = (): boolean => cmpConfig.enabled;
