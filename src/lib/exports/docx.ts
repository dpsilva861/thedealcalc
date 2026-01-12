/**
 * Word Document (DOCX) Export
 * 
 * Creates professional Word documents from calculator results.
 * Uses the docx library for generation.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  ShadingType,
  convertInchesToTwip,
  PageBreak,
} from 'docx';
import { CanonicalExportData, ExportMetric, ExportWarning, SensitivityTable } from './types';

// Color constants (matching brand)
const COLORS = {
  primary: '6B7F6E',
  accent: 'C97D60',
  text: '4A4A4A',
  lightBg: 'F5F1E9',
  white: 'FFFFFF',
  warning: 'FFF3CD',
};

/**
 * Create a styled table cell
 */
function createCell(
  text: string,
  options: {
    isHeader?: boolean;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    shading?: string;
    bold?: boolean;
  } = {}
): TableCell {
  const { isHeader, align = AlignmentType.LEFT, shading, bold } = options;
  
  return new TableCell({
    children: [
      new Paragraph({
        alignment: align,
        children: [
          new TextRun({
            text,
            bold: bold ?? isHeader,
            size: isHeader ? 22 : 20,
            color: COLORS.text,
          }),
        ],
      }),
    ],
    shading: shading || isHeader
      ? { fill: shading || COLORS.primary, type: ShadingType.SOLID, color: shading || COLORS.primary }
      : undefined,
    margins: {
      top: convertInchesToTwip(0.05),
      bottom: convertInchesToTwip(0.05),
      left: convertInchesToTwip(0.1),
      right: convertInchesToTwip(0.1),
    },
  });
}

/**
 * Create metrics table (2 columns: label, value)
 */
function createMetricsTable(metrics: ExportMetric[]): Table {
  const rows = metrics.map((m, idx) => {
    const shading = idx % 2 === 1 ? COLORS.lightBg : undefined;
    return new TableRow({
      children: [
        createCell(m.label, { shading }),
        createCell(String(m.value), { align: AlignmentType.RIGHT, shading, bold: true }),
      ],
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          createCell('Metric', { isHeader: true }),
          createCell('Value', { isHeader: true, align: AlignmentType.RIGHT }),
        ],
      }),
      ...rows,
    ],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
    },
  });
}

/**
 * Create warnings section
 */
function createWarningsSection(warnings: ExportWarning[]): Paragraph[] {
  if (warnings.length === 0) return [];

  return [
    new Paragraph({
      text: 'Risk Flags',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 100 },
    }),
    ...warnings.map(
      (w) =>
        new Paragraph({
          children: [
            new TextRun({
              text: `• ${w.message}`,
              color: w.severity === 'error' ? 'C97D60' : COLORS.text,
            }),
          ],
          spacing: { after: 80 },
        })
    ),
  ];
}

/**
 * Create sensitivity table
 */
function createSensitivityTable(table: SensitivityTable): Table {
  const headerRow = new TableRow({
    children: [
      createCell(`${table.rowHeader} \\ ${table.colHeader}`, { isHeader: true }),
      ...table.colLabels.map((col) => createCell(col, { isHeader: true, align: AlignmentType.CENTER })),
    ],
  });

  const dataRows = table.cells.map((row, rowIdx) => {
    return new TableRow({
      children: [
        createCell(table.rowLabels[rowIdx], { bold: true }),
        ...row.map((cell) => {
          const text = cell.secondaryValue
            ? `${cell.primaryValue}\n${cell.secondaryValue}`
            : String(cell.primaryValue);
          return createCell(text, {
            align: AlignmentType.CENTER,
            shading: cell.isHighlighted ? COLORS.lightBg : undefined,
          });
        }),
      ],
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
    },
  });
}

/**
 * Export data to Word document
 */
export async function exportToDocx(data: CanonicalExportData): Promise<void> {
  const addressLine = data.address
    ? [data.address.address, data.address.city, data.address.state, data.address.zipCode]
        .filter(Boolean)
        .join(', ')
    : data.address?.dealName || '';

  const doc = new Document({
    creator: 'DealCalc',
    title: data.reportTitle,
    description: 'Investment analysis report generated by DealCalc',
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
            },
          },
        },
        children: [
          // Title
          new Paragraph({
            text: data.reportTitle,
            heading: HeadingLevel.TITLE,
            spacing: { after: 100 },
          }),

          // Address / Deal Name
          ...(addressLine
            ? [
                new Paragraph({
                  text: addressLine,
                  spacing: { after: 50 },
                  style: 'Subtitle',
                }),
              ]
            : []),

          // Export date
          new Paragraph({
            children: [
              new TextRun({
                text: `Report Date: ${data.exportDate}`,
                size: 18,
                color: '888888',
              }),
            ],
            spacing: { after: 300 },
          }),

          // Key Metrics Section
          new Paragraph({
            text: 'Key Metrics',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 },
          }),
          createMetricsTable(data.keyMetrics),

          // Warnings
          ...createWarningsSection(data.warnings),

          // Assumptions sections
          ...data.assumptions.flatMap((section) => [
            new Paragraph({
              text: section.title,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 100 },
            }),
            ...(section.type === 'metrics' || section.type === 'key-value'
              ? [createMetricsTable(section.data as ExportMetric[])]
              : section.type === 'text'
              ? [
                  new Paragraph({
                    text: section.data as string,
                    spacing: { after: 100 },
                  }),
                ]
              : []),
          ]),

          // Sensitivity Analysis
          ...(data.sensitivityTables && data.sensitivityTables.length > 0
            ? [
                new Paragraph({
                  children: [new PageBreak()],
                }),
                new Paragraph({
                  text: 'Sensitivity Analysis',
                  heading: HeadingLevel.HEADING_1,
                  spacing: { before: 200, after: 100 },
                }),
                ...data.sensitivityTables.flatMap((table) => [
                  new Paragraph({
                    text: table.title,
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 200, after: 100 },
                  }),
                  createSensitivityTable(table),
                ]),
              ]
            : []),

          // Notes
          ...(data.notes
            ? [
                new Paragraph({
                  text: 'Notes',
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 300, after: 100 },
                }),
                new Paragraph({
                  text: data.notes,
                  spacing: { after: 200 },
                }),
              ]
            : []),

          // Disclaimer
          new Paragraph({
            children: [
              new TextRun({
                text: data.disclaimer,
                size: 16,
                color: '888888',
                italics: true,
              }),
            ],
            spacing: { before: 400 },
          }),
        ],
      },
    ],
  });

  // Generate and download
  const buffer = await Packer.toBlob(doc);
  const url = URL.createObjectURL(buffer);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dealcalc-${data.calculatorType}-report.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
