/**
 * Unified Export Types
 * 
 * Canonical data structures for all calculator exports.
 * All export formats use these types as the source of truth.
 */

export type CalculatorType = 'underwriting' | 'brrrr' | 'syndication' | 'npv';
export type ExportFormat = 'xlsx' | 'csv' | 'pdf' | 'docx' | 'pptx' | 'google-docs' | 'google-sheets' | 'google-slides';

/**
 * Google Drive export result returned after successful upload
 */
export interface GoogleDriveExportResult {
  success: boolean;
  fileId?: string;
  webViewLink?: string;
  error?: string;
}

/**
 * Key-value metric for display in exports
 */
export interface ExportMetric {
  label: string;
  value: string | number;
  format?: 'currency' | 'percent' | 'multiple' | 'number' | 'text';
  isWarning?: boolean;
  description?: string;
}

/**
 * Table row for cash flow / pro forma data
 */
export interface ExportTableRow {
  [key: string]: string | number;
}

/**
 * Warning / risk flag
 */
export interface ExportWarning {
  message: string;
  severity: 'info' | 'warn' | 'error';
}

/**
 * Section of data for export
 */
export interface ExportSection {
  title: string;
  type: 'metrics' | 'table' | 'text' | 'key-value';
  data: ExportMetric[] | ExportTableRow[] | string;
  columns?: string[];
}

/**
 * Property / Deal address information
 */
export interface ExportAddress {
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  dealName?: string;
}

/**
 * Sensitivity table cell
 */
export interface SensitivityCell {
  rowLabel: string;
  colLabel: string;
  primaryValue: string | number;
  secondaryValue?: string | number;
  primaryFormat?: 'currency' | 'percent';
  secondaryFormat?: 'currency' | 'percent';
  isHighlighted?: boolean;
}

/**
 * Sensitivity table structure
 */
export interface SensitivityTable {
  title: string;
  rowHeader: string;
  colHeader: string;
  rowLabels: string[];
  colLabels: string[];
  cells: SensitivityCell[][];
}

/**
 * Canonical export data structure used by all export functions
 */
export interface CanonicalExportData {
  // Metadata
  calculatorType: CalculatorType;
  reportTitle: string;
  exportDate: string;
  address?: ExportAddress;
  
  // Core sections
  summary: ExportSection;
  keyMetrics: ExportMetric[];
  assumptions: ExportSection[];
  
  // Financial data
  cashFlowTable?: {
    title: string;
    columns: string[];
    rows: ExportTableRow[];
  };
  
  // Sensitivity analysis
  sensitivityTables?: SensitivityTable[];
  
  // Warnings
  warnings: ExportWarning[];
  
  // User notes
  notes?: string;
  
  // Disclaimer
  disclaimer: string;
}

/**
 * Format options for exports
 */
export interface ExportOptions {
  format: ExportFormat;
  includeNotes?: boolean;
  includeDisclaimer?: boolean;
  includeSensitivity?: boolean;
}

/**
 * Google OAuth state for Drive exports
 */
export interface GoogleAuthState {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  isAuthenticated: boolean;
}
