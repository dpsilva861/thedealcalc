import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  formatCurrency,
  formatPercent,
  formatMultiple,
  UnderwritingResults,
  UnderwritingInputs,
  MonthlyData,
  AnnualSummary,
} from "@/lib/underwriting";
import { PropertyAddress } from "@/contexts/UnderwritingContext";

// CSV escape function - properly handles commas, quotes, and newlines
function escapeCSV(value: string | number): string {
  const str = String(value);
  // If contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function getFileBase(address?: string): string {
  return (address || "analysis")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface ExportData {
  inputs: UnderwritingInputs;
  results: UnderwritingResults;
  monthlyData: MonthlyData[];
  annualSummary: AnnualSummary[];
  propertyAddress?: PropertyAddress;
  redFlags: string[];
}

// =============================================================================
// EXCEL EXPORT (Professional .xlsx using ExcelJS)
// =============================================================================

// Style constants
const COLORS = {
  primary: "6B7F6E",      // Sage green
  secondary: "F5F1E9",    // Cream
  accent: "C97D60",       // Terracotta  
  text: "4A4A4A",         // Warm gray
  background: "FAFAF8",   // Off-white
  headerBg: "6B7F6E",
  headerText: "FFFFFF",
  borderLight: "E0E0E0",
  warningBg: "FFF3CD",
  warningText: "856404",
};

const FONTS = {
  title: { name: "Calibri", size: 22, bold: true, color: { argb: COLORS.text } },
  header: { name: "Calibri", size: 14, bold: true, color: { argb: COLORS.headerText } },
  sectionHeader: { name: "Calibri", size: 12, bold: true, color: { argb: COLORS.primary } },
  body: { name: "Calibri", size: 11, color: { argb: COLORS.text } },
  small: { name: "Calibri", size: 10, color: { argb: COLORS.text } },
};

function applyHeaderStyle(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: COLORS.headerText } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.headerBg } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin", color: { argb: COLORS.borderLight } },
      bottom: { style: "thin", color: { argb: COLORS.borderLight } },
      left: { style: "thin", color: { argb: COLORS.borderLight } },
      right: { style: "thin", color: { argb: COLORS.borderLight } },
    };
  });
  row.height = 22;
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
      cell.font = { ...FONTS.body, color: { argb: COLORS.warningText } };
    } else if (isAlternate) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.secondary } };
    }
  });
  row.height = 18;
}

function setupPrintArea(sheet: ExcelJS.Worksheet, options: { 
  landscape?: boolean; 
  fitToPage?: boolean;
  repeatRows?: number;
}) {
  sheet.pageSetup = {
    paperSize: 1 as ExcelJS.PaperSize, // Letter
    orientation: options.landscape ? "landscape" : "portrait",
    fitToPage: options.fitToPage ?? true,
    fitToWidth: 1,
    fitToHeight: options.fitToPage ? 1 : 0,
    margins: {
      left: 0.5, right: 0.5,
      top: 0.75, bottom: 0.75,
      header: 0.3, footer: 0.3,
    },
    printTitlesRow: options.repeatRows ? `1:${options.repeatRows}` : undefined,
  };
  
  sheet.headerFooter = {
    oddHeader: "&C&\"Calibri,Bold\"&12DealCalc – Underwriting Report",
    oddFooter: "&L&D &C&P of &N &R&\"Calibri\"DealCalc.com",
  };
}

