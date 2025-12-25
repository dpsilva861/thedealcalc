import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useUnderwriting, PropertyAddress } from "@/contexts/UnderwritingContext";
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
  RefreshCw,
  Edit,
  FileSpreadsheet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { exportToPDF, exportToCSV, exportToExcel } from "@/lib/exportUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function ResultsContent() {
  const navigate = useNavigate();
  const { inputs, propertyAddress } = useUnderwriting();

  const [baseResults, setBaseResults] = useState<UnderwritingResults | null>(null);
  const [outlookResults, setOutlookResults] = useState<UnderwritingResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [displayAddress, setDisplayAddress] = useState<PropertyAddress | null>(null);
  const [displayInputs, setDisplayInputs] = useState<UnderwritingInputs | null>(null);

  // Compute results from context inputs
  useEffect(() => {
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
  }, [inputs, propertyAddress]);

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
      value: isFinite(metrics.irr) ? formatPercent(metrics.irr) : "N/A", 
      icon: TrendingUp,
      description: "Internal Rate of Return (Annualized)",
      isWarning: metrics.irr > 100 || metrics.irr < -50,
    },
    { 
      label: "Cash-on-Cash (Year 1)", 
      value: isFinite(metrics.cocYear1) ? formatPercent(metrics.cocYear1) : "N/A", 
      icon: DollarSign,
      description: "First year cash return on equity",
      isWarning: metrics.cocYear1 < -20,
    },
    { 
      label: "Equity Multiple", 
      value: isFinite(metrics.equityMultiple) ? formatMultiple(metrics.equityMultiple) : "N/A", 
      icon: BarChart3,
      description: "Total return / Initial equity",
      isWarning: metrics.equityMultiple < 1 || metrics.equityMultiple > 10,
    },
    { 
      label: "DSCR", 
      value: metrics.dscrDisplay,
      icon: Percent,
      description: "Debt Service Coverage Ratio",
      isWarning: metrics.dscr > 0 && metrics.dscr < 1.2,
    },
  ];

  // Red flags / breakpoints (computed first so we can pass to exports)
  const redFlags: string[] = [];
  
  metrics.warnings.forEach(w => {
    if (w.severity === "error" || w.severity === "warn") {
      redFlags.push(w.message);
    }
  });

  if (!saleAnalysis.isValid) {
    redFlags.push("Exit cap rate is invalid. Sale price cannot be calculated.");
  }
  if (saleAnalysis.isValid && saleAnalysis.salePrice > currentInputs.acquisition.purchasePrice * 5) {
    redFlags.push(`Sale price of ${formatCurrency(saleAnalysis.salePrice)} is over 5x purchase price. Verify exit cap rate assumption.`);
  }

  if (metrics.dscr < 1.2 && metrics.dscr > 0) {
    redFlags.push(`DSCR of ${metrics.dscr.toFixed(2)} is below typical lender requirement of 1.20`);
  }
  if (metrics.breakevenOccupancy > 90 && metrics.breakevenOccupancy <= 100) {
    redFlags.push(`Breakeven occupancy of ${formatPercent(metrics.breakevenOccupancy)} is very high`);
  }
  if (metrics.irr < 0) {
    redFlags.push("Negative IRR indicates a loss on this investment");
  }
  if (metrics.irr > 100) {
    redFlags.push(`IRR of ${formatPercent(metrics.irr)} is exceptionally high. Verify inputs.`);
  }
  if (metrics.cocYear1 < 0) {
    redFlags.push("Negative Year 1 cash-on-cash indicates cash shortfall");
  }
  if (metrics.equityMultiple < 1) {
    redFlags.push("Equity multiple below 1.0x indicates loss of principal");
  }

  // Export data object for all export functions
  const exportData = {
    inputs: currentInputs,
    results,
    monthlyData,
    annualSummary,
    propertyAddress: displayAddress || undefined,
    redFlags,
  };

  const handleExportPDF = async () => {
    if (generatingPDF) return;
    setGeneratingPDF(true);
    try {
      exportToPDF(exportData);
      toast.success("PDF downloaded");
    } catch (err) {
      console.error("PDF export failed:", err);
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleExportCSV = () => {
    try {
      exportToCSV(exportData);
      toast.success("CSV exported successfully");
    } catch (err) {
      console.error("CSV export failed:", err);
      toast.error("Failed to export CSV");
    }
  };

  const handleExportExcel = () => {
    try {
      exportToExcel(exportData);
      toast.success("Excel file exported successfully");
    } catch (err) {
      console.error("Excel export failed:", err);
      toast.error("Failed to export Excel file");
    }
  };

  const handleEditInputs = () => {
    navigate("/underwrite");
  };
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-cream-dark print:bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background print:hidden">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleEditInputs}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Inputs
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
                  >
                    {generatingPDF ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        <span className="text-muted-foreground">Generating PDF…</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportCSV}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportExcel}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Key Metrics */}
        <section className="mb-8">
          <h2 className="font-display text-xl font-bold text-foreground mb-4">
            Key Metrics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {keyMetrics.map((metric) => (
              <div 
                key={metric.label}
                className={`p-5 rounded-xl border shadow-card ${
                  metric.isWarning 
                    ? "bg-destructive/5 border-destructive/30" 
                    : "bg-card border-border"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <metric.icon className={`h-4 w-4 ${metric.isWarning ? "text-destructive" : "text-primary"}`} />
                  <span className="text-sm text-muted-foreground">{metric.label}</span>
                  {metric.isWarning && <AlertTriangle className="h-3 w-3 text-destructive" />}
                </div>
                <div className={`text-2xl font-display font-bold ${
                  metric.isWarning ? "text-destructive" : "text-foreground"
                }`}>
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
        <section className="p-5 rounded-xl bg-card border border-border shadow-card mb-8">
          <h3 className="font-semibold text-foreground mb-4">Exit Analysis</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Stabilized NOI</p>
              <p className="font-medium">{formatCurrency(saleAnalysis.stabilizedNoi)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sale Price</p>
              <p className="font-medium">{formatCurrency(saleAnalysis.salePrice)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sale Costs</p>
              <p className="font-medium">{formatCurrency(saleAnalysis.saleCosts)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Loan Payoff</p>
              <p className="font-medium">{formatCurrency(saleAnalysis.loanPayoff)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Net Proceeds</p>
              <p className="font-bold text-primary">{formatCurrency(saleAnalysis.netSaleProceeds)}</p>
            </div>
          </div>
        </section>

        {/* Sensitivity Tables */}
        <section className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="p-5 rounded-xl bg-card border border-border shadow-card">
            <h4 className="font-semibold text-foreground mb-3">Rent Sensitivity</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1 text-muted-foreground font-medium">Scenario</th>
                  <th className="text-right py-1 text-muted-foreground font-medium">IRR</th>
                  <th className="text-right py-1 text-muted-foreground font-medium">CoC</th>
                </tr>
              </thead>
              <tbody>
                {sensitivityTables.rent.map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-1.5">{row.label}</td>
                    <td className="text-right py-1.5">{formatPercent(row.irr)}</td>
                    <td className="text-right py-1.5">{formatPercent(row.coc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-5 rounded-xl bg-card border border-border shadow-card">
            <h4 className="font-semibold text-foreground mb-3">Exit Cap Sensitivity</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1 text-muted-foreground font-medium">Scenario</th>
                  <th className="text-right py-1 text-muted-foreground font-medium">IRR</th>
                  <th className="text-right py-1 text-muted-foreground font-medium">CoC</th>
                </tr>
              </thead>
              <tbody>
                {sensitivityTables.exitCap.map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-1.5">{row.label}</td>
                    <td className="text-right py-1.5">{formatPercent(row.irr)}</td>
                    <td className="text-right py-1.5">{formatPercent(row.coc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-5 rounded-xl bg-card border border-border shadow-card">
            <h4 className="font-semibold text-foreground mb-3">Reno Budget Sensitivity</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1 text-muted-foreground font-medium">Scenario</th>
                  <th className="text-right py-1 text-muted-foreground font-medium">IRR</th>
                  <th className="text-right py-1 text-muted-foreground font-medium">CoC</th>
                </tr>
              </thead>
              <tbody>
                {sensitivityTables.renoBudget.map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-1.5">{row.label}</td>
                    <td className="text-right py-1.5">{formatPercent(row.irr)}</td>
                    <td className="text-right py-1.5">{formatPercent(row.coc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Annual Summary */}
        <section className="p-5 rounded-xl bg-card border border-border shadow-card mb-8 overflow-x-auto">
          <h3 className="font-semibold text-foreground mb-4">30-Year Annual Summary</h3>
          <table className="w-full text-sm min-w-[700px]">
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
              {annualSummary.map((yr) => (
                <tr key={yr.year} className="border-b last:border-0">
                  <td className="py-1.5 font-medium">{yr.year}</td>
                  <td className="text-right py-1.5">{formatCurrency(yr.gpr)}</td>
                  <td className="text-right py-1.5">{formatCurrency(yr.egi)}</td>
                  <td className="text-right py-1.5">{formatCurrency(yr.noi)}</td>
                  <td className="text-right py-1.5">{formatCurrency(yr.debtService)}</td>
                  <td className="text-right py-1.5 font-medium">{formatCurrency(yr.cashFlow)}</td>
                  <td className="text-right py-1.5">{yr.dscr.toFixed(2)}</td>
                  <td className="text-right py-1.5">{formatPercent(yr.coc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Monthly Amortization */}
        <section className="p-5 rounded-xl bg-card border border-border shadow-card overflow-x-auto">
          <h3 className="font-semibold text-foreground mb-4">Monthly Cash Flow & Amortization</h3>
          <table className="w-full text-xs min-w-[900px]">
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

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center">
          For educational purposes only. Not investment, legal, or tax advice.
        </p>
      </div>
    </div>
  );
}

export default function Results() {
  return (
    <Layout showFooter={false}>
      <ResultsContent />
    </Layout>
  );
}
