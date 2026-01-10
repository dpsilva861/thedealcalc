/**
 * TCF Consent Management Hook
 * 
 * Provides consent state for GDPR/TCF compliance with Google AdSense.
 * Reads consent from the IAB TCF 2.x API (window.__tcfapi).
 * 
 * Key TCF Purposes for AdSense:
 * - Purpose 1: Store and/or access information on a device (REQUIRED for ads)
 * - Purpose 2-10: Various advertising purposes
 * 
 * This hook returns:
 * - hasConsent: true if Purpose 1 consent granted OR if CMP not present (non-EU)
 * - isLoading: true while checking consent status
 * - consentString: TCF consent string (TC string) if available
 */

import { useState, useEffect, useCallback } from "react";

interface ConsentState {
  /** Whether Purpose 1 consent is granted (or CMP not required) */
  hasConsent: boolean;
  /** Whether consent check is in progress */
  isLoading: boolean;
  /** TCF consent string if available */
  consentString: string | null;
  /** Whether a CMP is present on the page */
  cmpPresent: boolean;
  /** Error message if consent check failed */
  error: string | null;
}

interface TCFData {
  tcString?: string;
  gdprApplies?: boolean;
  purpose?: {
    consents?: Record<number, boolean>;
  };
  eventStatus?: string;
  cmpStatus?: string;
}

// TCF API command callback types
type TCFCallback = (tcData: TCFData | null, success: boolean) => void;

declare global {
  interface Window {
    __tcfapi?: (
      command: string,
      version: number,
      callback: TCFCallback,
      parameter?: unknown
    ) => void;
  }
}

const CONSENT_CHECK_TIMEOUT_MS = 3000;
const PURPOSE_1_ID = 1; // Store/access device info

export function useConsent(): ConsentState {
  const [state, setState] = useState<ConsentState>({
    hasConsent: false,
    isLoading: true,
    consentString: null,
    cmpPresent: false,
    error: null,
  });

  const checkConsent = useCallback(() => {
    // If no TCF API present, assume consent (non-EU or no CMP configured)
    if (typeof window.__tcfapi !== "function") {
      setState({
        hasConsent: true,
        isLoading: false,
        consentString: null,
        cmpPresent: false,
        error: null,
      });
      return;
    }

    // CMP is present
    setState(prev => ({ ...prev, cmpPresent: true }));

    // Set timeout for consent check
    const timeoutId = setTimeout(() => {
      setState(prev => {
        if (prev.isLoading) {
          console.warn("[useConsent] TCF consent check timed out");
          return {
            ...prev,
            hasConsent: false,
            isLoading: false,
            error: "Consent check timed out",
          };
        }
        return prev;
      });
    }, CONSENT_CHECK_TIMEOUT_MS);

    // Query TCF API for consent
    window.__tcfapi("addEventListener", 2, (tcData, success) => {
      clearTimeout(timeoutId);

      if (!success || !tcData) {
        setState({
          hasConsent: false,
          isLoading: false,
          consentString: null,
          cmpPresent: true,
          error: "Failed to get consent data",
        });
        return;
      }

      // Check if consent UI is complete
      const isComplete = 
        tcData.eventStatus === "tcloaded" || 
        tcData.eventStatus === "useractioncomplete";

      if (!isComplete) {
        // Wait for user action
        return;
      }

      // Check Purpose 1 consent (required for AdSense)
      const purpose1Consent = tcData.purpose?.consents?.[PURPOSE_1_ID] ?? false;

      // If GDPR doesn't apply, allow ads
      const gdprApplies = tcData.gdprApplies ?? false;
      const hasConsent = !gdprApplies || purpose1Consent;

      setState({
        hasConsent,
        isLoading: false,
        consentString: tcData.tcString || null,
        cmpPresent: true,
        error: null,
      });

      // Log for debugging
      if (import.meta.env.DEV) {
        console.log("[useConsent] Consent resolved:", {
          gdprApplies,
          purpose1Consent,
          hasConsent,
          eventStatus: tcData.eventStatus,
        });
      }
    });
  }, []);

  useEffect(() => {
    // Small delay to allow CMP script to initialize
    const initTimeout = setTimeout(checkConsent, 100);
    return () => clearTimeout(initTimeout);
  }, [checkConsent]);

  return state;
}

/**
 * Check if consent is required based on user's location.
 * This is a simple check - the CMP will handle actual geo-targeting.
 */
export function useConsentRequired(): boolean {
  // If CMP is present, consent is required
  // CMP handles geo-targeting internally
  return typeof window !== "undefined" && typeof window.__tcfapi === "function";
}
