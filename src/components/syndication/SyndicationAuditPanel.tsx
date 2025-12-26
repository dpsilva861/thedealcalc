import { useState } from "react";
import { useSyndication } from "@/contexts/SyndicationContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, RefreshCw, ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/calculators/types";
import { toast } from "sonner";
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Style constants matching other exports
const COLORS = {
  primary: "6B7F6E",
  secondary: "F5F1E9",
  headerBg: "6B7F6E",
  headerText: "FFFFFF",
  borderLight: "E0E0E0",
  text: "4A4A4A",
};

export default function SyndicationAuditPanel() {
  const { results } = useSyndication();
  const [generatingPDF, setGeneratingPDF] = useState(false);

  if (!results) return null;

  const { waterfall_allocations: allocations } = results;

  // =============================================================================
  // CSV EXPORT
  // =============================================================================
  const exportToCSV = () => {
    const headers = [
      "Period",
      "Cash Available",
      "LP ROC",
      "GP ROC",
      "LP Pref Accrual",
      "LP Pref Paid",
      "GP Catch-Up",
      "LP Tier Dist",
      "GP Tier Dist",
      "LP Total",
      "GP Total",
      "LP Unreturned Cap",
      "LP Pref Balance",
      "LP EM",
      "Active Tier",
    ];

    const rows = allocations.map((a) => [
      a.period,
      a.cash_available.toFixed(2),
      a.roc_lp.toFixed(2),
      a.roc_gp.toFixed(2),
      a.pref_accrual_lp.toFixed(2),
      a.pref_paid_lp.toFixed(2),
      a.catchup_paid_gp.toFixed(2),
      a.tier_distributions.reduce((s, t) => s + t.lp_amount, 0).toFixed(2),
      a.tier_distributions.reduce((s, t) => s + t.gp_amount, 0).toFixed(2),
      a.total_distributed_lp.toFixed(2),
      a.total_distributed_gp.toFixed(2),
      a.lp_unreturned_capital.toFixed(2),
      a.lp_pref_balance.toFixed(2),
      a.lp_equity_multiple.toFixed(3),
      a.tier_rationale,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "syndication_audit.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  // =============================================================================
  // EXCEL EXPORT
  // =============================================================================
  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "DealCalc";
      workbook.created = new Date();

      const sheet = workbook.addWorksheet("Waterfall Audit");

      // Setup columns
      sheet.columns = [
        { header: "Period", key: "period", width: 8 },
        { header: "Cash Available", key: "cash_available", width: 14 },
        { header: "LP ROC", key: "lp_roc", width: 12 },
        { header: "GP ROC", key: "gp_roc", width: 12 },
        { header: "LP Pref Accrual", key: "lp_pref_accrual", width: 14 },
        { header: "LP Pref Paid", key: "lp_pref_paid", width: 12 },
        { header: "GP Catch-Up", key: "gp_catchup", width: 12 },
        { header: "LP Tier Dist", key: "lp_tier", width: 12 },
        { header: "GP Tier Dist", key: "gp_tier", width: 12 },
        { header: "LP Total", key: "lp_total", width: 12 },
        { header: "GP Total", key: "gp_total", width: 12 },
        { header: "LP Unreturned Cap", key: "lp_unreturned", width: 16 },
        { header: "LP Pref Balance", key: "lp_pref_balance", width: 14 },
        { header: "LP EM", key: "lp_em", width: 10 },
        { header: "Active Tier", key: "tier", width: 24 },
      ];

      // Style header row
      const headerRow = sheet.getRow(1);
      headerRow.eachCell((cell) => {
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
      headerRow.height = 24;

      // Add data rows
      allocations.forEach((a, idx) => {
        const lpTier = a.tier_distributions.reduce((s, t) => s + t.lp_amount, 0);
        const gpTier = a.tier_distributions.reduce((s, t) => s + t.gp_amount, 0);

        const row = sheet.addRow({
          period: a.period,
          cash_available: a.cash_available,
          lp_roc: a.roc_lp,
          gp_roc: a.roc_gp,
          lp_pref_accrual: a.pref_accrual_lp,
          lp_pref_paid: a.pref_paid_lp,
          gp_catchup: a.catchup_paid_gp,
          lp_tier: lpTier,
          gp_tier: gpTier,
          lp_total: a.total_distributed_lp,
          gp_total: a.total_distributed_gp,
          lp_unreturned: a.lp_unreturned_capital,
          lp_pref_balance: a.lp_pref_balance,
          lp_em: a.lp_equity_multiple,
          tier: a.tier_rationale || "-",
        });

        // Apply alternating row styles
        const isAlternate = idx % 2 === 1;
        row.eachCell((cell, colNumber) => {
          cell.font = { name: "Calibri", size: 10, color: { argb: COLORS.text } };
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

          // Format currency columns
          if (colNumber >= 2 && colNumber <= 13) {
            cell.numFmt = '"$"#,##0';
            cell.alignment = { horizontal: "right", vertical: "middle" };
          }
          // Format EM column
          if (colNumber === 14) {
            cell.numFmt = "0.00";
            cell.alignment = { horizontal: "right", vertical: "middle" };
          }
        });
        row.height = 18;
      });

      // Freeze header row
      sheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];

      // Page setup for printing
      sheet.pageSetup = {
        paperSize: 1 as unknown as ExcelJS.PaperSize,
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
        printTitlesRow: "1:1",
      };

      sheet.headerFooter = {
        oddHeader: "&C&\"Calibri,Bold\"&12DealCalc – Syndication Waterfall Audit",
        oddFooter: "&L&D &C&P of &N &R&\"Calibri\"DealCalc.com",
      };

      // Download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "syndication_audit.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Excel file exported successfully");
    } catch (err) {
      console.error("Excel export failed:", err);
      toast.error("Failed to export Excel file");
    }
  };

  // =============================================================================
  // PDF EXPORT
  // =============================================================================
  const exportToPDF = async () => {
    if (generatingPDF) return;
    setGeneratingPDF(true);

    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "letter",
      });

      const margin = 30;
      let y = 36;

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Syndication Waterfall Audit", margin, y);
      y += 16;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`, margin, y);
      doc.text(`Total Periods: ${allocations.length}`, margin + 200, y);
      y += 20;

      // Prepare table data
      const tableHeaders = [
        "Period",
        "Cash Avail",
        "LP ROC",
        "GP ROC",
        "LP Pref",
        "GP Catch",
        "LP Tier",
        "GP Tier",
        "LP Unret",
        "LP EM",
        "Tier",
      ];

      const tableData = allocations.map((a) => {
        const lpTier = a.tier_distributions.reduce((s, t) => s + t.lp_amount, 0);
        const gpTier = a.tier_distributions.reduce((s, t) => s + t.gp_amount, 0);

        return [
          a.period.toString(),
          a.cash_available > 0 ? formatCurrency(a.cash_available) : "-",
          a.roc_lp > 0 ? formatCurrency(a.roc_lp) : "-",
          a.roc_gp > 0 ? formatCurrency(a.roc_gp) : "-",
          a.pref_paid_lp > 0 ? formatCurrency(a.pref_paid_lp) : "-",
          a.catchup_paid_gp > 0 ? formatCurrency(a.catchup_paid_gp) : "-",
          lpTier > 0 ? formatCurrency(lpTier) : "-",
          gpTier > 0 ? formatCurrency(gpTier) : "-",
          formatCurrency(a.lp_unreturned_capital),
          a.lp_equity_multiple.toFixed(2) + "x",
          (a.tier_rationale || "-").substring(0, 20),
        ];
      });

      // Generate table
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [tableHeaders],
        body: tableData,
        theme: "grid",
        styles: {
          fontSize: 7,
          cellPadding: 2,
          overflow: "ellipsize",
          halign: "right",
        },
        headStyles: {
          fontStyle: "bold",
          fillColor: [107, 127, 110],
          textColor: [255, 255, 255],
          halign: "center",
          fontSize: 7,
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 35 },
          1: { cellWidth: 55 },
          2: { cellWidth: 50 },
          3: { cellWidth: 50 },
          4: { cellWidth: 50 },
          5: { cellWidth: 50 },
          6: { cellWidth: 50 },
          7: { cellWidth: 50 },
          8: { cellWidth: 60 },
          9: { cellWidth: 40 },
          10: { halign: "left", cellWidth: "auto" },
        },
        alternateRowStyles: {
          fillColor: [245, 241, 233],
        },
        didDrawPage: (data) => {
          // Footer on each page
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 20,
            { align: "center" }
          );
          doc.text("DealCalc.com", doc.internal.pageSize.width - margin, doc.internal.pageSize.height - 20, {
            align: "right",
          });
        },
      });

      // Save
      doc.save("syndication_audit.pdf");
      toast.success("PDF exported successfully");
    } catch (err) {
      console.error("PDF export failed:", err);
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Show first 60 periods for display (5 years monthly)
  const displayAllocations = allocations.slice(0, 61);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Audit Mode
            </CardTitle>
            <CardDescription>Period-by-period waterfall allocations with full traceability</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToPDF} disabled={generatingPDF}>
                {generatingPDF ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating PDF…
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToExcel}>
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Every dollar is traced: Cash Available = LP Dist + GP Dist. ROC reduces unreturned capital. Pref accrues
          monthly on unreturned capital. Tiers activate when LP EM crosses hurdle.
        </p>

        <div className="overflow-x-auto max-h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Period</TableHead>
                <TableHead className="text-right">Cash Avail</TableHead>
                <TableHead className="text-right">LP ROC</TableHead>
                <TableHead className="text-right">GP ROC</TableHead>
                <TableHead className="text-right">LP Pref</TableHead>
                <TableHead className="text-right">GP CatchUp</TableHead>
                <TableHead className="text-right">LP Tier</TableHead>
                <TableHead className="text-right">GP Tier</TableHead>
                <TableHead className="text-right">LP Unret</TableHead>
                <TableHead className="text-right">LP EM</TableHead>
                <TableHead>Tier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayAllocations.map((a) => {
                const lpTier = a.tier_distributions.reduce((s, t) => s + t.lp_amount, 0);
                const gpTier = a.tier_distributions.reduce((s, t) => s + t.gp_amount, 0);

                return (
                  <TableRow key={a.period} className={a.period === 0 ? "bg-muted/30" : ""}>
                    <TableCell className="font-mono">{a.period}</TableCell>
                    <TableCell className="text-right font-mono">
                      {a.cash_available > 0 ? formatCurrency(a.cash_available) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {a.roc_lp > 0 ? formatCurrency(a.roc_lp) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {a.roc_gp > 0 ? formatCurrency(a.roc_gp) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {a.pref_paid_lp > 0 ? formatCurrency(a.pref_paid_lp) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {a.catchup_paid_gp > 0 ? formatCurrency(a.catchup_paid_gp) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">{lpTier > 0 ? formatCurrency(lpTier) : "-"}</TableCell>
                    <TableCell className="text-right font-mono">{gpTier > 0 ? formatCurrency(gpTier) : "-"}</TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatCurrency(a.lp_unreturned_capital)}
                    </TableCell>
                    <TableCell className="text-right font-mono">{a.lp_equity_multiple.toFixed(2)}x</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-32 truncate">
                      {a.tier_rationale || "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {allocations.length > 61 && (
          <p className="text-xs text-muted-foreground mt-2">
            Showing first 61 periods. Export for full data ({allocations.length} periods).
          </p>
        )}
      </CardContent>
    </Card>
  );
}
