/**
 * Analytics Module
 * Simple analytics tracking for key events
 * 
 * Events tracked:
 * - page_view: When a user visits a page
 * - calculator_run: When a user runs a calculation
 * - results_view: When a user views results
 * - export_pdf: When a user exports to PDF
 * - export_csv: When a user exports to CSV
 */

export type AnalyticsEvent = 
  | 'page_view'
  | 'calculator_run'
  | 'results_view'
  | 'export_pdf'
  | 'export_csv'
  | 'export_excel';

interface EventData {
  calculator?: string;
  page?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Track an analytics event
 * Currently logs to console in development
 * Can be extended to send to GA4, Plausible, etc.
 */
export function trackEvent(event: AnalyticsEvent, data?: EventData): void {
  // Only log in development
  if (import.meta.env.DEV) {
    console.log(`[Analytics] ${event}`, data);
  }
  
  // Send to Google Analytics if available
  if (typeof window !== 'undefined' && 'gtag' in window) {
    const gtag = (window as unknown as { gtag: (...args: unknown[]) => void }).gtag;
    gtag('event', event, {
      event_category: data?.calculator || 'general',
      event_label: data?.page || window.location.pathname,
      ...data,
    });
  }
}

/**
 * Track page view
 */
export function trackPageView(page: string): void {
  trackEvent('page_view', { page });
}

/**
 * Track calculator run
 */
export function trackCalculatorRun(calculator: string): void {
  trackEvent('calculator_run', { calculator });
}

/**
 * Track results view
 */
export function trackResultsView(calculator: string): void {
  trackEvent('results_view', { calculator });
}

/**
 * Track export action
 */
export function trackExport(format: 'pdf' | 'csv' | 'excel', calculator: string): void {
  trackEvent(`export_${format}`, { calculator });
}
