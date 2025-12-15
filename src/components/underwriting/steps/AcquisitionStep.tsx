import { useUnderwriting } from "@/contexts/UnderwritingContext";
import { InputField } from "../InputField";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function AcquisitionStep() {
  const { inputs, updateAcquisition } = useUnderwriting();
  const { acquisition } = inputs;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">
          Property Acquisition
        </h2>
        <p className="text-muted-foreground">
          Enter the basic deal terms and exit assumptions.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <InputField
          label="Purchase Price"
          tooltip="The total purchase price for the property"
          value={acquisition.purchasePrice}
          onChange={(v) => updateAcquisition({ purchasePrice: v })}
          prefix="$"
          placeholder="1,000,000"
        />

        <div className="space-y-4">
          <InputField
            label="Closing Costs"
            tooltip="Transaction costs including title, legal, inspections, etc."
            value={acquisition.closingCosts}
            onChange={(v) => updateAcquisition({ closingCosts: v })}
            prefix={acquisition.closingCostsIsPercent ? undefined : "$"}
            suffix={acquisition.closingCostsIsPercent ? "%" : undefined}
            placeholder={acquisition.closingCostsIsPercent ? "2" : "20000"}
          />
          <div className="flex items-center gap-2">
            <Switch
              id="closing-costs-type"
              checked={acquisition.closingCostsIsPercent}
              onCheckedChange={(checked) => updateAcquisition({ closingCostsIsPercent: checked })}
            />
            <Label htmlFor="closing-costs-type" className="text-sm text-muted-foreground">
              Enter as percentage
            </Label>
          </div>
        </div>

        <InputField
          label="Acquisition Fee"
          tooltip="Optional fee paid to sponsor or partner at closing"
          value={acquisition.acquisitionFee}
          onChange={(v) => updateAcquisition({ acquisitionFee: v })}
          prefix="$"
          placeholder="0"
        />

        <InputField
          label="Hold Period"
          tooltip="Expected investment duration in months"
          value={acquisition.holdPeriodMonths}
          onChange={(v) => updateAcquisition({ holdPeriodMonths: v })}
          suffix="months"
          placeholder="60"
          min={1}
          max={360}
        />

        <InputField
          label="Sale Cost"
          tooltip="Costs to sell the property (broker fees, transfer taxes, etc.)"
          value={acquisition.saleCostPct}
          onChange={(v) => updateAcquisition({ saleCostPct: v })}
          suffix="%"
          placeholder="5"
          min={0}
          max={15}
          step={0.1}
        />

        <InputField
          label="Exit Cap Rate"
          tooltip="Expected capitalization rate at sale. Lower = higher sale price."
          value={acquisition.exitCapRate}
          onChange={(v) => updateAcquisition({ exitCapRate: v })}
          suffix="%"
          placeholder="5.5"
          min={1}
          max={15}
          step={0.1}
        />
      </div>
    </div>
  );
}
