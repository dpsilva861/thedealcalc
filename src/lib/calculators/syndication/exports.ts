// Syndication Calculator Export Utilities
// Excel, CSV, and PDF export functions for syndication analysis

import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { SyndicationInputs, SyndicationResults } from "./types";
import { formatCurrency, formatPercent, formatMultiple } from "../types";

// =============================================================================
// STYLE CONSTANTS
// =============================================================================
const COLORS = {
  primary: "6B7F6E",
  secondary: "F5F1E9",
  headerBg: "6B7F6E",
  headerText: "FFFFFF",
  borderLight: "E0E0E0",
  warningBg: "FFFEF3",
  text: "4A4A4A",
};

const FONTS = {
  title: { name: "Calibri", size: 22, bold: true, color: { argb: COLORS.text } } as const,
  sectionHeader: { name: "Calibri", size: 12, bold: true, color: { argb: COLORS.primary } } as const,
  body: { name: "Calibri", size: 11, color: { argb: COLORS.text } } as const,
  small: { name: "Calibri", size: 10, color: { argb: COLORS.text } } as const,
};

interface SyndicationExportData {
  inputs: SyndicationInputs;
  results: SyndicationResults;
}

function applyHeaderStyle(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: COLORS.headerText } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.headerBg } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: COLORS.borderLight } },
      bottom: { style: "thin", color: { argb: COLORS.borderLight } },
      left: { style: "thin", color: { argb: COLORS.borderLight } },
      right: { style: "thin", color: { argb: COLORS.borderLight } },
    };
  });
  row.height = 24;
}

function applyDataRowStyle(row: ExcelJS.Row, isAlternate: boolean) {
  row.eachCell((cell) => {
    cell.font = FONTS.body;
    cell.alignment = { vertical: "middle" };
    cell.border = {
      top: { style: "thin", color: { argb: COLORS.borderLight } },
      bottom: { style: "thin", color: { argb: COLORS.borderLight } },
      left: { style: "thin", color: { argb: COLORS.borderLight } },
      right: { style: "thin", color: { argb: COLORS.borderLight } },
    };
    if (isAlternate) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.secondary } };
    }
  });
  row.height = 18;
}

function setupPrintArea(sheet: ExcelJS.Worksheet, options: { 
  landscape?: boolean; 
  fitToHeight?: number;
  repeatRows?: number;
}) {
  sheet.pageSetup = {
    paperSize: 1 as ExcelJS.PaperSize,
    orientation: options.landscape ? "landscape" : "portrait",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: options.fitToHeight ?? 0,
    margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
    printTitlesRow: options.repeatRows ? `1:${options.repeatRows}` : undefined,
  };
  
  sheet.headerFooter = {
    oddHeader: "&C&\"Calibri,Bold\"&12DealCalc – Syndication Analysis",
    oddFooter: "&L&D &C&P of &N &R&\"Calibri\"DealCalc.com",
  };
}

