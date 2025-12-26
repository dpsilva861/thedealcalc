import { useSyndication } from "@/contexts/SyndicationContext";
import { InputField } from "@/components/underwriting/InputField";

export function SyndicationProformaStep() {
  const { inputs, updateProforma } = useSyndication();
  const { proforma } = inputs;

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-1">Operations Pro Forma</h3>
        <p className="text-sm text-muted-foreground mb-6">Monthly income and expenses.</p>
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Income</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Unit Count" tooltip="Number of rental units" value={proforma.unit_count} onChange={(v) => updateProforma({ unit_count: v })} placeholder="20" min={1} />
              <InputField label="Avg Rent / Unit" tooltip="Average monthly rent per unit" value={proforma.avg_rent_month1} onChange={(v) => updateProforma({ avg_rent_month1: v })} prefix="$" placeholder="1200" />
              <InputField label="Other Income" tooltip="Laundry, parking, fees, etc." value={proforma.other_income_month1} onChange={(v) => updateProforma({ other_income_month1: v })} prefix="$" suffix="/mo" placeholder="500" />
              <InputField label="Vacancy Rate" tooltip="Expected vacancy %" value={proforma.vacancy_rate * 100} onChange={(v) => updateProforma({ vacancy_rate: v / 100 })} suffix="%" placeholder="5" min={0} max={50} />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Expenses</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Operating Expenses" tooltip="Total annual operating expenses" value={proforma.expense_lines.reduce((sum, e) => sum + e.annual_amount, 0)} onChange={() => {}} prefix="$" suffix="/yr" placeholder="25200" disabled />
              <InputField label="Property Management" tooltip="PM fee as % of EGI" value={proforma.property_management_fee_pct * 100} onChange={(v) => updateProforma({ property_management_fee_pct: v / 100 })} suffix="%" placeholder="8" min={0} max={15} />
              <InputField label="Replacement Reserves" tooltip="Monthly CapEx reserves" value={proforma.replacement_reserves_monthly} onChange={(v) => updateProforma({ replacement_reserves_monthly: v })} prefix="$" suffix="/mo" placeholder="500" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Growth</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Rent Growth" tooltip="Annual rent growth rate" value={proforma.rent_growth_annual * 100} onChange={(v) => updateProforma({ rent_growth_annual: v / 100 })} suffix="%/yr" placeholder="3" min={-10} max={20} />
              <InputField label="Expense Growth" tooltip="Annual expense growth rate" value={proforma.expense_growth_annual * 100} onChange={(v) => updateProforma({ expense_growth_annual: v / 100 })} suffix="%/yr" placeholder="2" min={-5} max={15} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
