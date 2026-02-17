/**
 * Lease Redline DOCX Export
 *
 * Generates institutional-quality Word documents from lease redline analysis
 * results. Renders redline markup with tracked-change-style formatting:
 * strikethrough deletions in red, bold underline additions in green.
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
  PageBreak,
  InsertedTextRun,
  DeletedTextRun,
} from 'docx';

import type {
  LeaseRedlineResponse,
  RevisionDecision,
  LeaseRedlineRevision,
} from './types';
import { DOCUMENT_TYPE_LABELS } from './types';

// ── Color Palette ────────────────────────────────────────────────────────

const COLORS = {
  primary: '6B7F6E',
  primaryLight: 'E8EDEA',
  text: '333333',
  textMuted: '6B7280',
  white: 'FFFFFF',
  black: '000000',
  border: 'D1D5DB',
  borderLight: 'E5E7EB',
  shadedBg: 'F3F4F6',
  critical: 'DC2626',
  criticalBg: 'FEF2F2',
  high: 'EA580C',
  highBg: 'FFF7ED',
  medium: 'CA8A04',
  mediumBg: 'FEFCE8',
  low: '16A34A',
  lowBg: 'F0FDF4',
  deletionRed: 'DC2626',
  additionGreen: '16A34A',
  accepted: '16A34A',
  rejected: 'DC2626',
  modified: 'CA8A04',
  pending: '6B7280',
} as const;

// ── Risk Level Helpers ───────────────────────────────────────────────────

function riskColor(level?: string): string {
  switch (level) {
    case 'critical':
      return COLORS.critical;
    case 'high':
      return COLORS.high;
    case 'medium':
      return COLORS.medium;
    case 'low':
      return COLORS.low;
    default:
      return COLORS.textMuted;
  }
}

function riskBgColor(level?: string): string {
  switch (level) {
    case 'critical':
      return COLORS.criticalBg;
    case 'high':
      return COLORS.highBg;
    case 'medium':
      return COLORS.mediumBg;
    case 'low':
      return COLORS.lowBg;
    default:
      return COLORS.shadedBg;
  }
}

function riskLabel(level?: string): string {
  switch (level) {
    case 'critical':
      return 'CRITICAL';
    case 'high':
      return 'HIGH';
    case 'medium':
      return 'MEDIUM';
    case 'low':
      return 'LOW';
    default:
      return 'N/A';
  }
}

function decisionLabel(decision: RevisionDecision): string {
  switch (decision) {
    case 'accepted':
      return 'ACCEPTED';
    case 'rejected':
      return 'REJECTED';
    case 'modified':
      return 'MODIFIED';
    case 'pending':
    default:
      return 'PENDING';
  }
}

function decisionColor(decision: RevisionDecision): string {
  switch (decision) {
    case 'accepted':
      return COLORS.accepted;
    case 'rejected':
      return COLORS.rejected;
    case 'modified':
      return COLORS.modified;
    case 'pending':
    default:
      return COLORS.pending;
  }
}

// ── Shared Table Border Config ───────────────────────────────────────────

const TABLE_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
  left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
  right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
  insideVertical: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
} as const;

const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
  bottom: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
  left: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
  right: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
} as const;

// ── Cell Margins ─────────────────────────────────────────────────────────

const CELL_MARGINS = {
  top: 60,
  bottom: 60,
  left: 120,
  right: 120,
};

const CELL_MARGINS_COMPACT = {
  top: 40,
  bottom: 40,
  left: 100,
  right: 100,
};

// ── Redline Markup Parser ────────────────────────────────────────────────

/**
 * Parses redline markup text into an array of styled TextRun objects.
 *
 * Markup conventions:
 * - `~~text~~`  : Deleted text, rendered as red strikethrough
 * - `**text**`  : Added text, rendered as green bold underline
 * - Plain text  : Unchanged, rendered normally
 */
