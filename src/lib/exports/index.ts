/**
 * Export Module
 * 
 * Central export layer for all calculator results.
 * Provides unified interface for Excel, PDF, CSV, Word, PowerPoint, and Google exports.
 */

export * from './types';
export * from './docx';
export * from './pptx';
export * from './google-drive';

// Re-export format descriptions for UI
export const EXPORT_FORMATS = {
  xlsx: {
    label: 'Excel (.xlsx)',
    description: 'Spreadsheet with multiple sheets',
    icon: 'FileSpreadsheet',
    requiresAuth: false,
  },
  csv: {
    label: 'CSV (.csv)',
    description: 'Simple comma-separated values',
    icon: 'FileText',
    requiresAuth: false,
  },
  pdf: {
    label: 'PDF',
    description: 'Print-ready document',
    icon: 'FileText',
    requiresAuth: false,
  },
  docx: {
    label: 'Word (.docx)',
    description: 'Investor memo format',
    icon: 'FileText',
    requiresAuth: false,
  },
  pptx: {
    label: 'PowerPoint (.pptx)',
    description: 'Presentation slides',
    icon: 'Presentation',
    requiresAuth: false,
  },
  'google-docs': {
    label: 'Google Docs',
    description: 'Copy to Google Drive',
    icon: 'Cloud',
    requiresAuth: true,
  },
  'google-sheets': {
    label: 'Google Sheets',
    description: 'Copy to Google Drive',
    icon: 'Cloud',
    requiresAuth: true,
  },
  'google-slides': {
    label: 'Google Slides',
    description: 'Copy to Google Drive',
    icon: 'Cloud',
    requiresAuth: true,
  },
} as const;
