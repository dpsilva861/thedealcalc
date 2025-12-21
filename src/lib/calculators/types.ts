// Calculator Platform Types
// Shared types for all calculators in the platform

export interface CalculatorMetadata {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  icon: string; // lucide icon name
  tier: "basic" | "pro"; // minimum tier required
  status: "available" | "coming_soon";
  path: string; // route path
}

export interface CalculatorWarning {
  code: string;
  message: string;
  severity: "info" | "warning" | "error";
  field?: string;
}

export interface SensitivityCell {
  value: number;
  label: string;
  isBase: boolean;
}

// Common formatting utilities
export const formatCurrency = (value: number): string => {
  if (!isFinite(value) || isNaN(value)) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatPercent = (value: number, decimals = 2): string => {
  if (!isFinite(value) || isNaN(value)) return "N/A";
  return `${(value * 100).toFixed(decimals)}%`;
};

export const formatMultiple = (value: number): string => {
  if (!isFinite(value) || isNaN(value)) return "N/A";
  return `${value.toFixed(2)}x`;
};

export const formatDSCR = (value: number, hasDebt: boolean): string => {
  if (!hasDebt) return "N/A (No Debt)";
  if (!isFinite(value) || isNaN(value)) return "N/A";
  return value.toFixed(2);
};