export function parseRedlineMarkup(text: string): TextRun[] {
  const runs: TextRun[] = [];
  // Pattern matches ~~deletions~~ and **additions** in order
  const pattern = /~~(.*?)~~|\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // Emit any plain text before this match
    if (match.index > lastIndex) {
      const plain = text.slice(lastIndex, match.index);
      if (plain) {
        runs.push(
          new TextRun({
            text: plain,
            size: 20,
            color: COLORS.text,
          })
        );
      }
    }

    if (match[1] !== undefined) {
      // ~~deletion~~
      runs.push(
        new TextRun({
          text: match[1],
          strike: true,
          color: COLORS.deletionRed,
          size: 20,
        })
      );
    } else if (match[2] !== undefined) {
      // **addition**
      runs.push(
        new TextRun({
          text: match[2],
          bold: true,
          underline: { type: 'single' },
          color: COLORS.additionGreen,
          size: 20,
        })
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Emit any trailing plain text
  if (lastIndex < text.length) {
    runs.push(
      new TextRun({
        text: text.slice(lastIndex),
        size: 20,
        color: COLORS.text,
      })
    );
  }

  // If nothing was parsed, return at least one empty run
  if (runs.length === 0) {
    runs.push(
      new TextRun({
        text: text || '',
        size: 20,
        color: COLORS.text,
      })
    );
  }

  return runs;
}

// ── Section Builders ─────────────────────────────────────────────────────

function buildTitlePage(response: LeaseRedlineResponse): Paragraph[] {
  const documentTypeLabel =
    DOCUMENT_TYPE_LABELS[response.documentType] || response.documentType;
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return [
    // Top spacer
    new Paragraph({ spacing: { before: 2400 } }),

    // Main title
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: 'LEASE REDLINE ANALYSIS',
          bold: true,
          size: 52,
          color: COLORS.primary,
          font: 'Calibri',
        }),
      ],
    }),

    // Decorative rule (simulated with underscores)
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: '\u2500'.repeat(40),
          color: COLORS.primary,
          size: 20,
        }),
      ],
    }),

    // Document type
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: documentTypeLabel.toUpperCase(),
          bold: true,
          size: 28,
          color: COLORS.text,
        }),
      ],
    }),

    // Date
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: dateStr,
          size: 22,
          color: COLORS.textMuted,
        }),
      ],
    }),

    // Output mode
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `Output Mode: ${response.outputMode.charAt(0).toUpperCase() + response.outputMode.slice(1)}`,
          size: 20,
          color: COLORS.textMuted,
          italics: true,
        }),
      ],
    }),

    // Summary stats
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: `${response.revisions.length} Revision${response.revisions.length !== 1 ? 's' : ''} Identified`,
          size: 22,
          color: COLORS.primary,
          bold: true,
        }),
        new TextRun({
          text: '   |   ',
          size: 22,
          color: COLORS.border,
        }),
        new TextRun({
          text: `${response.riskFlags.length} Risk Flag${response.riskFlags.length !== 1 ? 's' : ''}`,
          size: 22,
          color: response.riskFlags.length > 0 ? COLORS.critical : COLORS.primary,
          bold: true,
        }),
      ],
    }),

    // Page break
    new Paragraph({
      children: [new PageBreak()],
    }),
  ];
}

function buildExecutiveSummary(response: LeaseRedlineResponse): Paragraph[] {
  if (!response.summary) return [];

  return [
    new Paragraph({
      text: 'EXECUTIVE SUMMARY',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 160 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.primary },
      },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: response.summary,
          size: 21,
          color: COLORS.text,
        }),
      ],
      spacing: { after: 240 },
    }),
  ];
}

function buildRiskFlagsSection(response: LeaseRedlineResponse): Paragraph[] {
  if (response.riskFlags.length === 0) return [];

  return [
    new Paragraph({
      text: 'RISK FLAGS',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 160 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.critical },
      },
    }),
    ...response.riskFlags.map(
      (flag) =>
        new Paragraph({
          children: [
            new TextRun({
              text: '\u26A0  ',
              size: 20,
              color: COLORS.critical,
            }),
            new TextRun({
              text: flag,
              size: 20,
              color: COLORS.text,
            }),
          ],
          spacing: { after: 80 },
          indent: { left: 240 },
        })
    ),
    new Paragraph({ spacing: { after: 120 } }),
  ];
}

function buildDefinedTermsSection(response: LeaseRedlineResponse): Paragraph[] {
  if (response.definedTerms.length === 0) return [];

  // Build a comma-separated inline list for compactness
  const termsList = response.definedTerms.join('  \u2022  ');

  return [
    new Paragraph({
      text: 'DEFINED TERMS',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 160 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.primary },
      },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: termsList,
          size: 20,
          color: COLORS.text,
        }),
      ],
      spacing: { after: 240 },
      indent: { left: 240 },
    }),
  ];
}

// ── Revision Card Builder ────────────────────────────────────────────────