// =============================================================================
// EXCEL EXPORT
// =============================================================================
export async function exportSyndicationToExcel(data: SyndicationExportData): Promise<void> {
  const { inputs, results } = data;
  const { sources_and_uses: su, metrics, waterfall_summary: ws, cash_flows, warnings } = results;
  
  const reportDate = new Date().toLocaleString();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "DealCalc";
  workbook.created = new Date();

  // =========================================================================
  // SHEET 1: SUMMARY
  // =========================================================================
  const summarySheet = workbook.addWorksheet("Summary");
  setupPrintArea(summarySheet, { landscape: false, fitToHeight: 1 });
  
  summarySheet.columns = [
    { width: 28 },
    { width: 20 },
    { width: 4 },
    { width: 28 },
    { width: 20 },
  ];

  let row = 1;
  summarySheet.getCell(`A${row}`).value = "DealCalc – Syndication Analysis";
  summarySheet.getCell(`A${row}`).font = FONTS.title;
  summarySheet.mergeCells(`A${row}:E${row}`);
  summarySheet.getRow(row).height = 32;
  row++;

  summarySheet.getCell(`A${row}`).value = inputs.deal_name || "Syndication Deal";
  summarySheet.getCell(`A${row}`).font = { name: "Calibri", size: 14, color: { argb: COLORS.text } };
  summarySheet.mergeCells(`A${row}:E${row}`);
  row++;

  summarySheet.getCell(`A${row}`).value = `Exported: ${reportDate}`;
  summarySheet.getCell(`A${row}`).font = FONTS.small;
  summarySheet.mergeCells(`A${row}:E${row}`);
  row += 2;

  // Key Metrics
  summarySheet.getCell(`A${row}`).value = "DEAL KPIS";
  summarySheet.getCell(`A${row}`).font = FONTS.sectionHeader;
  row++;

  const metricsData = [
    ["LP IRR", metrics.levered_irr_lp, "Unlevered IRR", metrics.unlevered_irr],
    ["LP Equity Multiple", metrics.equity_multiple_lp, "Avg Cash-on-Cash", metrics.avg_cash_on_cash],
    ["Purchase Cap Rate", metrics.purchase_cap_rate, "Exit Cap Rate", metrics.exit_cap_rate],
    ["Min DSCR", metrics.dscr_min, "Debt Yield", metrics.debt_yield],
    ["LTV at Purchase", metrics.ltv_at_purchase, "LTV at Exit", metrics.ltv_at_exit],
  ];

  metricsData.forEach((rowData, idx) => {
    const r = summarySheet.getRow(row);
    r.getCell(1).value = rowData[0];
    r.getCell(1).font = FONTS.body;
    r.getCell(2).value = rowData[1] as number;
    if (rowData[0] === "LP Equity Multiple" || rowData[0] === "Min DSCR") {
      r.getCell(2).numFmt = "0.00";
    } else {
      r.getCell(2).numFmt = "0.00%";
    }
    r.getCell(2).font = { name: "Calibri", size: 12, bold: true, color: { argb: COLORS.primary } };
    r.getCell(2).alignment = { horizontal: "right" };
    
    r.getCell(4).value = rowData[2];
    r.getCell(4).font = FONTS.body;
    r.getCell(5).value = rowData[3] as number;
    r.getCell(5).numFmt = "0.00%";
    r.getCell(5).font = { name: "Calibri", size: 12, bold: true, color: { argb: COLORS.primary } };
    r.getCell(5).alignment = { horizontal: "right" };
    
    if (idx % 2 === 1) {
      [1, 2, 4, 5].forEach(c => {
        r.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.secondary } };
      });
    }
    row++;
  });
  row += 2;

  // Sources & Uses
  summarySheet.getCell(`A${row}`).value = "SOURCES OF FUNDS";
  summarySheet.getCell(`A${row}`).font = FONTS.sectionHeader;
  summarySheet.getCell(`D${row}`).value = "USES OF FUNDS";
  summarySheet.getCell(`D${row}`).font = FONTS.sectionHeader;
  row++;

  const sourcesData = [
    ["Senior Debt", su.loan_amount],
    ["LP Equity", su.lp_equity],
    ["GP Equity", su.gp_equity],
    ["Total Sources", su.total_sources],
  ];

  const usesData = [
    ["Purchase Price", su.purchase_price],
    ["Closing Costs", su.closing_costs],
    ["Acquisition Fee", su.acquisition_fee],
    ["CapEx Budget", su.capex_budget],
    ["Initial Reserves", su.initial_reserves],
    ["Lender Fees", su.lender_fees],
    ["Total Uses", su.total_uses],
  ];

  const maxRows = Math.max(sourcesData.length, usesData.length);
  for (let i = 0; i < maxRows; i++) {
    const r = summarySheet.getRow(row);
    if (sourcesData[i]) {
      r.getCell(1).value = sourcesData[i][0];
      r.getCell(1).font = sourcesData[i][0] === "Total Sources" ? { ...FONTS.body, bold: true } : FONTS.body;
      r.getCell(2).value = sourcesData[i][1] as number;
      r.getCell(2).numFmt = '"$"#,##0';
      r.getCell(2).alignment = { horizontal: "right" };
    }
    if (usesData[i]) {
      r.getCell(4).value = usesData[i][0];
      r.getCell(4).font = usesData[i][0] === "Total Uses" ? { ...FONTS.body, bold: true } : FONTS.body;
      r.getCell(5).value = usesData[i][1] as number;
      r.getCell(5).numFmt = '"$"#,##0';
      r.getCell(5).alignment = { horizontal: "right" };
    }
    if (i % 2 === 1) {
      [1, 2, 4, 5].forEach(c => {
        r.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.secondary } };
      });
    }
    row++;
  }
  row += 2;

  // Waterfall Summary
  summarySheet.getCell(`A${row}`).value = "WATERFALL SUMMARY";
  summarySheet.getCell(`A${row}`).font = FONTS.sectionHeader;
  row++;

  const waterfallData = [
    ["LP Contributions", ws.lp_total_contributions, "GP Contributions", ws.gp_total_contributions],
    ["LP Return of Capital", ws.lp_total_roc, "GP Return of Capital", ws.gp_total_roc],
    ["LP Preferred Return", ws.lp_total_pref, "GP Preferred Return", ws.gp_total_pref],
    ["LP Promote", ws.lp_total_promote, "GP Promote + Catch-up", ws.gp_total_promote + ws.gp_total_catchup],
    ["LP Total Distributions", ws.lp_total_distributions, "GP Total Distributions", ws.gp_total_distributions],
    ["LP IRR", ws.lp_irr, "GP IRR", ws.gp_irr],
    ["LP Multiple", ws.lp_equity_multiple, "GP Multiple", ws.gp_equity_multiple],
  ];

  waterfallData.forEach((rowData, idx) => {
    const r = summarySheet.getRow(row);
    r.getCell(1).value = rowData[0];
    r.getCell(1).font = FONTS.body;
    r.getCell(2).value = rowData[1] as number;
    if (rowData[0]?.toString().includes("IRR")) {
      r.getCell(2).numFmt = "0.00%";
    } else if (rowData[0]?.toString().includes("Multiple")) {
      r.getCell(2).numFmt = "0.00";
    } else {
      r.getCell(2).numFmt = '"$"#,##0';
    }
    r.getCell(2).alignment = { horizontal: "right" };
    
    r.getCell(4).value = rowData[2];
    r.getCell(4).font = FONTS.body;
    r.getCell(5).value = rowData[3] as number;
    if (rowData[2]?.toString().includes("IRR")) {
      r.getCell(5).numFmt = "0.00%";
    } else if (rowData[2]?.toString().includes("Multiple")) {
      r.getCell(5).numFmt = "0.00";
    } else {
      r.getCell(5).numFmt = '"$"#,##0';
    }
    r.getCell(5).alignment = { horizontal: "right" };
    
    if (idx % 2 === 1) {
      [1, 2, 4, 5].forEach(c => {
        r.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.secondary } };
      });
    }
    row++;
  });

  summarySheet.views = [{ state: "frozen", xSplit: 0, ySplit: 5 }];

  // =========================================================================
  // SHEET 2: CASH FLOWS
  // =========================================================================
  const cashFlowSheet = workbook.addWorksheet("Cash Flows");
  setupPrintArea(cashFlowSheet, { landscape: true, fitToHeight: 0, repeatRows: 1 });
  
  const cfHeaders = ["Period", "GPR", "EGI", "NOI", "NCF Before Debt", "Debt Service", "NCF After Debt", "Sale Proceeds"];
  cashFlowSheet.columns = [
    { key: "period", width: 8 },
    { key: "gpr", width: 14, style: { numFmt: '"$"#,##0' } },
    { key: "egi", width: 14, style: { numFmt: '"$"#,##0' } },
    { key: "noi", width: 14, style: { numFmt: '"$"#,##0' } },
    { key: "ncf_before", width: 14, style: { numFmt: '"$"#,##0' } },
    { key: "ds", width: 14, style: { numFmt: '"$"#,##0' } },
    { key: "ncf_after", width: 14, style: { numFmt: '"$"#,##0' } },
    { key: "sale", width: 14, style: { numFmt: '"$"#,##0' } },
  ];

  const cfHeaderRow = cashFlowSheet.addRow(cfHeaders);
  applyHeaderStyle(cfHeaderRow);

  cash_flows.forEach((cf, idx) => {
    const r = cashFlowSheet.addRow([
      cf.period,
      cf.gross_potential_rent,
      cf.effective_gross_income,
      cf.noi,
      cf.ncf_before_debt,
      cf.debt_service,
      cf.ncf_after_debt,
      cf.sale_proceeds,
    ]);
    
    for (let c = 2; c <= 8; c++) {
      r.getCell(c).numFmt = '"$"#,##0';
      r.getCell(c).alignment = { horizontal: "right" };
    }
    applyDataRowStyle(r, idx % 2 === 1);
  });

  cashFlowSheet.views = [{ state: "frozen", xSplit: 1, ySplit: 1 }];

  // =========================================================================
  // SHEET 3: WARNINGS
  // =========================================================================
  if (warnings.length > 0) {
    const warningsSheet = workbook.addWorksheet("Warnings");
    setupPrintArea(warningsSheet, { landscape: false, fitToHeight: 1 });
    
    warningsSheet.columns = [{ width: 6 }, { width: 80 }];
    
    warningsSheet.getCell("A1").value = "Analysis Warnings";
    warningsSheet.getCell("A1").font = FONTS.title;
    warningsSheet.mergeCells("A1:B1");
    warningsSheet.getRow(1).height = 28;

    const warnHeaderRow = warningsSheet.addRow(["#", "Warning"]);
    applyHeaderStyle(warnHeaderRow);

    warnings.forEach((w, idx) => {
      const r = warningsSheet.addRow([idx + 1, w.message]);
      r.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      r.getCell(2).alignment = { wrapText: true, vertical: "middle" };
      r.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.warningBg } };
      r.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.warningBg } };
      r.height = 28;
    });

    warningsSheet.views = [{ state: "frozen", xSplit: 0, ySplit: 2 }];
  }

  // Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dealcalc-syndication-export.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

