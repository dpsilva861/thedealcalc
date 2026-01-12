# DealCalc Export System

## Overview

The export system provides unified export functionality for all calculator results in multiple formats:

- **Excel (.xlsx)** - Multi-sheet spreadsheet with formatting
- **CSV** - Simple comma-separated values
- **PDF** - Print-ready documents
- **Word (.docx)** - Investor memo format
- **PowerPoint (.pptx)** - Presentation slides

> **Note:** Google Drive exports (Docs/Sheets/Slides) are NOT implemented per project requirements.

## Architecture

```
src/lib/exports/
├── index.ts          # Main export, format definitions
├── types.ts          # Canonical data types (CanonicalExportData)
├── transformers.ts   # Calculator-specific → canonical data converters
├── docx.ts           # Word document generation
└── pptx.ts           # PowerPoint generation

src/components/exports/
└── ExportDropdown.tsx  # Unified UI component

src/lib/
├── exportUtils.ts    # Underwriting Excel/PDF/CSV (legacy)
└── calculators/brrrr/exports.ts  # BRRRR Excel/PDF/CSV (legacy)
```

## Canonical Export Data

All exports use a single `CanonicalExportData` interface as the source of truth. This ensures consistency across formats:

```typescript
interface CanonicalExportData {
  calculatorType: 'underwriting' | 'brrrr' | 'syndication';
  reportTitle: string;
  exportDate: string;
  address?: ExportAddress;
  summary: ExportSection;
  keyMetrics: ExportMetric[];
  assumptions: ExportSection[];
  cashFlowTable?: {
    title: string;
    columns: string[];
    rows: ExportTableRow[];
  };
  sensitivityTables?: SensitivityTable[];
  warnings: ExportWarning[];
  notes?: string;
  disclaimer: string;
}
```

## Data Transformers

Each calculator has a transformer function that converts its results to `CanonicalExportData`:

- `transformUnderwritingToCanonical()` - Underwriting calculator
- `transformBRRRRToCanonical()` - BRRRR calculator  
- `transformSyndicationToCanonical()` - Syndication calculator

## Usage Example

```tsx
import { ExportDropdown } from '@/components/exports/ExportDropdown';
import { transformUnderwritingToCanonical } from '@/lib/exports/transformers';

// In your Results component:
const handleExportDocx = async () => {
  const { exportToDocx } = await import('@/lib/exports/docx');
  const canonicalData = transformUnderwritingToCanonical(inputs, results, address);
  await exportToDocx(canonicalData);
};

const handleExportPptx = async () => {
  const { exportToPptx } = await import('@/lib/exports/pptx');
  const canonicalData = transformUnderwritingToCanonical(inputs, results, address);
  await exportToPptx(canonicalData);
};

return (
  <ExportDropdown
    calculatorType="underwriting"
    onExportExcel={handleExportExcel}
    onExportCSV={handleExportCSV}
    onExportPDF={handleExportPDF}
    onExportDocx={handleExportDocx}
    onExportPptx={handleExportPptx}
  />
);
```

## Adding New Formats

1. Create export function in `src/lib/exports/` (e.g., `newformat.ts`)
2. Add format to `EXPORT_FORMATS` in `index.ts`
3. Add handler prop to `ExportDropdown` component
4. Wire up in calculator Results pages

## Libraries Used

- **ExcelJS** - Excel file generation
- **jsPDF + jspdf-autotable** - PDF generation  
- **docx** - Word document generation
- **pptxgenjs** - PowerPoint generation

## Content Included in Exports

All DOCX and PPTX exports include (in order):

1. Report Title
2. Property/Deal Name (if available)
3. Report Date/Time stamp
4. Key Metrics table
5. Risk Flags / Warnings (if any)
6. Assumptions (grouped sections: Sources, Uses, etc.)
7. Cash Flow / Returns Table (if available)
8. Sensitivity Tables (if available)
9. Notes (if provided)
10. Disclaimer footer

## Bundle Optimization

DOCX and PPTX libraries are lazy-loaded via dynamic imports when the user clicks export. This keeps them out of the main client bundle:

```typescript
const handleExportDocx = async () => {
  const { exportToDocx } = await import('@/lib/exports/docx');
  // ...
};
```

## Testing

To verify exports work correctly:

1. Run any calculator through to results
2. Click Export dropdown
3. Try each format (Excel, Word, PowerPoint, PDF, CSV)
4. Verify:
   - File downloads successfully
   - File is non-empty and opens in appropriate app
   - All expected sections are present
   - Formatting is professional and consistent
