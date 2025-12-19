import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useUnderwriting, PropertyAddress } from "@/contexts/UnderwritingContext";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import {
  formatCurrency,
  formatPercent,
  formatMultiple,
  runUnderwriting,
  runUnderwritingNoSensitivity,
  UnderwritingResults,
  UnderwritingInputs,
} from "@/lib/underwriting";
import {
  ArrowLeft,
  Download,
  TrendingUp,
  DollarSign,
  Percent,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Save,
  MapPin,
  FolderOpen,
  FileSpreadsheet,
  Lock,
  Edit,
  List,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

function ResultsContent() {
  const navigate = useNavigate();
  const { inputs, propertyAddress } = useUnderwriting();
  const { user, isSubscribed } = useAuth();

  const [baseResults, setBaseResults] = useState<UnderwritingResults | null>(null);
  const [outlookResults, setOutlookResults] = useState<UnderwritingResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFromSaved, setIsFromSaved] = useState(false);
  const [displayAddress, setDisplayAddress] = useState<PropertyAddress | null>(null);
  const [displayInputs, setDisplayInputs] = useState<UnderwritingInputs | null>(null);
  

  // Check if viewing a saved analysis
  useEffect(() => {
    const savedAnalysisStr = sessionStorage.getItem("uw:savedAnalysis");
    if (savedAnalysisStr) {
      try {
        const savedAnalysis = JSON.parse(savedAnalysisStr);
        sessionStorage.removeItem("uw:savedAnalysis");
        
        setIsFromSaved(true);
        setIsSaved(true);
        setDisplayAddress({
          address: savedAnalysis.address,
          city: savedAnalysis.city || "",
          state: savedAnalysis.state || "",
          zipCode: savedAnalysis.zip_code,
        });
        setDisplayInputs(savedAnalysis.inputs as UnderwritingInputs);
        
        // Compute results from saved inputs
        const savedInputs = savedAnalysis.inputs as UnderwritingInputs;
        const base = runUnderwriting(savedInputs);
        const outlookMonths = 360;
        const outlook = savedInputs.acquisition.holdPeriodMonths >= outlookMonths
          ? base
          : runUnderwritingNoSensitivity({
              ...savedInputs,
              acquisition: { ...savedInputs.acquisition, holdPeriodMonths: outlookMonths },
            });
        setBaseResults(base);
        setOutlookResults(outlook);
      } catch (e) {
        console.error("Failed to parse saved analysis:", e);
        sessionStorage.removeItem("uw:savedAnalysis");
      }
    }
  }, []);

  // Compute results from context inputs if not from saved
  useEffect(() => {
    if (isFromSaved) return;
    
    setError(null);
    setDisplayAddress(propertyAddress);
    setDisplayInputs(inputs);

    try {
      const base = runUnderwriting(inputs);
      const outlookMonths = 360;
      const outlook =
        inputs.acquisition.holdPeriodMonths >= outlookMonths
          ? base
          : runUnderwritingNoSensitivity({
              ...inputs,
              acquisition: { ...inputs.acquisition, holdPeriodMonths: outlookMonths },
            });

      setBaseResults(base);
      setOutlookResults(outlook);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      console.error("Underwriting report generation failed:", e);
      setError(message);
    }
  }, [inputs, propertyAddress, isFromSaved]);

  // Clear any stale auto-print flag (print is now manual via Export dropdown)
  useEffect(() => {
    sessionStorage.removeItem("uw:autoPrint");
  }, []);

  // Auto-save new analyses
  useEffect(() => {
    if (!baseResults || !displayAddress || !displayInputs || isSaved || isFromSaved) return;
    if (!displayAddress.zipCode) return;
    
    handleSaveAnalysis();
  }, [baseResults, displayAddress, displayInputs, isSaved, isFromSaved]);

  const handleSaveAnalysis = async () => {
    if (!user || !baseResults || !displayAddress || !displayInputs) return;
    if (!displayAddress.address || !displayAddress.zipCode) {
      toast.error("Missing address information");
      return;
    }

    setSaving(true);
    try {
      // Save analysis
      const { error: saveError } = await supabase.from("saved_analyses").insert([{
        user_id: user.id,
        address: displayAddress.address,
        city: displayAddress.city || null,
        state: displayAddress.state || null,
        zip_code: displayAddress.zipCode,
        inputs: JSON.parse(JSON.stringify(displayInputs)) as Json,
        results: JSON.parse(JSON.stringify(baseResults)) as Json,
      }]);

      if (saveError) throw saveError;

      // Track ZIP code (fire and forget)
      supabase.functions.invoke("track-zip", {
        body: {
          zip_code: displayAddress.zipCode,
          city: displayAddress.city,
          state: displayAddress.state,
        },
      }).catch((err) => console.error("ZIP tracking failed:", err));

      setIsSaved(true);
      toast.success("Analysis saved");
    } catch (err) {
      console.error("Failed to save analysis:", err);
      toast.error("Failed to save analysis");
    } finally {
      setSaving(false);
    }
  };

  const currentInputs = displayInputs || inputs;

  // Show loading state while results are being computed
  if (!baseResults || !outlookResults) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-cream-dark flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Generating analysis...</p>
        </div>
      </div>
    );
  }

  const results = baseResults;
  const monthlyData = outlookResults.monthlyData;
  const annualSummary = outlookResults.annualSummary;

  const { metrics, sourcesAndUses, saleAnalysis, sensitivityTables } = results;

  const keyMetrics = [
    { 
      label: "IRR", 
      value: formatPercent(metrics.irr), 
      icon: TrendingUp,
      description: "Internal Rate of Return (Annualized)"
    },
    { 
      label: "Cash-on-Cash (Year 1)", 
      value: formatPercent(metrics.cocYear1), 
      icon: DollarSign,
      description: "First year cash return on equity"
    },
    { 
      label: "Equity Multiple", 
      value: formatMultiple(metrics.equityMultiple), 
      icon: BarChart3,
      description: "Total return / Initial equity"
    },
    { 
      label: "DSCR", 
      value: metrics.dscr.toFixed(2), 
      icon: Percent,
      description: "Debt Service Coverage Ratio"
    },
  ];

  const handleExportPDF = async () => {
    if (generatingPDF) return;

    setGeneratingPDF(true);
    try {
      const addressLine = displayAddress
        ? `${displayAddress.address || ""}, ${displayAddress.city || ""}, ${displayAddress.state || ""} ${displayAddress.zipCode || ""}`.trim()
        : "N/A";
      const reportDate = new Date().toLocaleDateString();

      const fileBase = (displayAddress?.address || "analysis")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "letter",
      });

      const margin = 40;
      let y = 48;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Underwriting Report", margin, y);
      y += 18;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const metaLines = [
        addressLine,
        `Report Date: ${reportDate}`,
        `${currentInputs.income.unitCount} units • Purchase: ${formatCurrency(currentInputs.acquisition.purchasePrice)} • Hold: ${currentInputs.acquisition.holdPeriodMonths} months`,
      ];

      metaLines.forEach((line) => {
        doc.text(line, margin, y);
        y += 14;
      });

      y += 6;

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

      nextY = (((doc as any).lastAutoTable?.finalY as number | undefined) ?? nextY) + 14;

      autoTable(doc, {
        startY: nextY,
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

      // PAGE 2
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
        body: sensitivityTables.rent.map((r) => [
          r.label,
          formatPercent(r.irr),
          formatPercent(r.coc),
        ]),
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fontStyle: "bold" },
      });

      y = (((doc as any).lastAutoTable?.finalY as number | undefined) ?? y) + 10;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Exit Cap Sensitivity", "IRR", "CoC"]],
        body: sensitivityTables.exitCap.map((r) => [
          r.label,
          formatPercent(r.irr),
          formatPercent(r.coc),
        ]),
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fontStyle: "bold" },
      });

      y = (((doc as any).lastAutoTable?.finalY as number | undefined) ?? y) + 10;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Reno Budget Sensitivity", "IRR", "CoC"]],
        body: sensitivityTables.renoBudget.map((r) => [
          r.label,
          formatPercent(r.irr),
          formatPercent(r.coc),
        ]),
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
          [
            "IRR (Internal Rate of Return)",
            "Annualized rate at which cash flows equal the initial investment.",
          ],
          [
            "Cash-on-Cash Return",
            "Annual pre-tax cash flow divided by total equity invested.",
          ],
          ["Equity Multiple", "Total cash received divided by total cash invested."],
          [
            "DSCR (Debt Service Coverage Ratio)",
            "NOI divided by debt service. Lenders often require 1.20x+.",
          ],
        ],
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fontStyle: "bold" },
        columnStyles: { 1: { cellWidth: 560 } },
      });

      // PAGE 3+
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

      y = (((doc as any).lastAutoTable?.finalY as number | undefined) ?? y) + 16;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Monthly Cash Flow & Amortization", margin, y);
      y += 10;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [[
          "Mo",
          "Rent/Unit",
          "GPR",
          "EGI",
          "Opex",
          "NOI",
          "Debt",
          "Prin",
          "Int",
          "CapEx",
          "CF",
          "Balance",
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

      doc.save(`underwriting-report-${fileBase || "analysis"}.pdf`);
      toast.success("PDF downloaded");
    } catch (err) {
      console.error("PDF export failed:", err);
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleExportCSV = () => {
    if (!isSubscribed) {
      toast.error("CSV export is a Pro feature", {
        action: {
          label: "Upgrade",
          onClick: () => navigate("/pricing"),
        },
      });
      return;
    }

    const addressLine = displayAddress ? `${displayAddress.address || ""}, ${displayAddress.city || ""}, ${displayAddress.state || ""} ${displayAddress.zipCode || ""}`.trim() : "N/A";
    const reportDate = new Date().toLocaleDateString();
    
    // Build comprehensive CSV with property info and metrics
    let csvLines: string[] = [];
    
    // Header section
    csvLines.push("UNDERWRITING REPORT");
    csvLines.push(`Property Address,${addressLine}`);
    csvLines.push(`Report Date,${reportDate}`);
    csvLines.push(`Units,${currentInputs.income.unitCount}`);
    csvLines.push(`Purchase Price,${formatCurrency(currentInputs.acquisition.purchasePrice)}`);
    csvLines.push(`Hold Period,${currentInputs.acquisition.holdPeriodMonths} months`);
    csvLines.push("");
    
    // Key Metrics section
    csvLines.push("KEY METRICS");
    csvLines.push(`IRR,${formatPercent(metrics.irr)}`);
    csvLines.push(`Cash-on-Cash (Year 1),${formatPercent(metrics.cocYear1)}`);
    csvLines.push(`Equity Multiple,${formatMultiple(metrics.equityMultiple)}`);
    csvLines.push(`DSCR,${metrics.dscr.toFixed(2)}`);
    csvLines.push(`Breakeven Occupancy,${formatPercent(metrics.breakevenOccupancy)}`);
    csvLines.push(`NOI (Stabilized Annual),${formatCurrency(metrics.stabilizedNoiAnnual)}`);
    csvLines.push("");
    
    // Sources & Uses
    csvLines.push("SOURCES OF FUNDS");
    csvLines.push(`Loan Amount,${formatCurrency(sourcesAndUses.sources.loanAmount)}`);
    csvLines.push(`Equity Required,${formatCurrency(sourcesAndUses.sources.equity)}`);
    csvLines.push(`Total Sources,${formatCurrency(sourcesAndUses.sources.total)}`);
    csvLines.push("");
    csvLines.push("USES OF FUNDS");
    csvLines.push(`Purchase Price,${formatCurrency(sourcesAndUses.uses.purchasePrice)}`);
    csvLines.push(`Closing Costs,${formatCurrency(sourcesAndUses.uses.closingCosts)}`);
    csvLines.push(`Renovation Budget,${formatCurrency(sourcesAndUses.uses.renoBudget)}`);
    csvLines.push(`Total Uses,${formatCurrency(sourcesAndUses.uses.total)}`);
    csvLines.push("");
    
    // Monthly Cash Flow Schedule
    csvLines.push("MONTHLY CASH FLOW SCHEDULE");
    const headers = ["Month", "Rent/Unit", "GPR", "EGI", "OpEx", "NOI", "Debt Service", "Principal", "Interest", "CapEx", "Cash Flow", "Loan Balance"];
    csvLines.push(headers.join(","));
    
    monthlyData.forEach(m => {
      csvLines.push([
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
        m.loanBalance.toFixed(2),
      ].join(","));
    });

    const csvContent = csvLines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `underwriting-report-${displayAddress?.address?.replace(/\s+/g, "-") || "analysis"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  const handleExportExcel = () => {
    if (!isSubscribed) {
      toast.error("Excel export is a Pro feature", {
        action: {
          label: "Upgrade",
          onClick: () => navigate("/pricing"),
        },
      });
      return;
    }

    const addressLine = displayAddress ? `${displayAddress.address || ""}, ${displayAddress.city || ""}, ${displayAddress.state || ""} ${displayAddress.zipCode || ""}`.trim() : "N/A";
    const reportDate = new Date().toLocaleDateString();

    // Build Excel-compatible XML (SpreadsheetML) with styles and multiple worksheets
    let xmlContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1" ss:Size="12"/>
      <Interior ss:Color="#6B7F6E" ss:Pattern="Solid"/>
      <Font ss:Color="#FFFFFF"/>
    </Style>
    <Style ss:ID="Title">
      <Font ss:Bold="1" ss:Size="14"/>
    </Style>
    <Style ss:ID="SectionHeader">
      <Font ss:Bold="1" ss:Size="11"/>
      <Interior ss:Color="#F5F1E9" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Currency">
      <NumberFormat ss:Format="&quot;$&quot;#,##0.00"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Summary">
    <Table>
      <Column ss:Width="150"/>
      <Column ss:Width="150"/>
      <Row><Cell ss:StyleID="Title"><Data ss:Type="String">UNDERWRITING REPORT</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Property Address</Data></Cell><Cell><Data ss:Type="String">${addressLine}</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Report Date</Data></Cell><Cell><Data ss:Type="String">${reportDate}</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Units</Data></Cell><Cell><Data ss:Type="Number">${currentInputs.income.unitCount}</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Purchase Price</Data></Cell><Cell ss:StyleID="Currency"><Data ss:Type="Number">${currentInputs.acquisition.purchasePrice}</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Hold Period (months)</Data></Cell><Cell><Data ss:Type="Number">${currentInputs.acquisition.holdPeriodMonths}</Data></Cell></Row>
      <Row></Row>
      <Row><Cell ss:StyleID="SectionHeader"><Data ss:Type="String">KEY METRICS</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">IRR</Data></Cell><Cell><Data ss:Type="String">${formatPercent(metrics.irr)}</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Cash-on-Cash (Year 1)</Data></Cell><Cell><Data ss:Type="String">${formatPercent(metrics.cocYear1)}</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Equity Multiple</Data></Cell><Cell><Data ss:Type="String">${formatMultiple(metrics.equityMultiple)}</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">DSCR</Data></Cell><Cell><Data ss:Type="Number">${metrics.dscr.toFixed(2)}</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Breakeven Occupancy</Data></Cell><Cell><Data ss:Type="String">${formatPercent(metrics.breakevenOccupancy)}</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">NOI (Stabilized Annual)</Data></Cell><Cell ss:StyleID="Currency"><Data ss:Type="Number">${metrics.stabilizedNoiAnnual}</Data></Cell></Row>
      <Row></Row>
      <Row><Cell ss:StyleID="SectionHeader"><Data ss:Type="String">SOURCES OF FUNDS</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Loan Amount</Data></Cell><Cell ss:StyleID="Currency"><Data ss:Type="Number">${sourcesAndUses.sources.loanAmount}</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Equity Required</Data></Cell><Cell ss:StyleID="Currency"><Data ss:Type="Number">${sourcesAndUses.sources.equity}</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Total Sources</Data></Cell><Cell ss:StyleID="Currency"><Data ss:Type="Number">${sourcesAndUses.sources.total}</Data></Cell></Row>
      <Row></Row>
      <Row><Cell ss:StyleID="SectionHeader"><Data ss:Type="String">USES OF FUNDS</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Purchase Price</Data></Cell><Cell ss:StyleID="Currency"><Data ss:Type="Number">${sourcesAndUses.uses.purchasePrice}</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Closing Costs</Data></Cell><Cell ss:StyleID="Currency"><Data ss:Type="Number">${sourcesAndUses.uses.closingCosts}</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Renovation Budget</Data></Cell><Cell ss:StyleID="Currency"><Data ss:Type="Number">${sourcesAndUses.uses.renoBudget}</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Total Uses</Data></Cell><Cell ss:StyleID="Currency"><Data ss:Type="Number">${sourcesAndUses.uses.total}</Data></Cell></Row>
    </Table>
  </Worksheet>
  <Worksheet ss:Name="Cash Flow">
    <Table>
      <Row ss:StyleID="Header">
        <Cell><Data ss:Type="String">Month</Data></Cell>
        <Cell><Data ss:Type="String">Rent/Unit</Data></Cell>
        <Cell><Data ss:Type="String">GPR</Data></Cell>
        <Cell><Data ss:Type="String">EGI</Data></Cell>
        <Cell><Data ss:Type="String">OpEx</Data></Cell>
        <Cell><Data ss:Type="String">NOI</Data></Cell>
        <Cell><Data ss:Type="String">Debt Service</Data></Cell>
        <Cell><Data ss:Type="String">Principal</Data></Cell>
        <Cell><Data ss:Type="String">Interest</Data></Cell>
        <Cell><Data ss:Type="String">CapEx</Data></Cell>
        <Cell><Data ss:Type="String">Cash Flow</Data></Cell>
        <Cell><Data ss:Type="String">Loan Balance</Data></Cell>
      </Row>`;

    monthlyData.forEach(m => {
      xmlContent += `
      <Row>
        <Cell><Data ss:Type="Number">${m.month}</Data></Cell>
        <Cell ss:StyleID="Currency"><Data ss:Type="Number">${m.rent}</Data></Cell>
        <Cell ss:StyleID="Currency"><Data ss:Type="Number">${m.gpr}</Data></Cell>
        <Cell ss:StyleID="Currency"><Data ss:Type="Number">${m.egi}</Data></Cell>
        <Cell ss:StyleID="Currency"><Data ss:Type="Number">${m.totalOpex}</Data></Cell>
        <Cell ss:StyleID="Currency"><Data ss:Type="Number">${m.noi}</Data></Cell>
        <Cell ss:StyleID="Currency"><Data ss:Type="Number">${m.debtService}</Data></Cell>
        <Cell ss:StyleID="Currency"><Data ss:Type="Number">${m.principalPayment}</Data></Cell>
        <Cell ss:StyleID="Currency"><Data ss:Type="Number">${m.interestPayment}</Data></Cell>
        <Cell ss:StyleID="Currency"><Data ss:Type="Number">${m.renoSpend + m.makeReady + m.leasingCosts}</Data></Cell>
        <Cell ss:StyleID="Currency"><Data ss:Type="Number">${m.cashFlowBeforeTax}</Data></Cell>
        <Cell ss:StyleID="Currency"><Data ss:Type="Number">${m.loanBalance}</Data></Cell>
      </Row>`;
    });

    xmlContent += `
    </Table>
  </Worksheet>
</Workbook>`;

    const blob = new Blob([xmlContent], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `underwriting-report-${displayAddress?.address?.replace(/\s+/g, "-") || "analysis"}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel file exported successfully");
  };

  const handleEditInputs = () => {
    if (!isSubscribed && isFromSaved) {
      toast.error("Editing saved analyses is a Pro feature", {
        action: {
          label: "Upgrade",
          onClick: () => navigate("/pricing"),
        },
      });
      return;
    }
    navigate("/underwrite");
  };

  // Red flags / breakpoints
  const redFlags: string[] = [];
  if (metrics.dscr < 1.2 && metrics.dscr > 0) {
    redFlags.push(`DSCR of ${metrics.dscr.toFixed(2)} is below typical lender requirement of 1.20`);
  }
  if (metrics.breakevenOccupancy > 90) {
    redFlags.push(`Breakeven occupancy of ${formatPercent(metrics.breakevenOccupancy)} is very high`);
  }
  if (metrics.irr < 0) {
    redFlags.push("Negative IRR indicates a loss on this investment");
  }
  if (metrics.cocYear1 < 0) {
    redFlags.push("Negative Year 1 cash-on-cash indicates cash shortfall");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-cream-dark print:bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background print:hidden">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleEditInputs}>
                <Edit className="h-4 w-4 mr-2" />
                {isFromSaved ? "Edit & Recalculate" : "Edit Inputs"}
                {!isSubscribed && isFromSaved && <Lock className="h-3 w-3 ml-1" />}
              </Button>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">
                  Underwriting Report
                </h1>
                <p className="text-muted-foreground text-sm">
                  {inputs.income.unitCount} units • {inputs.acquisition.holdPeriodMonths} month hold
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/saved")}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Saved Analyses
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="hero">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem 
                    onClick={handleExportPDF}
                    disabled={generatingPDF}
                    className="transition-colors"
                  >
                    {generatingPDF ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        <span className="text-muted-foreground">Generating PDF…</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF (Free)
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Pro Exports
                  </div>
                  <DropdownMenuItem onClick={handleExportCSV}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export CSV
                    {!isSubscribed && <Lock className="h-3 w-3 ml-auto text-muted-foreground" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportExcel}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export Excel (with styling)
                    {!isSubscribed && <Lock className="h-3 w-3 ml-auto text-muted-foreground" />}
                  </DropdownMenuItem>
                  {!isSubscribed && (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground border-t mt-1 pt-1">
                      Upgrade to Pro for spreadsheet exports
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Print Header with Table of Contents */}
      <div className="hidden print:block p-8 border-b">
        <h1 className="font-display text-3xl font-bold">Underwriting Report</h1>
        <p className="text-muted-foreground mb-6">
          {displayAddress?.address && `${displayAddress.address}, `}
          {displayAddress?.city && `${displayAddress.city}, `}
          {displayAddress?.state && `${displayAddress.state} `}
          {displayAddress?.zipCode}
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          {inputs.income.unitCount} units • {formatCurrency(inputs.acquisition.purchasePrice)} • {inputs.acquisition.holdPeriodMonths} month hold
        </p>
        
        {/* Table of Contents */}
        <div className="border rounded-lg p-4 bg-muted/20">
          <div className="flex items-center gap-2 mb-3">
            <List className="h-4 w-4" />
            <h2 className="font-semibold">Table of Contents</h2>
          </div>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>Key Metrics & Investment Summary</li>
            <li>Sources & Uses of Funds</li>
            <li>Exit Analysis</li>
            <li>Sensitivity Analysis (Rent, Exit Cap, Reno Budget)</li>
            <li>Metric Definitions</li>
            <li>30-Year Annual Summary</li>
            <li>Monthly Cash Flow & Amortization Schedule</li>
          </ol>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* PAGE 1: Key Metrics, Sources & Uses, Exit Analysis */}
        <div className="print:break-after-page">
          {/* Key Metrics */}
          <section className="mb-8">
            <h2 className="font-display text-xl font-bold text-foreground mb-4">
              Key Metrics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {keyMetrics.map((metric) => (
                <div 
                  key={metric.label}
                  className="p-5 rounded-xl bg-card border border-border shadow-card"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <metric.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">{metric.label}</span>
                  </div>
                  <div className="text-2xl font-display font-bold text-foreground">
                    {metric.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metric.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Red Flags */}
          {redFlags.length > 0 && (
            <section className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 mb-8">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h3 className="font-semibold text-foreground">Potential Concerns</h3>
              </div>
              <ul className="space-y-2">
                {redFlags.map((flag, i) => (
                  <li key={i} className="text-sm text-destructive flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    {flag}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Sources & Uses */}
          <section className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="p-5 rounded-xl bg-card border border-border shadow-card">
              <h3 className="font-semibold text-foreground mb-4">Sources</h3>
              <dl className="space-y-3">
                {sourcesAndUses.sources.loanAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <dt className="text-muted-foreground">Loan</dt>
                    <dd className="font-medium">{formatCurrency(sourcesAndUses.sources.loanAmount)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <dt className="text-muted-foreground">Equity</dt>
                  <dd className="font-medium">{formatCurrency(sourcesAndUses.sources.equity)}</dd>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <dt className="font-semibold text-foreground">Total</dt>
                  <dd className="font-bold text-primary">{formatCurrency(sourcesAndUses.sources.total)}</dd>
                </div>
              </dl>
            </div>

            <div className="p-5 rounded-xl bg-card border border-border shadow-card">
              <h3 className="font-semibold text-foreground mb-4">Uses</h3>
              <dl className="space-y-3">
                <div className="flex justify-between text-sm">
                  <dt className="text-muted-foreground">Purchase Price</dt>
                  <dd className="font-medium">{formatCurrency(sourcesAndUses.uses.purchasePrice)}</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-muted-foreground">Closing Costs</dt>
                  <dd className="font-medium">{formatCurrency(sourcesAndUses.uses.closingCosts)}</dd>
                </div>
                {sourcesAndUses.uses.originationFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <dt className="text-muted-foreground">Loan Origination</dt>
                    <dd className="font-medium">{formatCurrency(sourcesAndUses.uses.originationFee)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <dt className="text-muted-foreground">Renovation</dt>
                  <dd className="font-medium">{formatCurrency(sourcesAndUses.uses.renoBudget)}</dd>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <dt className="font-semibold text-foreground">Total</dt>
                  <dd className="font-bold text-primary">{formatCurrency(sourcesAndUses.uses.total)}</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Exit Analysis */}
          <section className="p-5 rounded-xl bg-card border border-border shadow-card">
            <h3 className="font-semibold text-foreground mb-4">Exit Analysis</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Stabilized NOI</p>
                <p className="font-semibold text-foreground">{formatCurrency(saleAnalysis.stabilizedNoi)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sale Price</p>
                <p className="font-semibold text-foreground">{formatCurrency(saleAnalysis.salePrice)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sale Costs</p>
                <p className="font-semibold text-foreground">{formatCurrency(saleAnalysis.saleCosts)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Loan Payoff</p>
                <p className="font-semibold text-foreground">{formatCurrency(saleAnalysis.loanPayoff)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Proceeds</p>
                <p className="font-bold text-primary">{formatCurrency(saleAnalysis.netSaleProceeds)}</p>
              </div>
            </div>
          </section>
        </div>

        {/* PAGE 2: Sensitivity Tables */}
        <div className="print:break-before-page print:break-after-page">
          <h2 className="font-display text-xl font-bold text-foreground mb-6 print:pt-4">
            Sensitivity Analysis
          </h2>
          <section className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="p-5 rounded-xl bg-card border border-border shadow-card">
              <h3 className="font-semibold text-foreground mb-4">Rent Sensitivity</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-muted-foreground font-medium">Change</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">IRR</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">CoC</th>
                  </tr>
                </thead>
                <tbody>
                  {sensitivityTables.rent.map((row) => (
                    <tr key={row.label} className={row.label === "Base" ? "bg-sage-light" : ""}>
                      <td className="py-2">{row.label}</td>
                      <td className="text-right py-2">{formatPercent(row.irr)}</td>
                      <td className="text-right py-2">{formatPercent(row.coc)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-5 rounded-xl bg-card border border-border shadow-card">
              <h3 className="font-semibold text-foreground mb-4">Exit Cap Sensitivity</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-muted-foreground font-medium">Change</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">IRR</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">CoC</th>
                  </tr>
                </thead>
                <tbody>
                  {sensitivityTables.exitCap.map((row) => (
                    <tr key={row.label} className={row.label === "Base" ? "bg-sage-light" : ""}>
                      <td className="py-2">{row.label}</td>
                      <td className="text-right py-2">{formatPercent(row.irr)}</td>
                      <td className="text-right py-2">{formatPercent(row.coc)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-5 rounded-xl bg-card border border-border shadow-card">
              <h3 className="font-semibold text-foreground mb-4">Reno Budget Sensitivity</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-muted-foreground font-medium">Change</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">IRR</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">CoC</th>
                  </tr>
                </thead>
                <tbody>
                  {sensitivityTables.renoBudget.map((row) => (
                    <tr key={row.label} className={row.label === "Base" ? "bg-sage-light" : ""}>
                      <td className="py-2">{row.label}</td>
                      <td className="text-right py-2">{formatPercent(row.irr)}</td>
                      <td className="text-right py-2">{formatPercent(row.coc)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Metric Definitions */}
          <section className="p-5 rounded-xl bg-muted/50 border border-border">
            <h3 className="font-semibold text-foreground mb-4">Metric Definitions</h3>
            <dl className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-medium text-foreground">IRR (Internal Rate of Return)</dt>
                <dd className="text-muted-foreground">The annualized rate at which cash flows equal the initial investment. Higher is better.</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Cash-on-Cash Return</dt>
                <dd className="text-muted-foreground">Annual pre-tax cash flow divided by total equity invested. Measures cash yield.</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Equity Multiple</dt>
                <dd className="text-muted-foreground">Total cash received divided by total cash invested. 2.0x means you doubled your money.</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">DSCR (Debt Service Coverage Ratio)</dt>
                <dd className="text-muted-foreground">NOI divided by annual debt service. Lenders typically require 1.20x or higher.</dd>
              </div>
            </dl>
          </section>
        </div>

        {/* PAGE 3+: Annual Summary and Amortization */}
        <div className="print:break-before-page">
          {/* Annual Summary (30-Year Outlook) */}
          <section className="p-5 rounded-xl bg-card border border-border shadow-card overflow-x-auto mb-8">
            <h3 className="font-semibold text-foreground mb-4">30-Year Annual Summary</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-muted-foreground font-medium">Year</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">GPR</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">EGI</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">NOI</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Debt Service</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Cash Flow</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">DSCR</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">CoC</th>
                </tr>
              </thead>
              <tbody>
                {annualSummary.map((year) => (
                  <tr key={year.year} className="border-b last:border-0">
                    <td className="py-2 font-medium">{year.year}</td>
                    <td className="text-right py-2">{formatCurrency(year.gpr)}</td>
                    <td className="text-right py-2">{formatCurrency(year.egi)}</td>
                    <td className="text-right py-2">{formatCurrency(year.noi)}</td>
                    <td className="text-right py-2">{formatCurrency(year.debtService)}</td>
                    <td className="text-right py-2 font-medium">{formatCurrency(year.cashFlow)}</td>
                    <td className="text-right py-2">{year.dscr.toFixed(2)}</td>
                    <td className="text-right py-2">{formatPercent(year.coc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Monthly Cash Flow & Amortization */}
          <section className="p-5 rounded-xl bg-card border border-border shadow-card overflow-x-auto">
            <h3 className="font-semibold text-foreground mb-4">Monthly Cash Flow & Amortization</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-muted-foreground font-medium">Mo</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Rent/Unit</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">GPR</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">EGI</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Opex</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">NOI</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Debt</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Prin</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Int</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">CapEx</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">CF</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((m) => {
                  const capex = m.renoSpend + m.makeReady + m.leasingCosts;
                  return (
                    <tr key={m.month} className="border-b last:border-0">
                      <td className="py-1.5 font-medium">{m.month}</td>
                      <td className="text-right py-1.5">{formatCurrency(m.rent)}</td>
                      <td className="text-right py-1.5">{formatCurrency(m.gpr)}</td>
                      <td className="text-right py-1.5">{formatCurrency(m.egi)}</td>
                      <td className="text-right py-1.5">{formatCurrency(m.totalOpex)}</td>
                      <td className="text-right py-1.5">{formatCurrency(m.noi)}</td>
                      <td className="text-right py-1.5">{formatCurrency(m.debtService)}</td>
                      <td className="text-right py-1.5">{formatCurrency(m.principalPayment)}</td>
                      <td className="text-right py-1.5">{formatCurrency(m.interestPayment)}</td>
                      <td className="text-right py-1.5">{formatCurrency(capex)}</td>
                      <td className="text-right py-1.5 font-medium">{formatCurrency(m.cashFlowBeforeTax)}</td>
                      <td className="text-right py-1.5">{formatCurrency(m.loanBalance)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </div>

        {/* Save Status Note */}
        <section className="flex items-center justify-center gap-2 text-sm text-muted-foreground print:hidden">
          {isSaved ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Analysis saved to your account.</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Analysis will be saved automatically.</span>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default function Results() {
  return (
    <Layout showFooter={false}>
      <AuthGuard requireSubscription={false}>
        <ResultsContent />
      </AuthGuard>
    </Layout>
  );
}
