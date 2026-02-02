/**
 * Analytics Module
 * 
 * Consent-gated analytics tracking for key events.
 * Events only fire if user has granted analytics consent via CMP.
 * 
 * Uses Google Analytics 4 (GA4) with Consent Mode v2.
 */

import { cmpConfig, isCMPEnabled } from "@/config/cmp";

interface EventParams {
  label?: string;
  value?: number;
  [key: string]: string | number | boolean | undefined;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
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
 * Track an event (consent-gated)
 * 
 * Events are only sent to GA4 if user has granted analytics consent.
 */
export function trackEvent(eventName: string, params: EventParams = {}): void {
  // Check consent before sending
  if (!hasAnalyticsConsent()) {
    if (import.meta.env.DEV) {
      console.log(`[Analytics] ${eventName} blocked - no analytics consent`);
    }
    return;
  }

  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, {
      event_category: "engagement",
      event_label: params.label || "",
      value: params.value || undefined,
      ...params,
    });

    if (import.meta.env.DEV) {
      console.log(`[Analytics] Event sent: ${eventName}`, params);
    }
  }
}

/**
 * Track page view
 */
export function trackPageView(page: string): void {
  trackEvent("page_view", { label: page });
}

/**
 * Track calculator run (calculate_deal event)
 * 
 * This is the primary event for measuring calculator engagement.
 */
export function trackCalculatorRun(calculator: string): void {
  trackEvent("calculate_deal", { 
    calculator,
    event_category: "calculator",
  });
}

/**
 * Track results view
 */
export function trackResultsView(calculator: string): void {
  trackEvent("results_view", { 
    calculator,
    event_category: "calculator",
  });
}

/**
 * Track report export/download (download_report event)
 * 
 * This is the primary event for measuring export engagement.
 */
export function trackExport(format: "pdf" | "csv" | "excel" | "docx" | "pptx", calculator: string): void {
  trackEvent("download_report", { 
    format,
    calculator,
    event_category: "export",
  });
}