function buildRevisionSection(
  revision: LeaseRedlineRevision,
  decision: RevisionDecision,
  index: number
): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  // ---- Header row: Clause # | Risk Level | Category | Decision ----

  elements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          children: [
            // Clause number
            new TableCell({
              width: { size: 20, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Clause ${revision.clauseNumber}`,
                      bold: true,
                      size: 24,
                      color: COLORS.primary,
                    }),
                  ],
                }),
              ],
              margins: CELL_MARGINS_COMPACT,
              shading: {
                fill: COLORS.primaryLight,
                type: ShadingType.SOLID,
                color: COLORS.primaryLight,
              },
            }),
            // Risk level
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Risk: ',
                      size: 20,
                      color: COLORS.textMuted,
                    }),
                    new TextRun({
                      text: riskLabel(revision.riskLevel),
                      bold: true,
                      size: 20,
                      color: riskColor(revision.riskLevel),
                    }),
                  ],
                }),
              ],
              margins: CELL_MARGINS_COMPACT,
              shading: {
                fill: riskBgColor(revision.riskLevel),
                type: ShadingType.SOLID,
                color: riskBgColor(revision.riskLevel),
              },
            }),
            // Category
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: revision.category || 'General',
                      size: 20,
                      color: COLORS.text,
                      italics: true,
                    }),
                  ],
                }),
              ],
              margins: CELL_MARGINS_COMPACT,
              shading: {
                fill: COLORS.primaryLight,
                type: ShadingType.SOLID,
                color: COLORS.primaryLight,
              },
            }),
            // Decision status
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: decisionLabel(decision),
                      bold: true,
                      size: 20,
                      color: decisionColor(decision),
                    }),
                  ],
                }),
              ],
              margins: CELL_MARGINS_COMPACT,
              shading: {
                fill: COLORS.primaryLight,
                type: ShadingType.SOLID,
                color: COLORS.primaryLight,
              },
            }),
          ],
        }),
      ],
    })
  );

  // ---- Original Language (shaded box) ----

  elements.push(
    new Paragraph({
      spacing: { before: 160, after: 40 },
      children: [
        new TextRun({
          text: 'Original Language',
          bold: true,
          size: 18,
          color: COLORS.textMuted,
          allCaps: true,
        }),
      ],
    })
  );

  elements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.borderLight },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.borderLight },
        left: { style: BorderStyle.SINGLE, size: 6, color: COLORS.border },
        right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.borderLight },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: revision.originalLanguage,
                      size: 20,
                      color: COLORS.text,
                    }),
                  ],
                }),
              ],
              shading: {
                fill: COLORS.shadedBg,
                type: ShadingType.SOLID,
                color: COLORS.shadedBg,
              },
              margins: CELL_MARGINS,
            }),
          ],
        }),
      ],
    })
  );

  // ---- Redline Markup ----

  elements.push(
    new Paragraph({
      spacing: { before: 160, after: 40 },
      children: [
        new TextRun({
          text: 'Redline Markup',
          bold: true,
          size: 18,
          color: COLORS.textMuted,
          allCaps: true,
        }),
      ],
    })
  );

  const markupRuns = parseRedlineMarkup(revision.redlineMarkup);

  elements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.borderLight },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.borderLight },
        left: { style: BorderStyle.SINGLE, size: 6, color: COLORS.primary },
        right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.borderLight },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: markupRuns,
                }),
              ],
              shading: {
                fill: COLORS.white,
                type: ShadingType.SOLID,
                color: COLORS.white,
              },
              margins: CELL_MARGINS,
            }),
          ],
        }),
      ],
    })
  );

  // ---- Legend (inline, compact) ----

  elements.push(
    new Paragraph({
      spacing: { before: 40, after: 80 },
      indent: { left: 240 },
      children: [
        new TextRun({
          text: 'Red strikethrough',
          strike: true,
          color: COLORS.deletionRed,
          size: 16,
        }),
        new TextRun({
          text: ' = deleted    ',
          color: COLORS.textMuted,
          size: 16,
        }),
        new TextRun({
          text: 'Green bold underline',
          bold: true,
          underline: { type: 'single' },
          color: COLORS.additionGreen,
          size: 16,
        }),
        new TextRun({
          text: ' = added',
          color: COLORS.textMuted,
          size: 16,
        }),
      ],
    })
  );

  // ---- Clean Replacement ----

  elements.push(
    new Paragraph({
      spacing: { before: 120, after: 40 },
      children: [
        new TextRun({
          text: 'Clean Replacement',
          bold: true,
          size: 18,
          color: COLORS.textMuted,
          allCaps: true,
        }),
      ],
    })
  );

  elements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.borderLight },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.borderLight },
        left: { style: BorderStyle.SINGLE, size: 6, color: COLORS.additionGreen },
        right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.borderLight },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: revision.cleanReplacement,
                      size: 20,
                      color: COLORS.text,
                    }),
                  ],
                }),
              ],
              shading: {
                fill: COLORS.lowBg,
                type: ShadingType.SOLID,
                color: COLORS.lowBg,
              },
              margins: CELL_MARGINS,
            }),
          ],
        }),
      ],
    })
  );

  // ---- Rationale (italics) ----

  elements.push(
    new Paragraph({
      spacing: { before: 120, after: 40 },
      children: [
        new TextRun({
          text: 'Rationale',
          bold: true,
          size: 18,
          color: COLORS.textMuted,
          allCaps: true,
        }),
      ],
    })
  );

  elements.push(
    new Paragraph({
      children: [
        new TextRun({
          text: revision.reason,
          italics: true,
          size: 20,
          color: COLORS.text,
        }),
      ],
      spacing: { after: 80 },
      indent: { left: 240 },
    })
  );

  // ---- Confidence (if present) ----

  if (revision.confidence !== undefined) {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Confidence: ${Math.round(revision.confidence * 100)}%`,
            size: 18,
            color: COLORS.textMuted,
          }),
        ],
        spacing: { after: 80 },
        indent: { left: 240 },
      })
    );
  }

  // ---- Separator between revisions ----

  elements.push(
    new Paragraph({
      spacing: { before: 200, after: 200 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.borderLight },
      },
    })
  );

  return elements;
}

