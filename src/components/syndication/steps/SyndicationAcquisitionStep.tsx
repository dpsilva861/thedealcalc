import { useSyndication } from "@/contexts/SyndicationContext";
import { InputField } from "@/components/underwriting/InputField";

export function SyndicationAcquisitionStep() {
  const { inputs, updateAcquisition, hasAttemptedRun, touchedFields, touchField, validation } = useSyndication();
  const { acquisition } = inputs;

  const getFieldError = (fieldName: string): string | undefined => {
    return validation.errors.find(e => e.field === fieldName)?.message;
  };

  const shouldShowError = (fieldName: string): boolean => {
    return hasAttemptedRun || touchedFields.has(fieldName);
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-1">Acquisition & Sources/Uses</h3>
        <p className="text-sm text-muted-foreground mb-6">Define purchase price and closing costs.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField 
            label="Purchase Price" 
            tooltip="Total acquisition price" 
            value={acquisition.purchase_price} 
            onChange={(v) => updateAcquisition({ purchase_price: v })} 
            onBlur={() => touchField("acquisition.purchase_price")}
            prefix="$" 
            placeholder="1000000"
            error={getFieldError("acquisition.purchase_price")}
            showError={shouldShowError("acquisition.purchase_price")}
          />
          <InputField 
            label="Closing Costs" 
            tooltip="As % of purchase price" 
            value={acquisition.closing_costs_pct * 100} 
            onChange={(v) => updateAcquisition({ closing_costs_pct: v / 100 })} 
            onBlur={() => touchField("acquisition.closing_costs_pct")}
            suffix="%" 
            placeholder="2" 
            min={0} 
            max={20}
            error={getFieldError("acquisition.closing_costs_pct")}
            showError={shouldShowError("acquisition.closing_costs_pct")}
          />
          <InputField 
            label="CapEx Budget" 
            tooltip="Total renovation/improvement budget" 
            value={acquisition.capex_budget_total} 
            onChange={(v) => updateAcquisition({ capex_budget_total: v })} 
            onBlur={() => touchField("acquisition.capex_budget_total")}
            prefix="$" 
            placeholder="50000"
            error={getFieldError("acquisition.capex_budget_total")}
            showError={shouldShowError("acquisition.capex_budget_total")}
          />
          <InputField label="Initial Reserves" tooltip="Operating reserves at close" value={acquisition.initial_reserves} onChange={(v) => updateAcquisition({ initial_reserves: v })} prefix="$" placeholder="50000" />
          <InputField label="Acquisition Fee" tooltip="GP acquisition fee as % of purchase" value={acquisition.acquisition_fee_value * 100} onChange={(v) => updateAcquisition({ acquisition_fee_value: v / 100 })} suffix="%" placeholder="2" min={0} max={10} />
          <InputField label="Organizational Costs" tooltip="Legal, formation, syndication costs" value={acquisition.organizational_costs} onChange={(v) => updateAcquisition({ organizational_costs: v })} prefix="$" placeholder="15000" />
        </div>
      </div>
    </div>
  );
}
