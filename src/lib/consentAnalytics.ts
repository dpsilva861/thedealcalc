/**
 * Consent-Gated Analytics Module
 * 
 * Custom event tracking that only fires when user has granted analytics consent.
 * Integrates with the CMP (Consent Management Platform) to ensure GDPR/CCPA compliance.
 * 
 * Events are queued and only sent to GA4 after consent is verified.
 */

import { cmpConfig, isCMPEnabled } from "@/config/cmp";

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Check if analytics consent has been granted
 */
function hasAnalyticsConsent(): boolean {
  // If CMP is disabled, assume consent granted
  if (!isCMPEnabled()) {
    return true;
  }

  try {
    const stored = localStorage.getItem(cmpConfig.cookieName);
    if (!stored) return false;

    const consent = JSON.parse(stored);
    return consent?.categories?.analytics === true;
  } catch {
    return false;
  }
}

/**
 * Check if marketing consent has been granted (for ad-related events)
 */
function hasMarketingConsent(): boolean {
  // If CMP is disabled, assume consent granted
  if (!isCMPEnabled()) {
    return true;
  }

  try {
    const stored = localStorage.getItem(cmpConfig.cookieName);
    if (!stored) return false;

    const consent = JSON.parse(stored);
    return consent?.categories?.marketing === true;
  } catch {
    return false;
  }
}

/**
 * Send event to GA4 (only if gtag is available)
 */
function sendEvent(eventName: string, params: Record<string, unknown> = {}): void {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
    
    if (import.meta.env.DEV) {
      console.log(`[ConsentAnalytics] Event sent: ${eventName}`, params);
    }
  }
}

// ============================================================================
// CUSTOM EVENT FUNCTIONS (Consent-Gated)
// ============================================================================

export interface CalculateDealParams {
  calculator: "rental" | "brrrr" | "syndication" | "fix-flip" | "npv";
  /** Optional additional context */
  property_type?: string;
  /** Optional metric values */
  irr?: number;
  coc?: number;
  noi?: number;
}

/**
 * Track when user runs a deal calculation
 * Event: calculate_deal
 * 
 * Only fires if analytics consent has been granted.
 */
export function trackCalculateDeal(params: CalculateDealParams): void {
  if (!hasAnalyticsConsent()) {
    if (import.meta.env.DEV) {
      console.log("[ConsentAnalytics] calculate_deal blocked - no analytics consent");
    }
    return;
  }

  sendEvent("calculate_deal", {
    event_category: "engagement",
    calculator_type: params.calculator,
    property_type: params.property_type,
    // Only include metrics if provided (avoid sending undefined)
    ...(params.irr !== undefined && { irr: Math.round(params.irr * 100) / 100 }),
    ...(params.coc !== undefined && { coc: Math.round(params.coc * 100) / 100 }),
    ...(params.noi !== undefined && { noi: Math.round(params.noi) }),
  });
}

export interface DownloadReportParams {
  format: "pdf" | "csv" | "excel" | "docx" | "pptx";
  calculator: "rental" | "brrrr" | "syndication" | "fix-flip" | "npv";
  /** Optional: report type or variation */
  report_type?: string;
}

/**
 * Track when user downloads/exports a report
 * Event: download_report
 * 
 * Only fires if analytics consent has been granted.
 */
export function trackDownloadReport(params: DownloadReportParams): void {
  if (!hasAnalyticsConsent()) {
    if (import.meta.env.DEV) {
      console.log("[ConsentAnalytics] download_report blocked - no analytics consent");
    }
    return;
  }

  sendEvent("download_report", {
    event_category: "engagement",
    format: params.format,
    calculator_type: params.calculator,
    report_type: params.report_type,
  });
}

/**
 * Track page view (consent-gated)
 * Event: page_view
 */
export function trackPageView(page: string): void {
  if (!hasAnalyticsConsent()) {
    if (import.meta.env.DEV) {
      console.log("[ConsentAnalytics] page_view blocked - no analytics consent");
    }
    return;
  }

  sendEvent("page_view", {
    page_location: window.location.href,
    page_path: page,
    page_title: document.title,
  });
}

/**
 * Track generic event (consent-gated based on category)
 */
export function trackConsentedEvent(
  eventName: string,
  params: Record<string, unknown> = {},
  requireMarketing = false
): void {
  const hasConsent = requireMarketing 
    ? hasMarketingConsent() 
    : hasAnalyticsConsent();

  if (!hasConsent) {
    if (import.meta.env.DEV) {
      console.log(`[ConsentAnalytics] ${eventName} blocked - no consent`);
    }
    return;
  }

  sendEvent(eventName, params);
}
