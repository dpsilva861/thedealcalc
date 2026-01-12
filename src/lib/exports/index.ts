/**
 * Export Module
 * 
 * Central export layer for all calculator results.
 * Provides unified interface for Excel, PDF, CSV, Word, and PowerPoint exports.
 * 
 * NOTE: Google Drive exports are NOT implemented per project requirements.
 */

export * from './types';
export * from './transformers';

// Re-export format descriptions for UI
export const EXPORT_FORMATS = {
  xlsx: {
    label: 'Excel (.xlsx)',
    description: 'Spreadsheet with multiple sheets',
    icon: 'FileSpreadsheet',
  },
  csv: {
    label: 'CSV (.csv)',
    description: 'Simple comma-separated values',
    icon: 'FileText',
  },
  pdf: {
    label: 'PDF',
    description: 'Print-ready document',
    icon: 'FileText',
  },
  docx: {
    label: 'Word (.docx)',
    description: 'Investor memo format',
    icon: 'FileText',
  },
  pptx: {
    label: 'PowerPoint (.pptx)',
    description: 'Presentation slides',
    icon: 'Presentation',
  },
} as const;

export type ExportFormatKey = keyof typeof EXPORT_FORMATS;
