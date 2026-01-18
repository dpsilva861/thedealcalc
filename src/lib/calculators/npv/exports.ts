/**
 * NPV Calculator Export Utilities
 * Excel, CSV, and PDF export functions for NPV analysis
 */

import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { NPVInputs, NPVResults, PeriodFrequency } from './types';
import { formatCurrency, formatPercent } from '../types';

// Style constants matching other calculators
const COLORS = {
  primary: '6B7F6E',
  secondary: 'F5F1E9',
  headerBg: '6B7F6E',
  headerText: 'FFFFFF',
  borderLight: 'E0E0E0',
  warningBg: 'FFFEF3',
  text: '4A4A4A',
};

const FONTS = {
  title: { name: 'Calibri', size: 22, bold: true, color: { argb: COLORS.text } } as const,
  sectionHeader: { name: 'Calibri', size: 12, bold: true, color: { argb: COLORS.primary } } as const,
  body: { name: 'Calibri', size: 11, color: { argb: COLORS.text } } as const,
  small: { name: 'Calibri', size: 10, color: { argb: COLORS.text } } as const,
};

interface NPVExportData {
  inputs: NPVInputs;
  results: NPVResults;
}

function getFrequencyLabel(freq: PeriodFrequency): string {
  switch (freq) {
    case 'annual': return 'Annual';
    case 'monthly': return 'Monthly';
    case 'quarterly': return 'Quarterly';
  }
}

function applyHeaderStyle(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.headerText } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: COLORS.borderLight } },
      bottom: { style: 'thin', color: { argb: COLORS.borderLight } },
      left: { style: 'thin', color: { argb: COLORS.borderLight } },
      right: { style: 'thin', color: { argb: COLORS.borderLight } },
    };
  });
  row.height = 24;
}

function applyDataRowStyle(row: ExcelJS.Row, isAlternate: boolean) {
  row.eachCell((cell) => {
    cell.font = FONTS.body;
    cell.alignment = { vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: COLORS.borderLight } },
      bottom: { style: 'thin', color: { argb: COLORS.borderLight } },
      left: { style: 'thin', color: { argb: COLORS.borderLight } },
      right: { style: 'thin', color: { argb: COLORS.borderLight } },
    };
    if (isAlternate) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.secondary } };
    }
  });
  row.height = 18;
}

// =============================================================================
// EXCEL EXPORT
// =============================================================================
export async function exportNPVToExcel(data: NPVExportData): Promise<void> {
  const { inputs, results } = data;
  const reportDate = new Date().toLocaleString();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'DealCalc';
  workbook.created = new Date();

  // Summary Sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { width: 28 },
    { width: 20 },
    { width: 4 },
    { width: 28 },
    { width: 20 },
  ];

  let row = 1;
  summarySheet.getCell(`A${row}`).value = 'DealCalc – NPV Analysis';
  summarySheet.getCell(`A${row}`).font = FONTS.title;
  summarySheet.mergeCells(`A${row}:E${row}`);
  row += 2;

  summarySheet.getCell(`A${row}`).value = `Exported: ${reportDate}`;
  summarySheet.getCell(`A${row}`).font = FONTS.small;
  row += 2;

  // Key Results
  summarySheet.getCell(`A${row}`).value = 'RESULTS';
  summarySheet.getCell(`A${row}`).font = FONTS.sectionHeader;
  row++;

  const resultsData = [
    ['Net Present Value', results.npv],
    ['PV of Inflows', results.pvOfInflows],
    ['PV of Outflows', results.pvOfOutflows],
    ['Total Cash Flows (Undiscounted)', results.totalCashFlows],
  ];

  resultsData.forEach((rowData, idx) => {
    const r = summarySheet.getRow(row);
    r.getCell(1).value = rowData[0];
    r.getCell(1).font = FONTS.body;
    r.getCell(2).value = rowData[1] as number;
    r.getCell(2).numFmt = '"$"#,##0.00';
    r.getCell(2).font = { name: 'Calibri', size: 12, bold: true, color: { argb: COLORS.primary } };
    r.getCell(2).alignment = { horizontal: 'right' };
    if (idx % 2 === 1) {
      [1, 2].forEach(c => {
        r.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.secondary } };
      });
    }
    row++;
  });
  row += 2;

  // Assumptions
  summarySheet.getCell(`A${row}`).value = 'ASSUMPTIONS';
  summarySheet.getCell(`A${row}`).font = FONTS.sectionHeader;
  row++;

  const assumptionsData = [
    ['Discount Rate (Annual)', formatPercent(inputs.discountRateAnnual)],
    ['Periodic Rate', formatPercent(results.periodicDiscountRate)],
    ['Period Frequency', getFrequencyLabel(inputs.periodFrequency)],
    ['Timing Convention', inputs.timingConvention === 'end_of_period' ? 'End of Period' : 'Beginning of Period'],
    ['Number of Periods', results.numberOfPeriods],
    ['Cash Flow Mode', inputs.cashFlowMode === 'single_recurring' ? 'Single Recurring' : 'Custom Series'],
  ];

  assumptionsData.forEach((rowData, idx) => {
    const r = summarySheet.getRow(row);
    r.getCell(1).value = rowData[0];
    r.getCell(1).font = FONTS.body;
    r.getCell(2).value = rowData[1];
    r.getCell(2).font = FONTS.body;
    r.getCell(2).alignment = { horizontal: 'right' };
    if (idx % 2 === 1) {
      [1, 2].forEach(c => {
        r.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.secondary } };
      });
    }
    row++;
  });

  // Cash Flow Breakdown Sheet
  const breakdownSheet = workbook.addWorksheet('Cash Flow Breakdown');
  breakdownSheet.columns = [
    { key: 'period', width: 10 },
    { key: 'cashFlow', width: 16 },
    { key: 'discountFactor', width: 16 },
    { key: 'presentValue', width: 16 },
    { key: 'cumulativePV', width: 18 },
  ];

  const headerRow = breakdownSheet.addRow(['Period', 'Cash Flow', 'Discount Factor', 'Present Value', 'Cumulative PV']);
  applyHeaderStyle(headerRow);

  results.periodBreakdowns.forEach((pb, idx) => {
    const r = breakdownSheet.addRow([
      pb.period,
      pb.cashFlow,
      pb.discountFactor,
      pb.presentValue,
      pb.cumulativePV,
    ]);
    r.getCell(2).numFmt = '"$"#,##0.00';
    r.getCell(3).numFmt = '0.0000';
    r.getCell(4).numFmt = '"$"#,##0.00';
    r.getCell(5).numFmt = '"$"#,##0.00';
    applyDataRowStyle(r, idx % 2 === 1);
  });

  breakdownSheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

  // Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dealcalc-npv-export.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}