export async function exportToExcel(data: ExportData): Promise<void> {
  const { inputs, results, monthlyData, annualSummary, propertyAddress, redFlags } = data;
  const { metrics, sourcesAndUses, saleAnalysis, sensitivityTables } = results;

  const addressLine = propertyAddress
    ? `${propertyAddress.address || ""}, ${propertyAddress.city || ""}, ${propertyAddress.state || ""} ${propertyAddress.zipCode || ""}`.trim().replace(/^,\s*/, "")
    : "Property Analysis";
  const reportDate = new Date().toLocaleString();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "DealCalc";
  workbook.created = new Date();

  // =========================================================================
  // SHEET 1: SUMMARY (Print-ready, 1-page)
  // =========================================================================
  const summarySheet = workbook.addWorksheet("Summary");
  setupPrintArea(summarySheet, { landscape: false, fitToPage: true });

  // Column widths
  summarySheet.columns = [
    { width: 28 },
    { width: 22 },
    { width: 4 },
    { width: 28 },
    { width: 22 },
  ];

  // Title header
  let row = 1;
  const titleCell = summarySheet.getCell(`A${row}`);
  titleCell.value = "DealCalc Underwriting Report";
  titleCell.font = FONTS.title;
  summarySheet.mergeCells(`A${row}:E${row}`);
  summarySheet.getRow(row).height = 32;
  row++;

  // Property address
  const addressCell = summarySheet.getCell(`A${row}`);
  addressCell.value = addressLine;
  addressCell.font = { name: "Calibri", size: 14, color: { argb: COLORS.text } };
  summarySheet.mergeCells(`A${row}:E${row}`);
  row++;

  // Export date
  const dateCell = summarySheet.getCell(`A${row}`);
  dateCell.value = `Exported: ${reportDate}`;
  dateCell.font = FONTS.small;
  summarySheet.mergeCells(`A${row}:E${row}`);
  row += 2;

  // Section: Key Metrics (large, prominent)
  const metricsHeaderCell = summarySheet.getCell(`A${row}`);
  metricsHeaderCell.value = "KEY METRICS";
  metricsHeaderCell.font = FONTS.sectionHeader;
  summarySheet.mergeCells(`A${row}:E${row}`);
  row++;

  // Metrics in 2-column layout
  const metricsData = [
    ["Purchase Price", inputs.acquisition.purchasePrice, "IRR", metrics.irr],
    ["Renovation Budget", sourcesAndUses.uses.renoBudget, "Cash-on-Cash (Yr 1)", metrics.cocYear1],
    ["ARV / Sale Price", saleAnalysis.salePrice, "Equity Multiple", metrics.equityMultiple],
    ["Loan Amount", sourcesAndUses.sources.loanAmount, "DSCR", metrics.dscr],
    ["Equity Required", sourcesAndUses.sources.equity, "Breakeven Occupancy", metrics.breakevenOccupancy],
    ["Monthly Rent", inputs.income.marketMonthlyRentPerUnit * inputs.income.unitCount, "Stabilized NOI", metrics.stabilizedNoiAnnual],
  ];

  metricsData.forEach((rowData, idx) => {
    const r = summarySheet.getRow(row);
    r.getCell(1).value = rowData[0];
    r.getCell(1).font = FONTS.body;
    r.getCell(2).value = rowData[1] as number;
    r.getCell(2).numFmt = typeof rowData[1] === "number" && rowData[1] < 10 ? "#,##0.00" : '"$"#,##0';
    r.getCell(2).font = { name: "Calibri", size: 12, bold: true, color: { argb: COLORS.primary } };
    r.getCell(2).alignment = { horizontal: "right" };
    
    r.getCell(4).value = rowData[2];
    r.getCell(4).font = FONTS.body;
    r.getCell(5).value = rowData[3] as number;
    // Format percentage vs decimal
    if (typeof rowData[3] === "number") {
      if (rowData[2] === "DSCR" || rowData[2] === "Equity Multiple") {
        r.getCell(5).numFmt = "#,##0.00";
      } else {
        r.getCell(5).numFmt = "0.00%";
      }
    }
    r.getCell(5).font = { name: "Calibri", size: 12, bold: true, color: { argb: COLORS.primary } };
    r.getCell(5).alignment = { horizontal: "right" };
    
    // Alternate row shading
    if (idx % 2 === 1) {
      [1, 2, 4, 5].forEach(c => {
        r.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.secondary } };
      });
    }
    row++;
  });
  row += 2;

  // Section: Sources & Uses side by side
  const sourcesHeaderCell = summarySheet.getCell(`A${row}`);
  sourcesHeaderCell.value = "SOURCES OF FUNDS";
  sourcesHeaderCell.font = FONTS.sectionHeader;
  
  const usesHeaderCell = summarySheet.getCell(`D${row}`);
  usesHeaderCell.value = "USES OF FUNDS";
  usesHeaderCell.font = FONTS.sectionHeader;
  row++;

  const sourcesData = [
    ["Loan Amount", sourcesAndUses.sources.loanAmount],
    ["Equity Required", sourcesAndUses.sources.equity],
    ["Total Sources", sourcesAndUses.sources.total],
  ];

  const usesData = [
    ["Purchase Price", sourcesAndUses.uses.purchasePrice],
    ["Closing Costs", sourcesAndUses.uses.closingCosts],
    ["Loan Origination", sourcesAndUses.uses.originationFee],
    ["Renovation Budget", sourcesAndUses.uses.renoBudget],
    ["Total Uses", sourcesAndUses.uses.total],
  ];

  const maxRows = Math.max(sourcesData.length, usesData.length);
  for (let i = 0; i < maxRows; i++) {
    const r = summarySheet.getRow(row);
    
    if (sourcesData[i]) {
      r.getCell(1).value = sourcesData[i][0];
      r.getCell(1).font = sourcesData[i][0] === "Total Sources" ? { ...FONTS.body, bold: true } : FONTS.body;
      r.getCell(2).value = sourcesData[i][1] as number;
      r.getCell(2).numFmt = '"$"#,##0';
      r.getCell(2).font = sourcesData[i][0] === "Total Sources" 
        ? { name: "Calibri", size: 11, bold: true, color: { argb: COLORS.primary } }
        : FONTS.body;
      r.getCell(2).alignment = { horizontal: "right" };
    }
    
    if (usesData[i]) {
      r.getCell(4).value = usesData[i][0];
      r.getCell(4).font = usesData[i][0] === "Total Uses" ? { ...FONTS.body, bold: true } : FONTS.body;
      r.getCell(5).value = usesData[i][1] as number;
      r.getCell(5).numFmt = '"$"#,##0';
      r.getCell(5).font = usesData[i][0] === "Total Uses"
        ? { name: "Calibri", size: 11, bold: true, color: { argb: COLORS.primary } }
        : FONTS.body;
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

  // Section: Exit Analysis
  const exitHeaderCell = summarySheet.getCell(`A${row}`);
  exitHeaderCell.value = "EXIT ANALYSIS";
  exitHeaderCell.font = FONTS.sectionHeader;
  summarySheet.mergeCells(`A${row}:E${row}`);
  row++;

  const exitData = [
    ["Stabilized NOI", saleAnalysis.stabilizedNoi],
    ["Sale Price", saleAnalysis.salePrice],
    ["Sale Costs", saleAnalysis.saleCosts],
    ["Loan Payoff", saleAnalysis.loanPayoff],
    ["Net Proceeds", saleAnalysis.netSaleProceeds],
  ];

  exitData.forEach((data, idx) => {
    const r = summarySheet.getRow(row);
    r.getCell(1).value = data[0];
    r.getCell(1).font = data[0] === "Net Proceeds" ? { ...FONTS.body, bold: true } : FONTS.body;
    r.getCell(2).value = data[1] as number;
    r.getCell(2).numFmt = '"$"#,##0';
    r.getCell(2).font = data[0] === "Net Proceeds"
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

  // Freeze panes
  summarySheet.views = [{ state: "frozen", xSplit: 0, ySplit: 4 }];

  // =========================================================================
  // SHEET 2: INPUTS
  // =========================================================================
  const inputsSheet = workbook.addWorksheet("Inputs");
  setupPrintArea(inputsSheet, { landscape: false, fitToPage: true });

  inputsSheet.columns = [{ width: 32 }, { width: 20 }];

  row = 1;
  inputsSheet.getCell(`A${row}`).value = "Underwriting Inputs";
  inputsSheet.getCell(`A${row}`).font = FONTS.title;
  inputsSheet.mergeCells(`A${row}:B${row}`);
  row += 2;

  const inputSections = [
    { title: "ACQUISITION", data: [
      ["Purchase Price", inputs.acquisition.purchasePrice, "$"],
      ["Closing Costs", inputs.acquisition.closingCosts, "$"],
      ["Hold Period", inputs.acquisition.holdPeriodMonths, "months"],
      ["Exit Cap Rate", inputs.acquisition.exitCapRate, "%"],
    ]},
    { title: "INCOME", data: [
      ["Unit Count", inputs.income.unitCount, "units"],
      ["In-Place Rent/Unit", inputs.income.inPlaceMonthlyRentPerUnit, "$"],
      ["Market Rent/Unit", inputs.income.marketMonthlyRentPerUnit, "$"],
      ["Vacancy Rate", inputs.income.economicVacancyPct, "%"],
      ["Annual Rent Growth", inputs.income.rentGrowthAnnualPct, "%"],
    ]},
    { title: "FINANCING", data: [
      ["Loan Amount", inputs.financing.loanAmount, "$"],
      ["Interest Rate", inputs.financing.interestRateAnnual, "%"],
      ["Amortization", inputs.financing.amortizationYears * 12, "months"],
      ["Loan Term", inputs.financing.loanTermMonths, "months"],
      ["Origination Fee", inputs.financing.loanOriginationFeePct, "%"],
    ]},
    { title: "EXPENSES", data: [
      ["Property Tax", inputs.expenses.propertyTaxesAnnual, "$"],
      ["Insurance", inputs.expenses.insuranceAnnual, "$"],
      ["Utilities", inputs.expenses.utilitiesAnnual, "$"],
      ["Repairs & Maintenance", inputs.expenses.repairsMaintenanceAnnual, "$"],
      ["Property Management", inputs.expenses.propertyMgmtPctOfEgi, "%"],
      ["Replacement Reserves", inputs.expenses.replacementReservesAnnual, "$"],
    ]},
    { title: "RENOVATION", data: [
      ["Renovation Budget", inputs.renovation.renoBudgetTotal, "$"],
      ["Renovation Duration", inputs.renovation.renoDurationMonths, "months"],
      ["Make-Ready per Unit", inputs.renovation.makeReadyPerUnit, "$"],
      ["Leasing Commission", inputs.renovation.leasingCommissionPctOfNewLease, "%"],
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
  // SHEET 3: CASH FLOW / PRO FORMA (Annual)
  // =========================================================================
  const annualSheet = workbook.addWorksheet("Annual Pro Forma");
  setupPrintArea(annualSheet, { landscape: true, fitToPage: false, repeatRows: 1 });

  const annualHeaders = ["Year", "GPR", "Vacancy", "EGI", "OpEx", "NOI", "Debt Service", "Cash Flow", "DSCR", "CoC"];
  annualSheet.columns = [
    { width: 8 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 10 },
    { width: 10 },
  ];

  const headerRow = annualSheet.addRow(annualHeaders);
  applyHeaderStyle(headerRow);

  annualSummary.forEach((yr, idx) => {
    const vacancy = yr.gpr - yr.egi;
    const opex = yr.egi - yr.noi;
    const r = annualSheet.addRow([
      yr.year,
      yr.gpr,
      vacancy,
      yr.egi,
      opex,
      yr.noi,
      yr.debtService,
      yr.cashFlow,
      yr.dscr,
      yr.coc,
    ]);
    
    // Apply number formats
    r.getCell(2).numFmt = '"$"#,##0';
    r.getCell(3).numFmt = '"$"#,##0';
    r.getCell(4).numFmt = '"$"#,##0';
    r.getCell(5).numFmt = '"$"#,##0';
    r.getCell(6).numFmt = '"$"#,##0';
    r.getCell(7).numFmt = '"$"#,##0';
    r.getCell(8).numFmt = '"$"#,##0';
    r.getCell(9).numFmt = "0.00";
    r.getCell(10).numFmt = "0.00%";
    
    // Warning for low DSCR
    const isWarning = yr.dscr > 0 && yr.dscr < 1.2;
    applyDataRowStyle(r, idx % 2 === 1, isWarning);
    
    // Right-align numbers
    for (let c = 2; c <= 10; c++) {
      r.getCell(c).alignment = { horizontal: "right" };
    }
  });

  annualSheet.views = [{ state: "frozen", xSplit: 1, ySplit: 1 }];

  // =========================================================================
  // SHEET 4: MONTHLY CASH FLOW
  // =========================================================================
  const monthlySheet = workbook.addWorksheet("Monthly Cash Flow");
  setupPrintArea(monthlySheet, { landscape: true, fitToPage: false, repeatRows: 1 });

  const monthlyHeaders = ["Month", "Rent/Unit", "GPR", "EGI", "OpEx", "NOI", "Debt Svc", "Principal", "Interest", "CapEx", "Cash Flow", "Loan Bal"];
  monthlySheet.columns = [
    { width: 8 },
    { width: 11 },
    { width: 12 },
    { width: 12 },
    { width: 11 },
    { width: 12 },
    { width: 11 },
    { width: 11 },
    { width: 11 },
    { width: 11 },
    { width: 12 },
    { width: 14 },
  ];

  const monthlyHeaderRow = monthlySheet.addRow(monthlyHeaders);
  applyHeaderStyle(monthlyHeaderRow);

  monthlyData.forEach((m, idx) => {
    const capex = m.renoSpend + m.makeReady + m.leasingCosts;
    const r = monthlySheet.addRow([
      m.month,
      m.rent,
      m.gpr,
      m.egi,
      m.totalOpex,
      m.noi,
      m.debtService,
      m.principalPayment,
      m.interestPayment,
      capex,
      m.cashFlowBeforeTax,
      m.loanBalance,
    ]);
    
    // Number formats
    for (let c = 2; c <= 12; c++) {
      r.getCell(c).numFmt = '"$"#,##0';
      r.getCell(c).alignment = { horizontal: "right" };
    }
    
    applyDataRowStyle(r, idx % 2 === 1);
  });

  monthlySheet.views = [{ state: "frozen", xSplit: 1, ySplit: 1 }];

  // =========================================================================
  // SHEET 5: RED FLAGS (if any)
  // =========================================================================
  if (redFlags.length > 0) {
    const flagsSheet = workbook.addWorksheet("Red Flags");
    setupPrintArea(flagsSheet, { landscape: false, fitToPage: true });

    flagsSheet.columns = [{ width: 6 }, { width: 80 }];

    flagsSheet.getCell("A1").value = "Potential Concerns";
    flagsSheet.getCell("A1").font = FONTS.title;
    flagsSheet.mergeCells("A1:B1");

    redFlags.forEach((flag, idx) => {
      const r = flagsSheet.addRow([idx + 1, flag]);
      r.getCell(1).font = { ...FONTS.body, bold: true };
      r.getCell(1).alignment = { horizontal: "center" };
      r.getCell(2).font = FONTS.body;
      r.getCell(2).alignment = { wrapText: true };
      r.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.warningBg } };
      r.height = 24;
    });
  }

  // =========================================================================
  // SHEET 6: SENSITIVITY ANALYSIS
  // =========================================================================
  const sensitivitySheet = workbook.addWorksheet("Sensitivity");
  setupPrintArea(sensitivitySheet, { landscape: false, fitToPage: true });

  sensitivitySheet.columns = [{ width: 18 }, { width: 12 }, { width: 12 }];

  row = 1;
  sensitivitySheet.getCell(`A${row}`).value = "Sensitivity Analysis";
  sensitivitySheet.getCell(`A${row}`).font = FONTS.title;
  sensitivitySheet.mergeCells(`A${row}:C${row}`);
  row += 2;

  // Rent Sensitivity
  sensitivitySheet.getCell(`A${row}`).value = "RENT SENSITIVITY";
  sensitivitySheet.getCell(`A${row}`).font = FONTS.sectionHeader;
  row++;
  
  const rentHeaderRow = sensitivitySheet.addRow(["Scenario", "IRR", "CoC"]);
  applyHeaderStyle(rentHeaderRow);
  row++;
  
  sensitivityTables.rent.forEach((r, idx) => {
    const dataRow = sensitivitySheet.addRow([r.label, r.irr, r.coc]);
    dataRow.getCell(2).numFmt = "0.00%";
    dataRow.getCell(3).numFmt = "0.00%";
    dataRow.getCell(2).alignment = { horizontal: "right" };
    dataRow.getCell(3).alignment = { horizontal: "right" };
    applyDataRowStyle(dataRow, idx % 2 === 1);
    row++;
  });
  row++;

  // Exit Cap Sensitivity
  sensitivitySheet.getCell(`A${row}`).value = "EXIT CAP SENSITIVITY";
  sensitivitySheet.getCell(`A${row}`).font = FONTS.sectionHeader;
  row++;
  
  const capHeaderRow = sensitivitySheet.addRow(["Scenario", "IRR", "CoC"]);
  applyHeaderStyle(capHeaderRow);
  row++;
  
  sensitivityTables.exitCap.forEach((r, idx) => {
    const dataRow = sensitivitySheet.addRow([r.label, r.irr, r.coc]);
    dataRow.getCell(2).numFmt = "0.00%";
    dataRow.getCell(3).numFmt = "0.00%";
    dataRow.getCell(2).alignment = { horizontal: "right" };
    dataRow.getCell(3).alignment = { horizontal: "right" };
    applyDataRowStyle(dataRow, idx % 2 === 1);
    row++;
  });
  row++;

  // Reno Budget Sensitivity
  sensitivitySheet.getCell(`A${row}`).value = "RENO BUDGET SENSITIVITY";
  sensitivitySheet.getCell(`A${row}`).font = FONTS.sectionHeader;
  row++;
  
  const renoHeaderRow = sensitivitySheet.addRow(["Scenario", "IRR", "CoC"]);
  applyHeaderStyle(renoHeaderRow);
  row++;
  
  sensitivityTables.renoBudget.forEach((r, idx) => {
    const dataRow = sensitivitySheet.addRow([r.label, r.irr, r.coc]);
    dataRow.getCell(2).numFmt = "0.00%";
    dataRow.getCell(3).numFmt = "0.00%";
    dataRow.getCell(2).alignment = { horizontal: "right" };
    dataRow.getCell(3).alignment = { horizontal: "right" };
    applyDataRowStyle(dataRow, idx % 2 === 1);
  });

  // =========================================================================
  // DOWNLOAD
  // =========================================================================
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `underwriting-report-${getFileBase(propertyAddress?.address)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

// =============================================================================
// CSV EXPORT (Proper UTF-8 with escaping)
// =============================================================================
export function exportToCSV(data: ExportData): void {
  const { inputs, results, monthlyData, propertyAddress } = data;
  const { metrics, sourcesAndUses } = results;

  const addressLine = propertyAddress
    ? `${propertyAddress.address || ""}, ${propertyAddress.city || ""}, ${propertyAddress.state || ""} ${propertyAddress.zipCode || ""}`.trim()
    : "N/A";
  const reportDate = new Date().toLocaleDateString();

  const lines: string[] = [];

  // Helper to add a row with proper escaping
  const addRow = (...cells: (string | number)[]) => {
    lines.push(cells.map(escapeCSV).join(","));
  };

  addRow("UNDERWRITING REPORT");
  addRow("Property Address", addressLine);
  addRow("Report Date", reportDate);
  addRow("Units", inputs.income.unitCount);
  addRow("Purchase Price", formatCurrency(inputs.acquisition.purchasePrice));
  addRow("Hold Period", `${inputs.acquisition.holdPeriodMonths} months`);
  addRow("");

  addRow("KEY METRICS");
  addRow("IRR", formatPercent(metrics.irr));
  addRow("Cash-on-Cash (Year 1)", formatPercent(metrics.cocYear1));
  addRow("Equity Multiple", formatMultiple(metrics.equityMultiple));
  addRow("DSCR", metrics.dscr.toFixed(2));
  addRow("Breakeven Occupancy", formatPercent(metrics.breakevenOccupancy));
  addRow("NOI (Stabilized Annual)", formatCurrency(metrics.stabilizedNoiAnnual));
  addRow("");

  addRow("SOURCES OF FUNDS");
  addRow("Loan Amount", formatCurrency(sourcesAndUses.sources.loanAmount));
  addRow("Equity Required", formatCurrency(sourcesAndUses.sources.equity));
  addRow("Total Sources", formatCurrency(sourcesAndUses.sources.total));
  addRow("");

  addRow("USES OF FUNDS");
  addRow("Purchase Price", formatCurrency(sourcesAndUses.uses.purchasePrice));
  addRow("Closing Costs", formatCurrency(sourcesAndUses.uses.closingCosts));
  addRow("Renovation Budget", formatCurrency(sourcesAndUses.uses.renoBudget));
  addRow("Total Uses", formatCurrency(sourcesAndUses.uses.total));
  addRow("");

  addRow("MONTHLY CASH FLOW SCHEDULE");
  addRow(
    "Month", "Rent/Unit", "GPR", "EGI", "OpEx", "NOI",
    "Debt Service", "Principal", "Interest", "CapEx", "Cash Flow", "Loan Balance"
  );

  monthlyData.forEach(m => {
    addRow(
      m.month,
      m.rent.toFixed(2),
      m.gpr.toFixed(2),
      m.egi.toFixed(2),
      m.totalOpex.toFixed(2),
      m.noi.toFixed(2),
      m.debtService.toFixed(2),
      m.principalPayment.toFixed(2),
      m.interestPayment.toFixed(2),
      (m.renoSpend + m.makeReady + m.leasingCosts).toFixed(2),
      m.cashFlowBeforeTax.toFixed(2),
      m.loanBalance.toFixed(2)
    );
  });

  // Use CRLF line endings for best Excel compatibility
  const csvContent = lines.join("\r\n");
  
  // Add UTF-8 BOM for Excel to recognize encoding
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8" });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `underwriting-report-${getFileBase(propertyAddress?.address)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// =============================================================================
// PDF EXPORT (Using jsPDF + jspdf-autotable)
// =============================================================================
export function exportToPDF(data: ExportData): void {
  const { inputs, results, monthlyData, annualSummary, propertyAddress, redFlags } = data;
  const { metrics, sourcesAndUses, saleAnalysis, sensitivityTables } = results;

  const addressLine = propertyAddress
    ? `${propertyAddress.address || ""}, ${propertyAddress.city || ""}, ${propertyAddress.state || ""} ${propertyAddress.zipCode || ""}`.trim()
    : "N/A";
  const reportDate = new Date().toLocaleDateString();

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
  doc.text("Underwriting Report", margin, y);
  y += 18;

  // Meta info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const metaLines = [
    addressLine,
    `Report Date: ${reportDate}`,
    `${inputs.income.unitCount} units • Purchase: ${formatCurrency(inputs.acquisition.purchasePrice)} • Hold: ${inputs.acquisition.holdPeriodMonths} months`,
  ];

  metaLines.forEach((line) => {
    doc.text(line, margin, y);
    y += 14;
  });
  y += 6;

  // Key Metrics table
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Key Metrics", "Value"]],
    body: [
      ["IRR", formatPercent(metrics.irr)],
      ["Cash-on-Cash (Year 1)", formatPercent(metrics.cocYear1)],
      ["Equity Multiple", formatMultiple(metrics.equityMultiple)],
      ["DSCR", metrics.dscr.toFixed(2)],
      ["Breakeven Occupancy", formatPercent(metrics.breakevenOccupancy)],
      ["NOI (Stabilized Annual)", formatCurrency(metrics.stabilizedNoiAnnual)],
    ],
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fontStyle: "bold" },
  });

  let nextY = (((doc as any).lastAutoTable?.finalY as number | undefined) ?? y) + 18;

  // Red Flags
  if (redFlags.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Potential Concerns", margin, nextY);
    nextY += 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const maxWidth = doc.internal.pageSize.getWidth() - margin * 2 - 14;

    redFlags.forEach((flag) => {
      const lines = doc.splitTextToSize(flag, maxWidth) as string[];
      doc.text("•", margin, nextY);
      doc.text(lines, margin + 12, nextY);
      nextY += lines.length * 12 + 4;

      const pageBottom = doc.internal.pageSize.getHeight() - 60;
      if (nextY > pageBottom) {
        doc.addPage();
        nextY = 48;
      }
    });
    nextY += 6;
  }

  // Sources table
  autoTable(doc, {
    startY: nextY,
    margin: { left: margin, right: margin },
    head: [["Sources of Funds", "Amount"]],
    body: [
      ...(sourcesAndUses.sources.loanAmount > 0
        ? [["Loan Amount", formatCurrency(sourcesAndUses.sources.loanAmount)]]
        : []),
      ["Equity Required", formatCurrency(sourcesAndUses.sources.equity)],
      ["Total Sources", formatCurrency(sourcesAndUses.sources.total)],
    ],
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fontStyle: "bold" },
  });

  nextY = (((doc as any).lastAutoTable?.finalY as number | undefined) ?? nextY) + 14;

  // Uses table
  autoTable(doc, {
    startY: nextY,
    margin: { left: margin, right: margin },
    head: [["Uses of Funds", "Amount"]],
    body: [
      ["Purchase Price", formatCurrency(sourcesAndUses.uses.purchasePrice)],
      ["Closing Costs", formatCurrency(sourcesAndUses.uses.closingCosts)],
      ...(sourcesAndUses.uses.originationFee > 0
        ? [["Loan Origination", formatCurrency(sourcesAndUses.uses.originationFee)]]
        : []),
      ["Renovation Budget", formatCurrency(sourcesAndUses.uses.renoBudget)],
      ["Total Uses", formatCurrency(sourcesAndUses.uses.total)],
    ],
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fontStyle: "bold" },
  });

  // PAGE 2: Exit Analysis
  doc.addPage();
  y = 48;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Exit Analysis", margin, y);
  y += 14;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Exit Analysis", "Value"]],
    body: [
      ["Stabilized NOI", formatCurrency(saleAnalysis.stabilizedNoi)],
      ["Sale Price", formatCurrency(saleAnalysis.salePrice)],
      ["Sale Costs", formatCurrency(saleAnalysis.saleCosts)],
      ["Loan Payoff", formatCurrency(saleAnalysis.loanPayoff)],
      ["Net Proceeds", formatCurrency(saleAnalysis.netSaleProceeds)],
    ],
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fontStyle: "bold" },
  });

  // PAGE 3: Sensitivity Analysis
  doc.addPage();
  y = 48;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Sensitivity Analysis", margin, y);
  y += 14;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Rent Sensitivity", "IRR", "CoC"]],
    body: sensitivityTables.rent.map((r) => [r.label, formatPercent(r.irr), formatPercent(r.coc)]),
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fontStyle: "bold" },
  });

  y = (((doc as any).lastAutoTable?.finalY as number | undefined) ?? y) + 10;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Exit Cap Sensitivity", "IRR", "CoC"]],
    body: sensitivityTables.exitCap.map((r) => [r.label, formatPercent(r.irr), formatPercent(r.coc)]),
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fontStyle: "bold" },
  });

  y = (((doc as any).lastAutoTable?.finalY as number | undefined) ?? y) + 10;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Reno Budget Sensitivity", "IRR", "CoC"]],
    body: sensitivityTables.renoBudget.map((r) => [r.label, formatPercent(r.irr), formatPercent(r.coc)]),
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fontStyle: "bold" },
  });

  y = (((doc as any).lastAutoTable?.finalY as number | undefined) ?? y) + 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Metric Definitions", margin, y);
  y += 10;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Metric", "Definition"]],
    body: [
      ["IRR (Internal Rate of Return)", "Annualized rate at which cash flows equal the initial investment."],
      ["Cash-on-Cash Return", "Annual pre-tax cash flow divided by total equity invested."],
      ["Equity Multiple", "Total cash received divided by total cash invested."],
      ["DSCR (Debt Service Coverage Ratio)", "NOI divided by debt service. Lenders often require 1.20x+."],
    ],
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fontStyle: "bold" },
    columnStyles: { 1: { cellWidth: 560 } },
  });

  // PAGE 4: Annual Summary
  doc.addPage();
  y = 48;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("30-Year Annual Summary", margin, y);
  y += 10;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Year", "GPR", "EGI", "NOI", "Debt Service", "Cash Flow", "DSCR", "CoC"]],
    body: annualSummary.map((yr) => [
      String(yr.year),
      formatCurrency(yr.gpr),
      formatCurrency(yr.egi),
      formatCurrency(yr.noi),
      formatCurrency(yr.debtService),
      formatCurrency(yr.cashFlow),
      yr.dscr.toFixed(2),
      formatPercent(yr.coc),
    ]),
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fontStyle: "bold" },
  });

  // PAGE 5: Monthly Cash Flow
  doc.addPage();
  y = 48;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Monthly Cash Flow & Amortization", margin, y);
  y += 10;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [[
      "Mo", "Rent/Unit", "GPR", "EGI", "Opex", "NOI",
      "Debt", "Prin", "Int", "CapEx", "CF", "Balance",
    ]],
    body: monthlyData.map((m) => {
      const capex = m.renoSpend + m.makeReady + m.leasingCosts;
      return [
        String(m.month),
        formatCurrency(m.rent),
        formatCurrency(m.gpr),
        formatCurrency(m.egi),
        formatCurrency(m.totalOpex),
        formatCurrency(m.noi),
        formatCurrency(m.debtService),
        formatCurrency(m.principalPayment),
        formatCurrency(m.interestPayment),
        formatCurrency(capex),
        formatCurrency(m.cashFlowBeforeTax),
        formatCurrency(m.loanBalance),
      ];
    }),
    theme: "grid",
    styles: { fontSize: 6.5, cellPadding: 2 },
    headStyles: { fontStyle: "bold" },
  });

  // Save
  const fileBase = getFileBase(propertyAddress?.address);
  doc.save(`underwriting-report-${fileBase}.pdf`);
}
