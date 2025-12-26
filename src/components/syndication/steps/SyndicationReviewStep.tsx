import { useSyndication } from "@/contexts/SyndicationContext";
import { formatCurrency, formatPercent } from "@/lib/calculators/types";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export function SyndicationReviewStep() {
  const { inputs, validation } = useSyndication();
  const { acquisition, debt, equity, proforma, exit, waterfall, hold_period_months } = inputs;
  const closingCosts = acquisition.purchase_price * acquisition.closing_costs_pct;
  const loanAmount = acquisition.purchase_price * debt.ltv_or_ltc_pct;
  const totalUses = acquisition.purchase_price + closingCosts + (acquisition.purchase_price * acquisition.acquisition_fee_value) + acquisition.capex_budget_total + acquisition.initial_reserves + acquisition.organizational_costs + (loanAmount * debt.origination_fee_pct);
  const totalEquity = totalUses - loanAmount;
  const grossRent = proforma.unit_count * proforma.avg_rent_month1;
  const egi = (grossRent + proforma.other_income_month1) * (1 - proforma.vacancy_rate);
  const monthlyOpex = proforma.expense_lines.reduce((sum, e) => sum + e.annual_amount, 0) / 12;
  const noi = egi - monthlyOpex - (egi * proforma.property_management_fee_pct) - proforma.replacement_reserves_monthly;
  const purchaseCapRate = (noi * 12) / acquisition.purchase_price;

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-1">Review Your Deal</h3>
        <p className="text-sm text-muted-foreground mb-6">Verify inputs before running analysis.</p>
        {validation.errors.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Fix Errors</h4>
            {validation.errors.map((err, i) => (
              <p key={i} className="text-sm text-destructive mt-1">• {err.message}</p>
            ))}
          </div>
        )}
        {validation.warnings.length > 0 && (
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-warning flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Warnings</h4>
            {validation.warnings.map((w, i) => (
              <p key={i} className="text-sm text-warning mt-1">• {w.message}</p>
            ))}
          </div>
        )}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground">Total Project Cost</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(totalUses)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground">Total Equity</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(totalEquity)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground">Purchase Cap Rate</p>
            <p className="text-xl font-bold text-foreground">{formatPercent(purchaseCapRate)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="space-y-2">
            <h5 className="font-semibold text-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-primary" />Acquisition</h5>
            <p className="text-muted-foreground">Purchase Price</p><p className="font-medium">{formatCurrency(acquisition.purchase_price)}</p>
            <p className="text-muted-foreground">CapEx</p><p className="font-medium">{formatCurrency(acquisition.capex_budget_total)}</p>
            <p className="text-muted-foreground">Hold Period</p><p className="font-medium">{hold_period_months} mo</p>
          </div>
          <div className="space-y-2">
            <h5 className="font-semibold text-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-primary" />Debt</h5>
            <p className="text-muted-foreground">Loan Amount</p><p className="font-medium">{formatCurrency(loanAmount)}</p>
            <p className="text-muted-foreground">LTV</p><p className="font-medium">{formatPercent(debt.ltv_or_ltc_pct)}</p>
            <p className="text-muted-foreground">Rate</p><p className="font-medium">{formatPercent(debt.interest_rate_annual)}</p>
          </div>
          <div className="space-y-2">
            <h5 className="font-semibold text-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-primary" />Operations</h5>
            <p className="text-muted-foreground">Units</p><p className="font-medium">{proforma.unit_count}</p>
            <p className="text-muted-foreground">Avg Rent</p><p className="font-medium">{formatCurrency(proforma.avg_rent_month1)}/mo</p>
            <p className="text-muted-foreground">Monthly NOI</p><p className="font-medium">{formatCurrency(noi)}</p>
          </div>
          <div className="space-y-2">
            <h5 className="font-semibold text-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-primary" />Exit & Waterfall</h5>
            <p className="text-muted-foreground">Exit Cap</p><p className="font-medium">{formatPercent(exit.exit_cap_rate)}</p>
            <p className="text-muted-foreground">Pref Return</p><p className="font-medium">{formatPercent(waterfall.pref_rate_annual)}/yr</p>
            <p className="text-muted-foreground">LP/GP</p><p className="font-medium">{(equity.lp_equity_pct * 100).toFixed(0)}/{(equity.gp_equity_pct * 100).toFixed(0)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
