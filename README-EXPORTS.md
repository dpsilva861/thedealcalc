# DealCalc Export System

## Overview

The export system provides unified export functionality for all calculator results in multiple formats:

- **Excel (.xlsx)** - Multi-sheet spreadsheet with formatting
- **CSV** - Simple comma-separated values
- **PDF** - Print-ready documents
- **Word (.docx)** - Investor memo format
- **PowerPoint (.pptx)** - Presentation slides
- **Google Docs/Sheets/Slides** - Copy to Google Drive

## Architecture

```
src/lib/exports/
├── index.ts          # Main export, format definitions
├── types.ts          # Canonical data types
├── docx.ts           # Word document generation
├── pptx.ts           # PowerPoint generation
└── google-drive.ts   # Google Drive OAuth & upload

src/components/exports/
└── ExportDropdown.tsx  # Unified UI component

supabase/functions/
└── google-drive-export/  # Edge function for Drive API
```

## Canonical Export Data

All exports use a single `CanonicalExportData` interface as the source of truth. This ensures consistency across formats:

```typescript
interface CanonicalExportData {
  calculatorType: 'underwriting' | 'brrrr' | 'syndication';
  reportTitle: string;
  exportDate: string;
  address?: ExportAddress;
  keyMetrics: ExportMetric[];
  assumptions: ExportSection[];
  sensitivityTables?: SensitivityTable[];
  warnings: ExportWarning[];
  notes?: string;
  disclaimer: string;
}
```

## Adding New Formats

1. Create export function in `src/lib/exports/`
2. Add format to `EXPORT_FORMATS` in `index.ts`
3. Add handler prop to `ExportDropdown` component
4. Wire up in calculator Results page

## Google Drive Integration

Google Drive exports require OAuth authentication:

1. User clicks Google export option
2. OAuth popup opens (if not authenticated)
3. Access token stored in localStorage
4. Edge function creates file via Google APIs
5. Success toast shows link to created file

**Note**: Google OAuth is only triggered when user selects a Google export option.

## Libraries Used

- **ExcelJS** - Excel file generation
- **jsPDF + jspdf-autotable** - PDF generation
- **docx** - Word document generation
- **pptxgenjs** - PowerPoint generation
- **Google Drive API** - Cloud exports (via edge function)