// ── Footer Disclaimer ────────────────────────────────────────────────────

function buildDisclaimer(): Paragraph[] {
  return [
    new Paragraph({
      spacing: { before: 600 },
      border: {
        top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
      },
    }),
    new Paragraph({
      spacing: { before: 120, after: 40 },
      children: [
        new TextRun({
          text: 'DISCLAIMER',
          bold: true,
          size: 16,
          color: COLORS.textMuted,
          allCaps: true,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text:
            'This lease redline analysis is generated by an AI-powered tool and is provided for informational purposes only. ' +
            'It does not constitute legal advice. The analysis may not capture all relevant provisions, local regulations, ' +
            'or jurisdiction-specific requirements. All suggested revisions should be reviewed and approved by qualified ' +
            'legal counsel before incorporation into any binding document. The user assumes all responsibility for the ' +
            'final terms of any executed agreement.',
          size: 16,
          color: COLORS.textMuted,
          italics: true,
        }),
      ],
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated by DealCalc Lease Redline Agent on ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}`,
          size: 14,
          color: COLORS.textMuted,
        }),
      ],
      spacing: { after: 200 },
    }),
  ];
}

// ── Revision Summary Stats Table ─────────────────────────────────────────

function buildRevisionSummaryTable(
  revisions: LeaseRedlineRevision[],
  decisions: RevisionDecision[]
): Table {
  const criticalCount = revisions.filter((r) => r.riskLevel === 'critical').length;
  const highCount = revisions.filter((r) => r.riskLevel === 'high').length;
  const mediumCount = revisions.filter((r) => r.riskLevel === 'medium').length;
  const lowCount = revisions.filter((r) => r.riskLevel === 'low').length;
  const acceptedCount = decisions.filter((d) => d === 'accepted').length;
  const rejectedCount = decisions.filter((d) => d === 'rejected').length;
  const modifiedCount = decisions.filter((d) => d === 'modified').length;
  const pendingCount = decisions.filter((d) => d === 'pending').length;

  function statRow(label: string, value: string, color: string, bgColor?: string): TableRow {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: label, size: 20, color: COLORS.text }),
              ],
            }),
          ],
          margins: CELL_MARGINS_COMPACT,
          shading: bgColor
            ? { fill: bgColor, type: ShadingType.SOLID, color: bgColor }
            : undefined,
        }),
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: value, bold: true, size: 20, color }),
              ],
            }),
          ],
          margins: CELL_MARGINS_COMPACT,
          shading: bgColor
            ? { fill: bgColor, type: ShadingType.SOLID, color: bgColor }
            : undefined,
        }),
      ],
    });
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDERS,
    rows: [
      // Header
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Analysis Overview',
                    bold: true,
                    size: 22,
                    color: COLORS.white,
                  }),
                ],
              }),
            ],
            shading: {
              fill: COLORS.primary,
              type: ShadingType.SOLID,
              color: COLORS.primary,
            },
            margins: CELL_MARGINS_COMPACT,
          }),
        ],
      }),
      statRow('Total Revisions', String(revisions.length), COLORS.primary),
      statRow('Critical', String(criticalCount), COLORS.critical, criticalCount > 0 ? COLORS.criticalBg : undefined),
      statRow('High', String(highCount), COLORS.high, highCount > 0 ? COLORS.highBg : undefined),
      statRow('Medium', String(mediumCount), COLORS.medium),
      statRow('Low', String(lowCount), COLORS.low),
      // Spacer row
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Decision Status',
                    bold: true,
                    size: 20,
                    color: COLORS.textMuted,
                  }),
                ],
              }),
            ],
            margins: CELL_MARGINS_COMPACT,
            shading: {
              fill: COLORS.shadedBg,
              type: ShadingType.SOLID,
              color: COLORS.shadedBg,
            },
          }),
        ],
      }),
      statRow('Accepted', String(acceptedCount), COLORS.accepted),
      statRow('Rejected', String(rejectedCount), COLORS.rejected),
      statRow('Modified', String(modifiedCount), COLORS.modified),
      statRow('Pending', String(pendingCount), COLORS.pending),
    ],
  });
}

// ── Main Export Function ─────────────────────────────────────────────────

/**
 * Generates a professional Word document (.docx) from lease redline analysis results.
 *
 * The document includes:
 * - Title page with document type, date, and summary statistics
 * - Executive summary
 * - Risk flags section
 * - Defined terms section
 * - Detailed revisions with original language, redline markup, clean replacement, and rationale
 * - Footer disclaimer
 *
 * @param response  The full lease redline analysis response
 * @param decisions Array of revision decisions aligned by index with response.revisions
 * @returns         A Blob containing the generated .docx file
 */
export async function exportRedlineDocx(
  response: LeaseRedlineResponse,
  decisions: RevisionDecision[]
): Promise<Blob> {
  // Normalize decisions array to match revisions length
  const normalizedDecisions: RevisionDecision[] = response.revisions.map(
    (_, i) => decisions[i] ?? 'pending'
  );

  // Build all document sections
  const children: (Paragraph | Table)[] = [
    // Title page
    ...buildTitlePage(response),

    // Executive summary
    ...buildExecutiveSummary(response),

    // Revision summary table
    ...(response.revisions.length > 0
      ? [
          new Paragraph({
            text: 'ANALYSIS OVERVIEW',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 160 },
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.primary },
            },
          }),
          buildRevisionSummaryTable(response.revisions, normalizedDecisions),
          new Paragraph({ spacing: { after: 200 } }),
        ]
      : []),

    // Risk flags
    ...buildRiskFlagsSection(response),

    // Defined terms
    ...buildDefinedTermsSection(response),

    // Revisions detail
    ...(response.revisions.length > 0
      ? [
          new Paragraph({
            children: [new PageBreak()],
          }),
          new Paragraph({
            text: 'DETAILED REVISIONS',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 200 },
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.primary },
            },
          }),
          ...response.revisions.flatMap((revision, index) =>
            buildRevisionSection(revision, normalizedDecisions[index], index)
          ),
        ]
      : []),

    // Disclaimer
    ...buildDisclaimer(),
  ];

  const doc = new Document({
    creator: 'DealCalc Lease Redline Agent',
    title: 'Lease Redline Analysis',
    description: 'AI-generated lease redline analysis with tracked revisions',
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 20,
            color: COLORS.text,
          },
        },
        heading1: {
          run: {
            font: 'Calibri',
            size: 28,
            bold: true,
            color: COLORS.primary,
          },
          paragraph: {
            spacing: { before: 300, after: 160 },
          },
        },
        heading2: {
          run: {
            font: 'Calibri',
            size: 24,
            bold: true,
            color: COLORS.text,
          },
          paragraph: {
            spacing: { before: 240, after: 120 },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1200,
              bottom: 1200,
              left: 1200,
              right: 1200,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}

// ── Download Helper ──────────────────────────────────────────────────────

/**
 * Triggers a browser download for the given Blob by creating a temporary
 * anchor element, clicking it, and cleaning up.
 *
 * @param blob     The file blob to download
 * @param filename The suggested filename for the download
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();

  // Clean up after a short delay to ensure the download starts
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 100);
}

// ── Real Track Changes Export ────────────────────────────────────────────

/**
 * Generates a Word document with REAL tracked changes (w:ins / w:del).
 *
 * This produces a .docx that opens in Word with Track Changes visible,
 * allowing the counterparty's attorney to review changes natively.
 *
 * Only accepted revisions are rendered as tracked changes.
 * Pending/rejected revisions are omitted (original text preserved).
 */
export async function exportWithTrackChanges(
  originalText: string,
  revisions: LeaseRedlineRevision[],
  decisions: RevisionDecision[],
  author: string = 'DealCalc Redline Agent'
): Promise<Blob> {
  const dateStr = new Date().toISOString();

  // Build a list of accepted replacements with positions in the original text
  type Replacement = {
    start: number;
    end: number;
    original: string;
    replacement: string;
    revisionIndex: number;
  };

  const replacements: Replacement[] = [];
  for (let i = 0; i < revisions.length; i++) {
    if (decisions[i] !== 'accepted') continue;

    const orig = revisions[i].originalLanguage;
    const idx = originalText.indexOf(orig);
    if (idx >= 0) {
      replacements.push({
        start: idx,
        end: idx + orig.length,
        original: orig,
        replacement: revisions[i].cleanReplacement,
        revisionIndex: i,
      });
    }
  }

  // Sort by start position, longest first for overlapping
  replacements.sort((a, b) => a.start - b.start || b.end - a.end);

  // Remove overlapping replacements (keep first/longest)
  const filtered: Replacement[] = [];
  let lastEnd = -1;
  for (const rep of replacements) {
    if (rep.start >= lastEnd) {
      filtered.push(rep);
      lastEnd = rep.end;
    }
  }

  // Split original text into paragraphs
  const paragraphs = originalText.split('\n');

  // Build document paragraphs with tracked changes
  let globalOffset = 0;
  let repIdx = 0;
  const docParagraphs: Paragraph[] = [];

  for (const paraText of paragraphs) {
    const paraStart = globalOffset;
    const paraEnd = globalOffset + paraText.length;
    const children: (TextRun | InsertedTextRun | DeletedTextRun)[] = [];

    let cursor = paraStart;

    // Process replacements that overlap this paragraph
    while (repIdx < filtered.length && filtered[repIdx].start < paraEnd) {
      const rep = filtered[repIdx];

      if (rep.start >= paraEnd) break;

      // Text before this replacement (within paragraph)
      if (rep.start > cursor) {
        const beforeText = originalText.slice(
          Math.max(cursor, paraStart),
          Math.min(rep.start, paraEnd)
        );
        if (beforeText) {
          children.push(new TextRun({ text: beforeText, size: 22, font: 'Calibri' }));
        }
      }

      // Use unique IDs: even for deletions, odd for insertions
      const deleteId = (rep.revisionIndex + 1) * 2;
      const insertId = (rep.revisionIndex + 1) * 2 + 1;

      // Deleted text (original language, marked as deletion)
      const deletedText = originalText.slice(
        Math.max(rep.start, paraStart),
        Math.min(rep.end, paraEnd)
      );
      if (deletedText) {
        children.push(
          new DeletedTextRun({
            text: deletedText,
            id: deleteId,
            author,
            date: dateStr,
            size: 22,
            font: 'Calibri',
          })
        );
      }

      // Inserted text (replacement language)
      // Only insert if this is the first paragraph of the replacement
      if (rep.start >= paraStart) {
        children.push(
          new InsertedTextRun({
            text: rep.replacement,
            id: insertId,
            author,
            date: dateStr,
            size: 22,
            font: 'Calibri',
          })
        );
      }

      cursor = Math.min(rep.end, paraEnd);

      // Move to next replacement if fully consumed
      if (rep.end <= paraEnd) {
        repIdx++;
      } else {
        break;
      }
    }

    // Remaining text in paragraph
    if (cursor < paraEnd) {
      const remainingText = originalText.slice(
        Math.max(cursor, paraStart),
        paraEnd
      );
      if (remainingText) {
        children.push(new TextRun({ text: remainingText, size: 22, font: 'Calibri' }));
      }
    }

    // If no children, add empty run
    if (children.length === 0) {
      children.push(new TextRun({ text: '', size: 22, font: 'Calibri' }));
    }

    docParagraphs.push(
      new Paragraph({
        children,
        spacing: { after: 120, line: 276 },
      })
    );

    // +1 for the newline character
    globalOffset = paraEnd + 1;
  }

  const doc = new Document({
    creator: author,
    title: 'Lease Redline — Track Changes',
    description: 'Lease redline with native Word track changes',
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        children: docParagraphs,
      },
    ],
  });

  return Packer.toBlob(doc);
}
