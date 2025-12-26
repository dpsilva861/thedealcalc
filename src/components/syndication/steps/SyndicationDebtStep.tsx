import { useSyndication } from "@/contexts/SyndicationContext";
import { InputField } from "@/components/underwriting/InputField";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SyndicationDebtStep() {
  const { inputs, updateDebt } = useSyndication();
  const { debt } = inputs;

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-1">Debt Structure</h3>
        <p className="text-sm text-muted-foreground mb-6">Configure loan terms. Loan Amount = LTV × Purchase Price.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Financing Type</Label>
            <Select value={debt.financing_type} onValueChange={(v) => updateDebt({ financing_type: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Debt (All Cash)</SelectItem>
                <SelectItem value="amortizing">Fully Amortizing</SelectItem>
                <SelectItem value="interest_only_then_amort">I/O then Amortizing</SelectItem>
                <SelectItem value="bridge_interest_only">Bridge (I/O Only)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <InputField label="Loan-to-Value (LTV)" tooltip="Loan amount as % of purchase price" value={debt.ltv_or_ltc_pct * 100} onChange={(v) => updateDebt({ ltv_or_ltc_pct: v / 100 })} suffix="%" placeholder="70" min={0} max={100} />
          <InputField label="Interest Rate" tooltip="Annual interest rate" value={debt.interest_rate_annual * 100} onChange={(v) => updateDebt({ interest_rate_annual: v / 100 })} suffix="%" placeholder="6" min={0} max={25} />
          <InputField label="Amortization" tooltip="Amortization period in years" value={debt.amort_years} onChange={(v) => updateDebt({ amort_years: v })} suffix="years" placeholder="30" min={1} max={40} />
          <InputField label="I/O Period" tooltip="Interest-only period in months" value={debt.interest_only_months} onChange={(v) => updateDebt({ interest_only_months: v })} suffix="months" placeholder="0" min={0} max={120} />
          <InputField label="Loan Term" tooltip="Total loan term in months" value={debt.loan_term_months} onChange={(v) => updateDebt({ loan_term_months: v })} suffix="months" placeholder="60" min={1} max={360} />
          <InputField label="Origination Fee" tooltip="Origination fee as % of loan" value={debt.origination_fee_pct * 100} onChange={(v) => updateDebt({ origination_fee_pct: v / 100 })} suffix="%" placeholder="1" min={0} max={10} />
        </div>
      </div>
    </div>
  );
}
