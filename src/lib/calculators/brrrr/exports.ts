// BRRRR Calculator Export Utilities
// Excel, CSV, and PDF export functions for BRRRR analysis

import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { BRRRRInputs, BRRRRResults } from "./types";
import { formatCurrency, formatPercent } from "../types";

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

interface BRRRRExportData {
  inputs: BRRRRInputs;
  results: BRRRRResults;
  propertyAddress?: string;
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

function applyDataRowStyle(row: ExcelJS.Row, isAlternate: boolean, isWarning = false) {
  row.eachCell((cell) => {
    cell.font = FONTS.body;
    cell.alignment = { vertical: "middle" };
    cell.border = {
      top: { style: "thin", color: { argb: COLORS.borderLight } },
      bottom: { style: "thin", color: { argb: COLORS.borderLight } },
      left: { style: "thin", color: { argb: COLORS.borderLight } },
      right: { style: "thin", color: { argb: COLORS.borderLight } },
    };
    if (isWarning) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.warningBg } };
    } else if (isAlternate) {
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
    oddHeader: "&C&\"Calibri,Bold\"&12DealCalc – BRRRR Analysis",
    oddFooter: "&L&D &C&P of &N &R&\"Calibri\"DealCalc.com",
  };
}

// =============================================================================
// EXCEL EXPORT
// =============================================================================
export async function exportBRRRRToExcel(data: BRRRRExportData): Promise<void> {
  const { inputs, results, propertyAddress } = data;
  const { holdingPhase, refinance, rental, metrics, riskFlags, sensitivity } = results;
  
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
  summarySheet.getCell(`A${row}`).value = "DealCalc – BRRRR Analysis";
  summarySheet.getCell(`A${row}`).font = FONTS.title;
  summarySheet.mergeCells(`A${row}:E${row}`);
  summarySheet.getRow(row).height = 32;
  row++;

  if (propertyAddress) {
    summarySheet.getCell(`A${row}`).value = propertyAddress;
    summarySheet.getCell(`A${row}`).font = { name: "Calibri", size: 14, color: { argb: COLORS.text } };
    summarySheet.mergeCells(`A${row}:E${row}`);
    row++;
  }

  summarySheet.getCell(`A${row}`).value = `Exported: ${reportDate}`;
  summarySheet.getCell(`A${row}`).font = FONTS.small;
  summarySheet.mergeCells(`A${row}:E${row}`);
  row += 2;

  // Key Metrics
  summarySheet.getCell(`A${row}`).value = "KEY METRICS";
  summarySheet.getCell(`A${row}`).font = FONTS.sectionHeader;
  row++;

  const metricsData = [
    ["Cash Left In Deal", refinance.remainingCashInDeal, "Cash-on-Cash", metrics.cashOnCashReturn],
    ["Monthly Cash Flow", rental.monthlyCashFlow, "DSCR", metrics.dscr],
    ["Annual Cash Flow", rental.annualCashFlow, "Cap Rate", metrics.capRate],
    ["Equity Created", metrics.equityCreated, "Equity Multiple", metrics.equityMultiple],
    ["Annual NOI", rental.annualNOI, "Total ROI", metrics.totalROI],
  ];

  metricsData.forEach((rowData, idx) => {
    const r = summarySheet.getRow(row);
    r.getCell(1).value = rowData[0];
    r.getCell(1).font = FONTS.body;
    r.getCell(2).value = rowData[1] as number;
    r.getCell(2).numFmt = '"$"#,##0';
    r.getCell(2).font = { name: "Calibri", size: 12, bold: true, color: { argb: COLORS.primary } };
    r.getCell(2).alignment = { horizontal: "right" };
    
    r.getCell(4).value = rowData[2];
    r.getCell(4).font = FONTS.body;
    r.getCell(5).value = rowData[3] as number;
    if (rowData[2] === "DSCR" || rowData[2] === "Equity Multiple") {
      r.getCell(5).numFmt = "0.00";
    } else {
      r.getCell(5).numFmt = "0.00%";
    }
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

  // Holding Phase
  summarySheet.getCell(`A${row}`).value = "HOLDING PHASE";
  summarySheet.getCell(`A${row}`).font = FONTS.sectionHeader;
  summarySheet.getCell(`D${row}`).value = "REFINANCE";
  summarySheet.getCell(`D${row}`).font = FONTS.sectionHeader;
  row++;

  const holdingData = [
    ["Total Cash In", holdingPhase.totalCashIn],
    ["Rehab Cost", holdingPhase.totalRehabCost],
    ["Holding Costs", holdingPhase.totalHoldingCosts],
    ["Bridge Payments", holdingPhase.totalBridgePayments],
    ["Closing Costs", holdingPhase.closingCostsAmount],
  ];

  const refiData = [
    ["Max Refi Loan", refinance.maxRefiLoan],
    ["Cash Out", refinance.cashOut],
    ["Remaining Cash In", refinance.remainingCashInDeal],
    ["New Monthly Payment", refinance.newMonthlyPayment],
  ];

  const maxRows = Math.max(holdingData.length, refiData.length);
  for (let i = 0; i < maxRows; i++) {
    const r = summarySheet.getRow(row);
    if (holdingData[i]) {
      r.getCell(1).value = holdingData[i][0];
      r.getCell(1).font = FONTS.body;
      r.getCell(2).value = holdingData[i][1] as number;
      r.getCell(2).numFmt = '"$"#,##0';
      r.getCell(2).alignment = { horizontal: "right" };
    }
    if (refiData[i]) {
      r.getCell(4).value = refiData[i][0];
      r.getCell(4).font = FONTS.body;
      r.getCell(5).value = refiData[i][1] as number;
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

  // Rental Operations
  summarySheet.getCell(`A${row}`).value = "RENTAL OPERATIONS";
  summarySheet.getCell(`A${row}`).font = FONTS.sectionHeader;
  row++;

  const rentalData = [
    ["Gross Monthly Rent", rental.grossMonthlyRent],
    ["Effective Gross Income", rental.effectiveGrossIncome],
    ["Monthly Expenses", rental.monthlyExpenses],
    ["Monthly NOI", rental.monthlyNOI],
    ["Debt Service", rental.monthlyDebtService],
    ["Monthly Cash Flow", rental.monthlyCashFlow],
  ];

  rentalData.forEach((data, idx) => {
    const r = summarySheet.getRow(row);
    r.getCell(1).value = data[0];
    r.getCell(1).font = data[0] === "Monthly Cash Flow" ? { ...FONTS.body, bold: true } : FONTS.body;
    r.getCell(2).value = data[1] as number;
    r.getCell(2).numFmt = '"$"#,##0';
    r.getCell(2).font = data[0] === "Monthly Cash Flow" 
      ? { name: "Calibri", size: 11, bold: true, color: { argb: COLORS.primary } }
      : FONTS.body;
    r.getCell(2).alignment = { horizontal: "right" };
    
    if (idx % 2 === 1) {
      [1, 2].forEach(c => {
        r.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.secondary } };
      });
    }
    row++;
  });

  summarySheet.views = [{ state: "frozen", xSplit: 0, ySplit: 5 }];

  // =========================================================================
  // SHEET 2: INPUTS
  // =========================================================================
  const inputsSheet = workbook.addWorksheet("Inputs");
  setupPrintArea(inputsSheet, { landscape: false, fitToHeight: 1 });
  
  inputsSheet.columns = [{ width: 32 }, { width: 20 }];

  row = 1;
  inputsSheet.getCell(`A${row}`).value = "BRRRR Inputs";
  inputsSheet.getCell(`A${row}`).font = FONTS.title;
  inputsSheet.mergeCells(`A${row}:B${row}`);
  row += 2;

  const inputSections = [
    { title: "ACQUISITION", data: [
      ["Purchase Price", inputs.acquisition.purchasePrice, "$"],
      ["Closing Costs", inputs.acquisition.closingCosts, inputs.acquisition.closingCostsIsPercent ? "%" : "$"],
      ["Rehab Budget", inputs.acquisition.rehabBudget, "$"],
      ["Monthly Holding Costs", inputs.acquisition.monthlyHoldingCosts, "$"],
      ["Holding Period", inputs.acquisition.holdingPeriodMonths, "months"],
    ]},
    { title: "BRIDGE FINANCING", data: [
      ["Down Payment", inputs.bridgeFinancing.downPaymentPct, "%"],
      ["Interest Rate", inputs.bridgeFinancing.interestRate, "%"],
      ["Loan Term", inputs.bridgeFinancing.loanTermMonths, "months"],
      ["Points", inputs.bridgeFinancing.pointsPct, "%"],
    ]},
    { title: "AFTER REPAIR VALUE", data: [
      ["ARV", inputs.afterRepairValue.arv, "$"],
    ]},
    { title: "REFINANCE", data: [
      ["Refi LTV", inputs.refinance.refiLtvPct, "%"],
      ["Refi Interest Rate", inputs.refinance.refiInterestRate, "%"],
      ["Refi Term", inputs.refinance.refiTermYears, "years"],
      ["Refi Closing Costs", inputs.refinance.refiClosingCosts, inputs.refinance.refiClosingCostsIsPercent ? "%" : "$"],
    ]},
    { title: "RENTAL OPERATIONS", data: [
      ["Monthly Rent", inputs.rentalOperations.monthlyRent, "$"],
      ["Vacancy", inputs.rentalOperations.vacancyPct, "%"],
      ["Property Management", inputs.rentalOperations.propertyManagementPct, "%"],
      ["Maintenance", inputs.rentalOperations.maintenancePct, "%"],
      ["Insurance (Monthly)", inputs.rentalOperations.insuranceMonthly, "$"],
      ["Property Taxes (Monthly)", inputs.rentalOperations.propertyTaxesMonthly, "$"],
    ]},
  ];

  inputSections.forEach(section => {
    inputsSheet.getCell(`A${row}`).value = section.title;
    inputsSheet.getCell(`A${row}`).font = FONTS.sectionHeader;
    row++;

    section.data.forEach((item, idx) => {
      const r = inputsSheet.getRow(row);
      r.getCell(1).value = item[0];
      r.getCell(1).font = FONTS.body;
      
      const val = item[1] as number;
      const unit = item[2];
      
      r.getCell(2).value = val;
      if (unit === "$") {
        r.getCell(2).numFmt = '"$"#,##0';
      } else if (unit === "%") {
        r.getCell(2).numFmt = "0.00%";
      } else {
        r.getCell(2).numFmt = "#,##0";
      }
      r.getCell(2).alignment = { horizontal: "right" };
      r.getCell(2).font = FONTS.body;
      
      if (idx % 2 === 0) {
        [1, 2].forEach(c => {
          r.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.secondary } };
        });
      }
      row++;
    });
    row++;
  });

  inputsSheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];

  // =========================================================================
  // SHEET 3: SENSITIVITY TABLE
  // =========================================================================
  const sensitivitySheet = workbook.addWorksheet("Sensitivity");
  setupPrintArea(sensitivitySheet, { landscape: true, fitToHeight: 1 });

  sensitivitySheet.getCell("A1").value = "Sensitivity Analysis (Cash Flow / CoC)";
  sensitivitySheet.getCell("A1").font = FONTS.title;
  sensitivitySheet.mergeCells("A1:E1");

  // Header row
  const arvHeaders = ["Rent / ARV", ...sensitivity.arvVariations.map(v => `ARV ${v >= 0 ? "+" : ""}${(v * 100).toFixed(0)}%`)];
  const headerRow = sensitivitySheet.addRow(arvHeaders);
  applyHeaderStyle(headerRow);

  sensitivity.cells.forEach((rentRow, r) => {
    const rentLabel = `Rent ${sensitivity.rentVariations[r] >= 0 ? "+" : ""}${(sensitivity.rentVariations[r] * 100).toFixed(0)}%`;
    const rowValues = [rentLabel, ...rentRow.map(cell => `${formatCurrency(cell.monthlyCashFlow)}\n${formatPercent(cell.cashOnCash)} CoC`)];
    const dataRow = sensitivitySheet.addRow(rowValues);
    
    dataRow.eachCell((cell, colNum) => {
      if (colNum > 1) {
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      }
    });
    applyDataRowStyle(dataRow, r % 2 === 1);
    dataRow.height = 36;
  });

  sensitivitySheet.columns = [{ width: 14 }, { width: 20 }, { width: 20 }, { width: 20 }];
  sensitivitySheet.views = [{ state: "frozen", xSplit: 1, ySplit: 2 }];

  // =========================================================================
  // SHEET 4: RED FLAGS
  // =========================================================================
  if (riskFlags.length > 0) {
    const flagsSheet = workbook.addWorksheet("Red Flags");
    setupPrintArea(flagsSheet, { landscape: false, fitToHeight: 1 });
    
    flagsSheet.columns = [{ width: 6 }, { width: 80 }];
    
    flagsSheet.getCell("A1").value = "Risk Flags";
    flagsSheet.getCell("A1").font = FONTS.title;
    flagsSheet.mergeCells("A1:B1");
    flagsSheet.getRow(1).height = 28;

    const flagHeaderRow = flagsSheet.addRow(["#", "Description"]);
    applyHeaderStyle(flagHeaderRow);

    riskFlags.forEach((flag, idx) => {
      const r = flagsSheet.addRow([idx + 1, flag.message]);
      r.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      r.getCell(2).alignment = { wrapText: true, vertical: "middle" };
      r.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.warningBg } };
      r.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.warningBg } };
      r.height = 28;
    });

    flagsSheet.views = [{ state: "frozen", xSplit: 0, ySplit: 2 }];
  }

  // Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dealcalc-brrrr-export.xlsx`;
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