// =============================================================================
// CSV EXPORT
// =============================================================================
function escapeCSV(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportSyndicationToCSV(data: SyndicationExportData): void {
  const { inputs, results } = data;
  const { sources_and_uses: su, metrics, waterfall_summary: ws, warnings } = results;

  const lines: string[] = [];
  const addRow = (...cells: (string | number)[]) => {
    lines.push(cells.map(escapeCSV).join(","));
  };

  addRow("SYNDICATION ANALYSIS REPORT");
  addRow("Deal Name", inputs.deal_name || "Syndication Deal");
  addRow("Export Date", new Date().toLocaleString());
  addRow("");

  addRow("DEAL KPIS");
  addRow("LP IRR", formatPercent(metrics.levered_irr_lp));
  addRow("LP Equity Multiple", formatMultiple(metrics.equity_multiple_lp));
  addRow("Unlevered IRR", formatPercent(metrics.unlevered_irr));
  addRow("Avg Cash-on-Cash", formatPercent(metrics.avg_cash_on_cash));
  addRow("Min DSCR", metrics.dscr_min.toFixed(2));
  addRow("");

  addRow("SOURCES OF FUNDS");
  addRow("Senior Debt", formatCurrency(su.loan_amount));
  addRow("LP Equity", formatCurrency(su.lp_equity));
  addRow("GP Equity", formatCurrency(su.gp_equity));
  addRow("Total Sources", formatCurrency(su.total_sources));
  addRow("");

  addRow("USES OF FUNDS");
  addRow("Purchase Price", formatCurrency(su.purchase_price));
  addRow("Closing Costs", formatCurrency(su.closing_costs));
  addRow("CapEx Budget", formatCurrency(su.capex_budget));
  addRow("Total Uses", formatCurrency(su.total_uses));
  addRow("");

  addRow("WATERFALL SUMMARY");
  addRow("LP Total Contributions", formatCurrency(ws.lp_total_contributions));
  addRow("LP Total Distributions", formatCurrency(ws.lp_total_distributions));
  addRow("LP IRR", formatPercent(ws.lp_irr));
  addRow("LP Equity Multiple", formatMultiple(ws.lp_equity_multiple));
  addRow("GP Total Distributions", formatCurrency(ws.gp_total_distributions));
  addRow("GP IRR", formatPercent(ws.gp_irr));
  addRow("");

  if (warnings.length > 0) {
    addRow("WARNINGS");
    warnings.forEach((w, i) => addRow(`${i + 1}`, w.message));
  }

  const csvContent = lines.join("\r\n");
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8" });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dealcalc-syndication-export.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// =============================================================================
// PDF EXPORT
// =============================================================================
export function exportSyndicationToPDF(data: SyndicationExportData): void {
  const { inputs, results } = data;
  const { sources_and_uses: su, metrics, waterfall_summary: ws, warnings } = results;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "letter",
  });

  const margin = 40;
  let y = 48;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Syndication Analysis Report", margin, y);
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(inputs.deal_name || "Syndication Deal", margin, y);
  y += 14;
  doc.text(`Report Date: ${new Date().toLocaleDateString()}`, margin, y);
  y += 20;

  // Key Metrics
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Deal KPIs", "Value"]],
    body: [
      ["LP IRR", formatPercent(metrics.levered_irr_lp)],
      ["LP Equity Multiple", formatMultiple(metrics.equity_multiple_lp)],
      ["Unlevered IRR", formatPercent(metrics.unlevered_irr)],
      ["Avg Cash-on-Cash", formatPercent(metrics.avg_cash_on_cash)],
      ["Min DSCR", metrics.dscr_min.toFixed(2) + "x"],
      ["Purchase Cap Rate", formatPercent(metrics.purchase_cap_rate)],
      ["Exit Cap Rate", formatPercent(metrics.exit_cap_rate)],
    ],
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fontStyle: "bold" },
  });

  y = (((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY) ?? y) + 18;

  // Warnings
  if (warnings.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Warnings", margin, y);
    y += 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    warnings.slice(0, 5).forEach(w => {
      doc.text(`• ${w.message}`, margin + 10, y);
      y += 12;
    });
    y += 10;
  }

  // Sources & Uses
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Sources", "Value", "Uses", "Value"]],
    body: [
      ["Senior Debt", formatCurrency(su.loan_amount), "Purchase Price", formatCurrency(su.purchase_price)],
      ["LP Equity", formatCurrency(su.lp_equity), "Closing Costs", formatCurrency(su.closing_costs)],
      ["GP Equity", formatCurrency(su.gp_equity), "CapEx Budget", formatCurrency(su.capex_budget)],
      ["Total Sources", formatCurrency(su.total_sources), "Total Uses", formatCurrency(su.total_uses)],
    ],
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fontStyle: "bold" },
  });

  // Page 2: Waterfall
  doc.addPage();
  y = 48;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Waterfall Summary", margin, y);
  y += 20;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["LP Returns", "Value", "GP Returns", "Value"]],
    body: [
      ["Contributions", formatCurrency(ws.lp_total_contributions), "Contributions", formatCurrency(ws.gp_total_contributions)],
      ["Return of Capital", formatCurrency(ws.lp_total_roc), "Return of Capital", formatCurrency(ws.gp_total_roc)],
      ["Preferred Return", formatCurrency(ws.lp_total_pref), "Preferred Return", formatCurrency(ws.gp_total_pref)],
      ["Promote", formatCurrency(ws.lp_total_promote), "Promote + Catch-up", formatCurrency(ws.gp_total_promote + ws.gp_total_catchup)],
      ["Total Distributions", formatCurrency(ws.lp_total_distributions), "Total Distributions", formatCurrency(ws.gp_total_distributions)],
      ["IRR", formatPercent(ws.lp_irr), "IRR", formatPercent(ws.gp_irr)],
      ["Equity Multiple", formatMultiple(ws.lp_equity_multiple), "Equity Multiple", formatMultiple(ws.gp_equity_multiple)],
    ],
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fontStyle: "bold" },
  });

  // Save
  doc.save("dealcalc-syndication-report.pdf");
}
