import * as XLSX from "xlsx";
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
// EXCEL EXPORT (Real .xlsx using SheetJS)
// =============================================================================
export function exportToExcel(data: ExportData): void {
  const { inputs, results, monthlyData, annualSummary, propertyAddress } = data;
  const { metrics, sourcesAndUses, saleAnalysis, sensitivityTables } = results;

  const addressLine = propertyAddress
    ? `${propertyAddress.address || ""}, ${propertyAddress.city || ""}, ${propertyAddress.state || ""} ${propertyAddress.zipCode || ""}`.trim()
    : "N/A";
  const reportDate = new Date().toLocaleDateString();

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summaryData = [
    ["UNDERWRITING REPORT"],
    [],
    ["Property Address", addressLine],
    ["Report Date", reportDate],
    ["Units", inputs.income.unitCount],
    ["Purchase Price", inputs.acquisition.purchasePrice],
    ["Hold Period (months)", inputs.acquisition.holdPeriodMonths],
    [],
    ["KEY METRICS"],
    ["IRR", metrics.irr],
    ["Cash-on-Cash (Year 1)", metrics.cocYear1],
    ["Equity Multiple", metrics.equityMultiple],
    ["DSCR", metrics.dscr],
    ["Breakeven Occupancy", metrics.breakevenOccupancy],
    ["NOI (Stabilized Annual)", metrics.stabilizedNoiAnnual],
    [],
    ["SOURCES OF FUNDS"],
    ["Loan Amount", sourcesAndUses.sources.loanAmount],
    ["Equity Required", sourcesAndUses.sources.equity],
    ["Total Sources", sourcesAndUses.sources.total],
    [],
    ["USES OF FUNDS"],
    ["Purchase Price", sourcesAndUses.uses.purchasePrice],
    ["Closing Costs", sourcesAndUses.uses.closingCosts],
    ["Loan Origination", sourcesAndUses.uses.originationFee],
    ["Renovation Budget", sourcesAndUses.uses.renoBudget],
    ["Total Uses", sourcesAndUses.uses.total],
    [],
    ["EXIT ANALYSIS"],
    ["Stabilized NOI", saleAnalysis.stabilizedNoi],
    ["Sale Price", saleAnalysis.salePrice],
    ["Sale Costs", saleAnalysis.saleCosts],
    ["Loan Payoff", saleAnalysis.loanPayoff],
    ["Net Proceeds", saleAnalysis.netSaleProceeds],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Format currency columns
  const currencyRows = [5, 17, 18, 19, 22, 23, 24, 25, 26, 29, 30, 31, 32, 33];
  currencyRows.forEach(row => {
    const cell = wsSummary[`B${row}`];
    if (cell && typeof cell.v === "number") {
      cell.z = '"$"#,##0.00';
    }
  });
  
  // Format percentage rows
  const percentRows = [10, 11, 14];
  percentRows.forEach(row => {
    const cell = wsSummary[`B${row}`];
    if (cell && typeof cell.v === "number") {
      cell.z = "0.00%";
    }
  });

  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  // Sheet 2: Annual Summary
  const annualHeaders = ["Year", "GPR", "EGI", "NOI", "Debt Service", "Cash Flow", "DSCR", "CoC"];
  const annualRows = annualSummary.map(yr => [
    yr.year,
    yr.gpr,
    yr.egi,
    yr.noi,
    yr.debtService,
    yr.cashFlow,
    yr.dscr,
    yr.coc,
  ]);
  
  const wsAnnual = XLSX.utils.aoa_to_sheet([annualHeaders, ...annualRows]);
  
  // Apply formatting to annual sheet
  for (let i = 2; i <= annualRows.length + 1; i++) {
    ["B", "C", "D", "E", "F"].forEach(col => {
      const cell = wsAnnual[`${col}${i}`];
      if (cell) cell.z = '"$"#,##0.00';
    });
    const cocCell = wsAnnual[`H${i}`];
    if (cocCell) cocCell.z = "0.00%";
  }
  
  XLSX.utils.book_append_sheet(wb, wsAnnual, "Annual Summary");

  // Sheet 3: Monthly Cash Flow
  const monthlyHeaders = [
    "Month", "Rent/Unit", "GPR", "EGI", "OpEx", "NOI", 
    "Debt Service", "Principal", "Interest", "CapEx", "Cash Flow", "Loan Balance"
  ];
  const monthlyRows = monthlyData.map(m => [
    m.month,
    m.rent,
    m.gpr,
    m.egi,
    m.totalOpex,
    m.noi,
    m.debtService,
    m.principalPayment,
    m.interestPayment,
    m.renoSpend + m.makeReady + m.leasingCosts,
    m.cashFlowBeforeTax,
    m.loanBalance,
  ]);

  const wsMonthly = XLSX.utils.aoa_to_sheet([monthlyHeaders, ...monthlyRows]);
  
  // Apply currency formatting to monthly sheet
  for (let i = 2; i <= monthlyRows.length + 1; i++) {
    ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"].forEach(col => {
      const cell = wsMonthly[`${col}${i}`];
      if (cell) cell.z = '"$"#,##0.00';
    });
  }
  
  XLSX.utils.book_append_sheet(wb, wsMonthly, "Monthly Cash Flow");

  // Sheet 4: Sensitivity Analysis
  const sensitivityData = [
    ["RENT SENSITIVITY"],
    ["Scenario", "IRR", "CoC"],
    ...sensitivityTables.rent.map(r => [r.label, r.irr, r.coc]),
    [],
    ["EXIT CAP SENSITIVITY"],
    ["Scenario", "IRR", "CoC"],
    ...sensitivityTables.exitCap.map(r => [r.label, r.irr, r.coc]),
    [],
    ["RENO BUDGET SENSITIVITY"],
    ["Scenario", "IRR", "CoC"],
    ...sensitivityTables.renoBudget.map(r => [r.label, r.irr, r.coc]),
  ];
  
  const wsSensitivity = XLSX.utils.aoa_to_sheet(sensitivityData);
  XLSX.utils.book_append_sheet(wb, wsSensitivity, "Sensitivity");

  // Write and download
  const fileBase = getFileBase(propertyAddress?.address);
  XLSX.writeFile(wb, `underwriting-report-${fileBase}.xlsx`);
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
