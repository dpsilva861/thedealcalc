import { useSyndication } from "@/contexts/SyndicationContext";
import { InputField } from "@/components/underwriting/InputField";

export function SyndicationExitStep() {
  const { inputs, updateExit, updateHoldPeriod } = useSyndication();
  const { exit, hold_period_months } = inputs;

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-1">Exit / Sale</h3>
        <p className="text-sm text-muted-foreground mb-6">Exit Value = Forward NOI ÷ Exit Cap Rate.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Hold Period" tooltip="Total investment hold period" value={hold_period_months} onChange={(v) => updateHoldPeriod(v)} suffix="months" placeholder="60" min={1} max={360} />
          <InputField label="Sale Month" tooltip="Month of property sale (typically = hold period)" value={exit.sale_month} onChange={(v) => updateExit({ sale_month: v })} suffix="month" placeholder="60" min={1} max={360} />
          <InputField label="Exit Cap Rate" tooltip="Cap rate used to value property at sale" value={exit.exit_cap_rate * 100} onChange={(v) => updateExit({ exit_cap_rate: v / 100 })} suffix="%" placeholder="5.5" min={1} max={15} />
          <InputField label="Sale Costs" tooltip="Broker fees, transfer taxes, etc." value={exit.sale_cost_pct * 100} onChange={(v) => updateExit({ sale_cost_pct: v / 100 })} suffix="%" placeholder="2" min={0} max={10} />
          <InputField label="Disposition Fee" tooltip="GP disposition fee as % of sale price" value={exit.disposition_fee_pct * 100} onChange={(v) => updateExit({ disposition_fee_pct: v / 100 })} suffix="%" placeholder="1" min={0} max={5} />
        </div>
      </div>
    </div>
  );
}
