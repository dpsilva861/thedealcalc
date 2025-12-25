/**
 * Analytics Module
 * Simple analytics tracking for key events
 */

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

export function trackEvent(eventName: string, params: EventParams = {}): void {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, {
      event_category: "engagement",
      event_label: params.label || "",
      value: params.value || undefined,
      ...params,
    });
  }
}

export function trackPageView(page: string): void {
  trackEvent("page_view", { label: page });
}

export function trackCalculatorRun(calculator: string): void {
  trackEvent("calculator_run", { label: calculator });
}

export function trackResultsView(calculator: string): void {
  trackEvent("results_view", { label: calculator });
}

export function trackExport(format: "pdf" | "csv" | "excel", calculator: string): void {
  trackEvent(`export_${format}`, { label: calculator });
}
