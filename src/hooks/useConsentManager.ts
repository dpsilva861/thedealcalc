/**
 * Consent Manager Hook
 * 
 * Manages consent state for GDPR/CCPA compliance.
 * Persists consent to localStorage with cookie fallback.
 * Integrates with Google Consent Mode v2.
 * 
 * Usage:
 *   const { consent, hasAnalytics, hasMarketing, acceptAll, rejectAll, updateConsent, showBanner } = useConsentManager();
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  cmpConfig, 
  ConsentState, 
  ConsentCategory, 
  defaultConsentState,
  isCMPEnabled 
} from '@/config/cmp';

interface ConsentManagerResult {
  /** Current consent state */
  consent: ConsentState;
  /** Whether analytics consent is granted */
  hasAnalytics: boolean;
  /** Whether marketing/ads consent is granted */
  hasMarketing: boolean;
  /** Whether consent banner should be shown */
  showBanner: boolean;
  /** Whether consent is being loaded */
  isLoading: boolean;
  /** Accept all consent categories */
  acceptAll: () => void;
  /** Reject all non-essential categories */
  rejectAll: () => void;
  /** Update specific categories */
  updateConsent: (categories: Partial<Record<ConsentCategory, boolean>>) => void;
  /** Open preferences modal */
  openPreferences: () => void;
  /** Close banner without changing consent */
  closeBanner: () => void;
}

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Update Google Consent Mode based on consent state
 */
function updateGoogleConsent(consent: ConsentState): void {
  if (typeof window === 'undefined' || !window.gtag) return;

  const analyticsGranted = consent.categories.analytics;
  const marketingGranted = consent.categories.marketing;

  window.gtag('consent', 'update', {
    'analytics_storage': analyticsGranted ? 'granted' : 'denied',
    'ad_storage': marketingGranted ? 'granted' : 'denied',
    'ad_user_data': marketingGranted ? 'granted' : 'denied',
    'ad_personalization': marketingGranted ? 'granted' : 'denied',
  });

  if (import.meta.env.DEV) {
    console.log('[ConsentManager] Google Consent Mode updated:', {
      analytics_storage: analyticsGranted ? 'granted' : 'denied',
      ad_storage: marketingGranted ? 'granted' : 'denied',
    });
  }
}

/**
 * Save consent to localStorage
 */
function saveConsent(consent: ConsentState): void {
  try {
    localStorage.setItem(cmpConfig.cookieName, JSON.stringify(consent));
  } catch (e) {
    console.warn('[ConsentManager] Failed to save consent:', e);
  }
}

/**
 * Load consent from localStorage
 */
function loadConsent(): ConsentState | null {
  try {
    const stored = localStorage.getItem(cmpConfig.cookieName);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as ConsentState;
    
    // Validate version
    if (parsed.version !== cmpConfig.consentVersion) {
      // Version mismatch - ask again
      localStorage.removeItem(cmpConfig.cookieName);
      return null;
    }

    // Check expiry
    const expiryMs = cmpConfig.cookieExpiryDays * 24 * 60 * 60 * 1000;
    if (Date.now() - parsed.timestamp > expiryMs) {
      localStorage.removeItem(cmpConfig.cookieName);
      return null;
    }

    return parsed;
  } catch (e) {
    console.warn('[ConsentManager] Failed to load consent:', e);
    return null;
  }
}

export function useConsentManager(): ConsentManagerResult {
  const [consent, setConsent] = useState<ConsentState>(defaultConsentState);
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  // Load consent on mount
  useEffect(() => {
    // If CMP disabled, grant all and skip banner
    if (!isCMPEnabled()) {
      const grantedState: ConsentState = {
        categories: { necessary: true, analytics: true, marketing: true },
        timestamp: Date.now(),
        version: cmpConfig.consentVersion,
        explicit: false,
      };
      setConsent(grantedState);
      updateGoogleConsent(grantedState);
      setIsLoading(false);
      return;
    }

    const stored = loadConsent();
    
    if (stored) {
      setConsent(stored);
      updateGoogleConsent(stored);
      setShowBanner(false);
    } else {
      // No stored consent - show banner
      setShowBanner(true);
      // Apply default (denied) consent to Google
      updateGoogleConsent(defaultConsentState);
    }
    
    setIsLoading(false);
  }, []);

  // Derived state
  const hasAnalytics = useMemo(() => consent.categories.analytics, [consent]);
  const hasMarketing = useMemo(() => consent.categories.marketing, [consent]);

  // Accept all
  const acceptAll = useCallback(() => {
    const newState: ConsentState = {
      categories: { necessary: true, analytics: true, marketing: true },
      timestamp: Date.now(),
      version: cmpConfig.consentVersion,
      explicit: true,
    };
    setConsent(newState);
    saveConsent(newState);
    updateGoogleConsent(newState);
    setShowBanner(false);
    setPreferencesOpen(false);
  }, []);

  // Reject all
  const rejectAll = useCallback(() => {
    const newState: ConsentState = {
      categories: { necessary: true, analytics: false, marketing: false },
      timestamp: Date.now(),
      version: cmpConfig.consentVersion,
      explicit: true,
    };
    setConsent(newState);
    saveConsent(newState);
    updateGoogleConsent(newState);
    setShowBanner(false);
    setPreferencesOpen(false);
  }, []);

  // Update specific categories
  const updateConsent = useCallback((categories: Partial<Record<ConsentCategory, boolean>>) => {
    const newState: ConsentState = {
      categories: {
        ...consent.categories,
        ...categories,
        necessary: true, // Always keep necessary
      },
      timestamp: Date.now(),
      version: cmpConfig.consentVersion,
      explicit: true,
    };
    setConsent(newState);
    saveConsent(newState);
    updateGoogleConsent(newState);
    setShowBanner(false);
    setPreferencesOpen(false);
  }, [consent]);

  // Open preferences
  const openPreferences = useCallback(() => {
    setPreferencesOpen(true);
    setShowBanner(true);
  }, []);

  // Close banner
  const closeBanner = useCallback(() => {
    setShowBanner(false);
    setPreferencesOpen(false);
  }, []);

  return {
    consent,
    hasAnalytics,
    hasMarketing,
    showBanner: showBanner || preferencesOpen,
    isLoading,
    acceptAll,
    rejectAll,
    updateConsent,
    openPreferences,
    closeBanner,
  };
}
