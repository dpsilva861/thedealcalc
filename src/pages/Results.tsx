import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useUnderwriting } from "@/contexts/UnderwritingContext";
import { AuthGuard } from "@/components/AuthGuard";
import {
  formatCurrency,
  formatPercent,
  formatMultiple,
  runUnderwriting,
  runUnderwritingNoSensitivity,
  UnderwritingResults,
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
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

function ResultsContent() {
  const navigate = useNavigate();
  const { inputs } = useUnderwriting();

  const [baseResults, setBaseResults] = useState<UnderwritingResults | null>(null);
  const [outlookResults, setOutlookResults] = useState<UnderwritingResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasAutoPrinted = useRef(false);

  // Compute results once from inputs (prevents the previous "infinite spinner" loop)
  useEffect(() => {
    setError(null);
    setBaseResults(null);
    setOutlookResults(null);

    const id = window.setTimeout(() => {
      try {
        const base = runUnderwriting(inputs);

        // Always generate a lender-ready 30-year outlook (360 months) for the spreadsheet pages.
        const outlookMonths = 360;
        const outlook =
          inputs.acquisition.holdPeriodMonths >= outlookMonths
            ? base
            : runUnderwritingNoSensitivity({
                ...inputs,
                acquisition: {
                  ...inputs.acquisition,
                  holdPeriodMonths: outlookMonths,
                },
              });

        setBaseResults(base);
        setOutlookResults(outlook);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        console.error("Underwriting report generation failed:", e);
        setError(message);
      }
    }, 0);

    return () => window.clearTimeout(id);
  }, [inputs]);

  // Auto-open print dialog when user clicks "Run Analysis" (Save as PDF)
  useEffect(() => {
    if (!baseResults) return;

    const shouldAutoPrint = sessionStorage.getItem("uw:autoPrint") === "1";
    if (!shouldAutoPrint) return;

    if (hasAutoPrinted.current) return;
    hasAutoPrinted.current = true;
    sessionStorage.removeItem("uw:autoPrint");

    window.setTimeout(() => {
      try {
        window.print();
      } catch (e) {
        console.error("Print failed:", e);
      }
    }, 250);
  }, [baseResults]);

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="max-w-lg w-full text-center space-y-4">
          <p className="text-foreground font-semibold">Report generation failed</p>
          <p className="text-sm text-muted-foreground">
            {error}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => navigate("/underwrite")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to inputs
            </Button>
            <Button variant="hero" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!baseResults || !outlookResults) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Building your lender-ready report…</p>
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

  const handleExportPDF = () => {
    window.print();
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/underwrite")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
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
            <Button variant="hero" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block p-8 border-b">
        <h1 className="font-display text-3xl font-bold">Underwriting Report</h1>
        <p className="text-muted-foreground">
          {inputs.income.unitCount} units • {formatCurrency(inputs.acquisition.purchasePrice)} • {inputs.acquisition.holdPeriodMonths} month hold
        </p>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Key Metrics */}
        <section>
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
          <section className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
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
        <section className="grid md:grid-cols-2 gap-6">
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

        {/* Sale Analysis */}
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

        {/* Annual Summary (30-Year Outlook) */}
        <section className="p-5 rounded-xl bg-card border border-border shadow-card overflow-x-auto">
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
        <section className="p-5 rounded-xl bg-card border border-border shadow-card overflow-x-auto print-page-break">
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

        {/* Sensitivity Tables */}
        <section className="grid md:grid-cols-3 gap-6">
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

        {/* Metric Explanations */}
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

        {/* Privacy Note */}
        <section className="flex items-center justify-center gap-2 text-sm text-muted-foreground print:hidden">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span>This data exists only in your browser and will be cleared on refresh.</span>
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