// =============================================================================
// CSV EXPORT
// =============================================================================
function escapeCSV(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportNPVToCSV(data: NPVExportData): void {
  const { inputs, results } = data;

  const lines: string[] = [];
  const addRow = (...cells: (string | number)[]) => {
    lines.push(cells.map(escapeCSV).join(','));
  };

  addRow('NPV ANALYSIS REPORT');
  addRow('Export Date', new Date().toLocaleString());
  addRow('');

  addRow('RESULTS');
  addRow('Net Present Value', formatCurrency(results.npv));
  addRow('PV of Inflows', formatCurrency(results.pvOfInflows));
  addRow('PV of Outflows', formatCurrency(results.pvOfOutflows));
  addRow('');

  addRow('ASSUMPTIONS');
  addRow('Discount Rate (Annual)', formatPercent(inputs.discountRateAnnual));
  addRow('Periodic Rate', formatPercent(results.periodicDiscountRate));
  addRow('Period Frequency', getFrequencyLabel(inputs.periodFrequency));
  addRow('Timing Convention', inputs.timingConvention === 'end_of_period' ? 'End of Period' : 'Beginning of Period');
  addRow('Number of Periods', results.numberOfPeriods);
  addRow('');

  addRow('CASH FLOW BREAKDOWN');
  addRow('Period', 'Cash Flow', 'Discount Factor', 'Present Value', 'Cumulative PV');
  results.periodBreakdowns.forEach(pb => {
    addRow(pb.period, pb.cashFlow.toFixed(2), pb.discountFactor.toFixed(4), pb.presentValue.toFixed(2), pb.cumulativePV.toFixed(2));
  });

  const csvContent = lines.join('\r\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dealcalc-npv-export.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// =============================================================================
// PDF EXPORT
// =============================================================================
export function exportNPVToPDF(data: NPVExportData): void {
  const { inputs, results } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const margin = 40;
  let y = 48;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('NPV Analysis Report', margin, y);
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Report Date: ${new Date().toLocaleDateString()}`, margin, y);
  y += 24;

  // Key Results
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Result', 'Value']],
    body: [
      ['Net Present Value', formatCurrency(results.npv)],
      ['PV of Inflows', formatCurrency(results.pvOfInflows)],
      ['PV of Outflows', formatCurrency(results.pvOfOutflows)],
      ['Total Cash Flows', formatCurrency(results.totalCashFlows)],
    ],
    headStyles: { fillColor: [107, 127, 110] },
    alternateRowStyles: { fillColor: [245, 241, 233] },
  });

  y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 80;
  y += 20;

  // Assumptions
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Assumption', 'Value']],
    body: [
      ['Discount Rate (Annual)', formatPercent(inputs.discountRateAnnual)],
      ['Period Frequency', getFrequencyLabel(inputs.periodFrequency)],
      ['Timing Convention', inputs.timingConvention === 'end_of_period' ? 'End of Period' : 'Beginning of Period'],
      ['Number of Periods', String(results.numberOfPeriods)],
    ],
    headStyles: { fillColor: [107, 127, 110] },
    alternateRowStyles: { fillColor: [245, 241, 233] },
  });

  y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 80;
  y += 20;

  // Cash Flow Table (limit to first 20 for PDF)
  const breakdownRows = results.periodBreakdowns.slice(0, 20).map(pb => [
    String(pb.period),
    formatCurrency(pb.cashFlow),
    pb.discountFactor.toFixed(4),
    formatCurrency(pb.presentValue),
    formatCurrency(pb.cumulativePV),
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Period', 'Cash Flow', 'Discount Factor', 'Present Value', 'Cumulative PV']],
    body: breakdownRows,
    headStyles: { fillColor: [107, 127, 110] },
    alternateRowStyles: { fillColor: [245, 241, 233] },
    styles: { fontSize: 8 },
  });

  if (results.periodBreakdowns.length > 20) {
    const lastY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 100;
    doc.setFontSize(8);
    doc.text(`... and ${results.periodBreakdowns.length - 20} more periods`, margin, lastY + 12);
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('For educational purposes only. Not investment, legal, or tax advice. DealCalc.com', margin, pageHeight - 30);

  doc.save('dealcalc-npv-report.pdf');
}