export function exportBRRRRToCSV(data: BRRRRExportData): void {
  const { inputs, results, propertyAddress } = data;
  const { holdingPhase, refinance, rental, metrics, riskFlags } = results;

  const lines: string[] = [];
  const addRow = (...cells: (string | number)[]) => {
    lines.push(cells.map(escapeCSV).join(","));
  };

  addRow("BRRRR ANALYSIS REPORT");
  if (propertyAddress) addRow("Property", propertyAddress);
  addRow("Export Date", new Date().toLocaleString());
  addRow("");

  addRow("KEY METRICS");
  addRow("Cash Left In Deal", formatCurrency(refinance.remainingCashInDeal));
  addRow("Monthly Cash Flow", formatCurrency(rental.monthlyCashFlow));
  addRow("Annual Cash Flow", formatCurrency(rental.annualCashFlow));
  addRow("Cash-on-Cash Return", formatPercent(metrics.cashOnCashReturn));
  addRow("DSCR", metrics.dscr.toFixed(2));
  addRow("Cap Rate", formatPercent(metrics.capRate));
  addRow("");

  addRow("HOLDING PHASE");
  addRow("Total Cash In", formatCurrency(holdingPhase.totalCashIn));
  addRow("Rehab Cost", formatCurrency(holdingPhase.totalRehabCost));
  addRow("Holding Costs", formatCurrency(holdingPhase.totalHoldingCosts));
  addRow("Bridge Payments", formatCurrency(holdingPhase.totalBridgePayments));
  addRow("");

  addRow("REFINANCE");
  addRow("Max Refi Loan", formatCurrency(refinance.maxRefiLoan));
  addRow("Cash Out", formatCurrency(refinance.cashOut));
  addRow("Remaining Cash In Deal", formatCurrency(refinance.remainingCashInDeal));
  addRow("New Monthly Payment", formatCurrency(refinance.newMonthlyPayment));
  addRow("");

  addRow("RENTAL OPERATIONS");
  addRow("Monthly Rent", formatCurrency(rental.grossMonthlyRent));
  addRow("Effective Gross Income", formatCurrency(rental.effectiveGrossIncome));
  addRow("Monthly Expenses", formatCurrency(rental.monthlyExpenses));
  addRow("Monthly NOI", formatCurrency(rental.monthlyNOI));
  addRow("Monthly Cash Flow", formatCurrency(rental.monthlyCashFlow));
  addRow("");

  addRow("INPUTS");
  addRow("Purchase Price", formatCurrency(inputs.acquisition.purchasePrice));
  addRow("Rehab Budget", formatCurrency(inputs.acquisition.rehabBudget));
  addRow("ARV", formatCurrency(inputs.afterRepairValue.arv));
  addRow("Monthly Rent", formatCurrency(inputs.rentalOperations.monthlyRent));
  addRow("");

  if (riskFlags.length > 0) {
    addRow("RISK FLAGS");
    riskFlags.forEach((flag, i) => addRow(`${i + 1}`, flag.message));
  }

  const csvContent = lines.join("\r\n");
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8" });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dealcalc-brrrr-export.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// =============================================================================
// PDF EXPORT
// =============================================================================
export function exportBRRRRToPDF(data: BRRRRExportData): void {
  const { inputs, results, propertyAddress } = data;
  const { holdingPhase, refinance, rental, metrics, riskFlags, sensitivity } = results;

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
  doc.text("BRRRR Analysis Report", margin, y);
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  if (propertyAddress) {
    doc.text(propertyAddress, margin, y);
    y += 14;
  }
  doc.text(`Report Date: ${new Date().toLocaleDateString()}`, margin, y);
  y += 20;

  // Key Metrics
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Key Metrics", "Value"]],
    body: [
      ["Cash Left In Deal", formatCurrency(refinance.remainingCashInDeal)],
      ["Monthly Cash Flow", formatCurrency(rental.monthlyCashFlow)],
      ["Cash-on-Cash Return", formatPercent(metrics.cashOnCashReturn)],
      ["DSCR", metrics.dscr === Infinity ? "N/A" : metrics.dscr.toFixed(2)],
      ["Cap Rate", formatPercent(metrics.capRate)],
      ["Equity Multiple", metrics.equityMultiple.toFixed(2) + "x"],
    ],
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fontStyle: "bold" },
  });

  y = (((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY) ?? y) + 18;

  // Risk Flags
  if (riskFlags.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Risk Flags", margin, y);
    y += 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    riskFlags.forEach(flag => {
      doc.text(`• ${flag.message}`, margin + 10, y);
      y += 12;
    });
    y += 10;
  }

  // Holding Phase & Refinance side by side
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Holding Phase", "Value", "Refinance", "Value"]],
    body: [
      ["Total Cash In", formatCurrency(holdingPhase.totalCashIn), "Max Refi Loan", formatCurrency(refinance.maxRefiLoan)],
      ["Rehab Cost", formatCurrency(holdingPhase.totalRehabCost), "Cash Out", formatCurrency(refinance.cashOut)],
      ["Holding Costs", formatCurrency(holdingPhase.totalHoldingCosts), "Cash Left In", formatCurrency(refinance.remainingCashInDeal)],
      ["Bridge Payments", formatCurrency(holdingPhase.totalBridgePayments), "New Payment", formatCurrency(refinance.newMonthlyPayment)],
    ],
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fontStyle: "bold" },
  });

  // Page 2: Sensitivity
  doc.addPage();
  y = 48;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Sensitivity Analysis", margin, y);
  y += 20;

  const sensitivityHeaders = ["Rent / ARV", ...sensitivity.arvVariations.map(v => `ARV ${v >= 0 ? "+" : ""}${(v * 100).toFixed(0)}%`)];
  const sensitivityBody = sensitivity.cells.map((rentRow, r) => {
    const rentLabel = `Rent ${sensitivity.rentVariations[r] >= 0 ? "+" : ""}${(sensitivity.rentVariations[r] * 100).toFixed(0)}%`;
    return [rentLabel, ...rentRow.map(cell => `${formatCurrency(cell.monthlyCashFlow)} / ${formatPercent(cell.cashOnCash)}`)];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [sensitivityHeaders],
    body: sensitivityBody,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 4, halign: "center" },
    headStyles: { fontStyle: "bold" },
  });

  // Save
  doc.save("dealcalc-brrrr-report.pdf");
}
