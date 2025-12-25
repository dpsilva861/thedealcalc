import { Layout } from "@/components/layout/Layout";
import { useBRRRR } from "@/contexts/BRRRRContext";
import { BRRRRSelfTest } from "@/components/brrrr/BRRRRSelfTest";
import { formatCurrency, formatPercent } from "@/lib/calculators/types";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, AlertTriangle, CheckCircle2, TrendingUp, DollarSign, 
  Percent, Home, Download, FileSpreadsheet, RefreshCw 
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  exportBRRRRToExcel, 
  exportBRRRRToCSV, 
  exportBRRRRToPDF 
} from "@/lib/calculators/brrrr/exports";

function BRRRRResultsContent() {
  const { results, inputs } = useBRRRR();
  const [generatingPDF, setGeneratingPDF] = useState(false);

  if (!results) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground mb-4">No analysis results. Run an analysis first.</p>
        <Button asChild>
          <Link to="/brrrr">Go to Calculator</Link>
        </Button>
      </div>
    );
  }

  const { holdingPhase, refinance, rental, metrics, riskFlags, sensitivity } = results;

  const exportData = {
    inputs,
    results,
    propertyAddress: undefined, // BRRRR doesn't have address input currently
  };

  const handleExportPDF = async () => {
    if (generatingPDF) return;
    setGeneratingPDF(true);
    try {
      exportBRRRRToPDF(exportData);
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
      exportBRRRRToCSV(exportData);
      toast.success("CSV exported successfully");
    } catch (err) {
      console.error("CSV export failed:", err);
      toast.error("Failed to export CSV");
    }
  };

  const handleExportExcel = async () => {
    try {
      await exportBRRRRToExcel(exportData);
      toast.success("Excel file exported successfully");
    } catch (err) {
      console.error("Excel export failed:", err);
      toast.error("Failed to export Excel file");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">BRRRR Analysis Results</h1>
            <p className="text-muted-foreground">Deal snapshot and key metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/brrrr"><ArrowLeft className="h-4 w-4 mr-2" />Edit Inputs</Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="hero">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleExportPDF} disabled={generatingPDF}>
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

        {/* Self-Test (Dev Mode Only) */}
        <div className="mb-6">
          <BRRRRSelfTest />
        </div>

        {/* Risk Flags */}
        {riskFlags.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
            <h3 className="font-semibold text-destructive flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5" />Risk Flags
            </h3>
            <ul className="space-y-1">
              {riskFlags.map((flag, i) => (
                <li key={i} className="text-sm text-muted-foreground">• {flag.message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Cash Left In Deal</span>
            </div>
            <p className={`text-2xl font-bold ${refinance.remainingCashInDeal <= 0 ? "text-primary" : "text-foreground"}`}>
              {formatCurrency(Math.max(0, refinance.remainingCashInDeal))}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Monthly Cash Flow</span>
            </div>
            <p className={`text-2xl font-bold ${rental.monthlyCashFlow < 0 ? "text-destructive" : "text-foreground"}`}>
              {formatCurrency(rental.monthlyCashFlow)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Percent className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Cash-on-Cash</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {metrics.cashOnCashReturn === Infinity ? "∞" : formatPercent(metrics.cashOnCashReturn)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Home className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">DSCR</span>
            </div>
            <p className={`text-2xl font-bold ${metrics.dscr < 1.2 && metrics.dscr !== Infinity ? "text-destructive" : "text-foreground"}`}>
              {metrics.dscr === Infinity ? "N/A" : metrics.dscr.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Deal Snapshot */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />Holding Phase
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Total Cash In</dt><dd>{formatCurrency(holdingPhase.totalCashIn)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Rehab Cost</dt><dd>{formatCurrency(holdingPhase.totalRehabCost)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Holding Costs</dt><dd>{formatCurrency(holdingPhase.totalHoldingCosts)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Bridge Payments</dt><dd>{formatCurrency(holdingPhase.totalBridgePayments)}</dd></div>
            </dl>
          </div>
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />Refinance
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Max Refi Loan</dt><dd>{formatCurrency(refinance.maxRefiLoan)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Cash Out</dt><dd>{formatCurrency(refinance.cashOut)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">New Payment</dt><dd>{formatCurrency(refinance.newMonthlyPayment)}/mo</dd></div>
            </dl>
          </div>
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />Rental
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">EGI</dt><dd>{formatCurrency(rental.effectiveGrossIncome)}/mo</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Expenses</dt><dd>{formatCurrency(rental.monthlyExpenses)}/mo</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">NOI</dt><dd>{formatCurrency(rental.monthlyNOI)}/mo</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Annual NOI</dt><dd>{formatCurrency(rental.annualNOI)}</dd></div>
            </dl>
          </div>
        </div>

        {/* Sensitivity Table */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <h3 className="font-semibold text-foreground mb-4">Sensitivity Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2 text-muted-foreground">Rent / ARV</th>
                  {sensitivity.arvVariations.map((v, i) => (
                    <th key={i} className="text-center p-2 text-muted-foreground">
                      ARV {v >= 0 ? "+" : ""}{(v * 100).toFixed(0)}%
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sensitivity.cells.map((row, r) => (
                  <tr key={r} className="border-t border-border">
                    <td className="p-2 text-muted-foreground">
                      Rent {sensitivity.rentVariations[r] >= 0 ? "+" : ""}{(sensitivity.rentVariations[r] * 100).toFixed(0)}%
                    </td>
                    {row.map((cell, c) => (
                      <td key={c} className={`text-center p-2 ${r === 1 && c === 1 ? "bg-primary/5 font-medium" : ""}`}>
                        <div>{formatCurrency(cell.monthlyCashFlow)}</div>
                        <div className="text-xs text-muted-foreground">{formatPercent(cell.cashOnCash)} CoC</div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center mt-8">
          For educational purposes only. Not investment, legal, or tax advice.
        </p>
      </div>
    </div>
  );
}

export default function BRRRRResults() {
  return (
    <Layout>
      <BRRRRResultsContent />
    </Layout>
  );
}
