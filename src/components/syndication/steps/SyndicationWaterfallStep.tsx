import { useSyndication } from "@/contexts/SyndicationContext";
import { InputField } from "@/components/underwriting/InputField";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SyndicationWaterfallStep() {
  const { inputs, updateWaterfall } = useSyndication();
  const { waterfall } = inputs;

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-1">Waterfall Structure</h3>
        <p className="text-sm text-muted-foreground mb-6">Cash flows: ROC → Pref → Catch-up → Promote.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Preferred Return" tooltip="Annual preferred return to LPs" value={waterfall.pref_rate_annual * 100} onChange={(v) => updateWaterfall({ pref_rate_annual: v / 100 })} suffix="%/yr" placeholder="8" min={0} max={20} />
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">ROC Mode</Label>
            <Select value={waterfall.roc_mode} onValueChange={(v) => updateWaterfall({ roc_mode: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pro_rata">Pro Rata</SelectItem>
                <SelectItem value="lp_first">LP First</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Waterfall Variant</Label>
            <Select value={waterfall.variant} onValueChange={(v) => updateWaterfall({ variant: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="equity_multiple_hurdles">Equity Multiple Hurdles</SelectItem>
                <SelectItem value="pref_roc_promote">Pref + ROC + Promote</SelectItem>
                <SelectItem value="with_catchup">With Catch-Up</SelectItem>
                <SelectItem value="irr_hurdles">IRR Hurdles</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-foreground mb-3">Promote Tiers</h4>
          <div className="space-y-2">
            {waterfall.tiers.map((tier, idx) => (
              <div key={idx} className="flex items-center justify-between bg-muted/50 rounded-lg p-3 text-sm">
                <span className="font-medium">Tier {idx + 1}</span>
                <span className="text-muted-foreground">
                  {tier.tier_type === "equity_multiple" ? `≥ ${tier.hurdle.toFixed(2)}x EM` : tier.tier_type === "irr" ? `≥ ${(tier.hurdle * 100).toFixed(0)}% IRR` : "Remaining"}
                </span>
                <span className="text-primary">LP {(tier.lp_split * 100).toFixed(0)}%</span>
                <span className="text-accent">GP {(tier.gp_split * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
