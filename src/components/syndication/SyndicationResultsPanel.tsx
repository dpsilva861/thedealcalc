import { useSyndication } from "@/contexts/SyndicationContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency, formatPercent, formatMultiple } from "@/lib/calculators/types";
import { TrendingUp, DollarSign, Percent, PiggyBank, AlertTriangle } from "lucide-react";

export default function SyndicationResultsPanel() {
  const { results } = useSyndication();

  if (!results) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p>Run an analysis to see results</p>
        </CardContent>
      </Card>
    );
  }

  const { metrics, sources_and_uses: su, waterfall_summary: ws, warnings } = results;

  return (
    <div className="space-y-4">
      {/* Warnings */}
      {warnings.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              {warnings.map((w, i) => (
                <li key={i} className="text-amber-600">{w.message}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Deal KPIs
          </CardTitle>
          <CardDescription>
            Key return metrics and ratios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="LP IRR"
              value={formatPercent(metrics.levered_irr_lp)}
              sublabel="Levered internal rate of return to LPs"
            />
            <MetricCard
              label="LP Equity Multiple"
              value={formatMultiple(metrics.equity_multiple_lp)}
              sublabel="Total distributions ÷ contributions"
            />
            <MetricCard
              label="Unlevered IRR"
              value={formatPercent(metrics.unlevered_irr)}
              sublabel="Property-level returns without debt"
            />
            <MetricCard
              label="Avg Cash-on-Cash"
              value={formatPercent(metrics.avg_cash_on_cash)}
              sublabel="Average annual operating yield"
            />
            <MetricCard
              label="Purchase Cap"
              value={formatPercent(metrics.purchase_cap_rate)}
              sublabel="Year 1 NOI ÷ Purchase Price"
            />
            <MetricCard
              label="Exit Cap"
              value={formatPercent(metrics.exit_cap_rate)}
              sublabel="Exit NOI ÷ Sale Price"
            />
            <MetricCard
              label="Min DSCR"
              value={metrics.dscr_min.toFixed(2) + "x"}
              sublabel="Minimum debt service coverage"
            />
            <MetricCard
              label="Debt Yield"
              value={formatPercent(metrics.debt_yield)}
              sublabel="Year 1 NOI ÷ Loan Amount"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sources & Uses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Sources & Uses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Uses of Funds</h4>
              <div className="space-y-1 text-sm">
                <LineItem label="Purchase Price" value={su.purchase_price} />
                <LineItem label="Closing Costs" value={su.closing_costs} />
                <LineItem label="Acquisition Fee" value={su.acquisition_fee} />
                <LineItem label="CapEx Budget" value={su.capex_budget} />
                <LineItem label="Initial Reserves" value={su.initial_reserves} />
                <LineItem label="Lender Fees" value={su.lender_fees} />
                <LineItem label="Org. Costs" value={su.organizational_costs} />
                <div className="border-t pt-1 mt-2 font-medium">
                  <LineItem label="Total Uses" value={su.total_uses} />
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Sources of Funds</h4>
              <div className="space-y-1 text-sm">
                <LineItem label="Senior Debt" value={su.loan_amount} />
                <LineItem label="LP Equity" value={su.lp_equity} />
                <LineItem label="GP Equity" value={su.gp_equity} />
                <div className="border-t pt-1 mt-2 font-medium">
                  <LineItem label="Total Sources" value={su.total_sources} />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Waterfall Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            Waterfall Summary
          </CardTitle>
          <CardDescription>
            LP/GP distribution breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">LP Returns</h4>
              <div className="space-y-1 text-sm">
                <LineItem label="Total Contributions" value={ws.lp_total_contributions} />
                <LineItem label="Return of Capital" value={ws.lp_total_roc} />
                <LineItem label="Preferred Return" value={ws.lp_total_pref} />
                <LineItem label="Promote Distributions" value={ws.lp_total_promote} />
                <div className="border-t pt-1 mt-2 font-medium">
                  <LineItem label="Total Distributions" value={ws.lp_total_distributions} />
                </div>
                <div className="mt-2 pt-2 border-t">
                  <div className="flex justify-between">
                    <span>LP IRR</span>
                    <span className="font-medium">{formatPercent(ws.lp_irr)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>LP Multiple</span>
                    <span className="font-medium">{formatMultiple(ws.lp_equity_multiple)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">GP Returns</h4>
              <div className="space-y-1 text-sm">
                <LineItem label="Total Contributions" value={ws.gp_total_contributions} />
                <LineItem label="Return of Capital" value={ws.gp_total_roc} />
                <LineItem label="Preferred Return" value={ws.gp_total_pref} />
                <LineItem label="Catch-Up" value={ws.gp_total_catchup} />
                <LineItem label="Promote Distributions" value={ws.gp_total_promote} />
                <div className="border-t pt-1 mt-2 font-medium">
                  <LineItem label="Total Distributions" value={ws.gp_total_distributions} />
                </div>
                <div className="mt-2 pt-2 border-t">
                  <div className="flex justify-between">
                    <span>GP IRR</span>
                    <span className="font-medium">{formatPercent(ws.gp_irr)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GP Multiple</span>
                    <span className="font-medium">{formatMultiple(ws.gp_equity_multiple)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span>Total Promote to GP</span>
              <span className="font-medium">{formatCurrency(ws.promote_dollars)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Promote as % of Total Profit</span>
              <span>{formatPercent(ws.promote_percent_of_profit)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Fee Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            <LineItem label="Acquisition Fees" value={metrics.total_acquisition_fees} />
            <LineItem label="Asset Management Fees" value={metrics.total_asset_management_fees} />
            <LineItem label="Disposition Fees" value={metrics.total_disposition_fees} />
            <div className="border-t pt-1 mt-2 font-medium">
              <LineItem label="Total Fees" value={metrics.total_fees} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ label, value, sublabel }: { label: string; value: string; sublabel: string }) {
  return (
    <div className="p-3 bg-muted/50 rounded-lg">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sublabel}</div>
    </div>
  );
}

function LineItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{formatCurrency(value)}</span>
    </div>
  );
}
