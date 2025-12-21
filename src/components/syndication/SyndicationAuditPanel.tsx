import { useSyndication } from "@/contexts/SyndicationContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { formatCurrency } from "@/lib/calculators/types";

export default function SyndicationAuditPanel() {
  const { results } = useSyndication();

  if (!results) return null;

  const { waterfall_allocations: allocations } = results;

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
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "syndication_audit.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <CardDescription>
              Period-by-period waterfall allocations with full traceability
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Every dollar is traced: Cash Available = LP Dist + GP Dist. ROC reduces unreturned capital.
          Pref accrues monthly on unreturned capital. Tiers activate when LP EM crosses hurdle.
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
                    <TableCell className="text-right font-mono">
                      {lpTier > 0 ? formatCurrency(lpTier) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {gpTier > 0 ? formatCurrency(gpTier) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatCurrency(a.lp_unreturned_capital)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {a.lp_equity_multiple.toFixed(2)}x
                    </TableCell>
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
            Showing first 61 periods. Export CSV for full data ({allocations.length} periods).
          </p>
        )}
      </CardContent>
    </Card>
  );
}
