import { useBRRRR } from "@/contexts/BRRRRContext";
import { InputField } from "@/components/underwriting/InputField";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function BRRRRAcquisitionStep() {
  const { inputs, updateAcquisition, updateBridgeFinancing } = useBRRRR();
  const { acquisition, bridgeFinancing } = inputs;

  return (
    <div className="space-y-8">
      {/* Acquisition Section */}
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">
          Property Acquisition
        </h2>
        <p className="text-muted-foreground mb-6">
          Enter the purchase details and initial costs.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <InputField
            label="Purchase Price"
            tooltip="Total purchase price of the property"
            value={acquisition.purchasePrice}
            onChange={(v) => updateAcquisition({ purchasePrice: v })}
            prefix="$"
            placeholder="200000"
          />

          <div className="space-y-2">
            <InputField
              label="Closing Costs"
              tooltip="Buyer closing costs"
              value={acquisition.closingCosts}
              onChange={(v) => updateAcquisition({ closingCosts: v })}
              prefix={acquisition.closingCostsIsPercent ? "" : "$"}
              suffix={acquisition.closingCostsIsPercent ? "%" : ""}
              placeholder={acquisition.closingCostsIsPercent ? "2.5" : "5000"}
            />
            <div className="flex items-center gap-2">
              <Switch
                id="closing-pct"
                checked={acquisition.closingCostsIsPercent}
                onCheckedChange={(checked) => updateAcquisition({ closingCostsIsPercent: checked })}
              />
              <Label htmlFor="closing-pct" className="text-sm text-muted-foreground">
                As percentage of purchase
              </Label>
            </div>
          </div>

          <InputField
            label="Rehab Budget"
            tooltip="Total renovation/repair budget"
            value={acquisition.rehabBudget}
            onChange={(v) => updateAcquisition({ rehabBudget: v })}
            prefix="$"
            placeholder="45000"
          />

          <InputField
            label="Monthly Holding Costs"
            tooltip="Monthly costs during rehab (taxes, insurance, utilities, etc.)"
            value={acquisition.monthlyHoldingCosts}
            onChange={(v) => updateAcquisition({ monthlyHoldingCosts: v })}
            prefix="$"
            suffix="/mo"
            placeholder="900"
          />

          <InputField
            label="Holding Period"
            tooltip="Months until refinance"
            value={acquisition.holdingPeriodMonths}
            onChange={(v) => updateAcquisition({ holdingPeriodMonths: v })}
            suffix="months"
            placeholder="4"
            min={1}
            max={36}
          />
        </div>
      </div>

      {/* Bridge Financing Section */}
      <div>
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
          Bridge / Purchase Financing
        </h3>
        <p className="text-muted-foreground mb-6">
          Short-term financing for the acquisition and rehab.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <InputField
            label="Down Payment"
            tooltip="Percentage of purchase price as down payment"
            value={bridgeFinancing.downPaymentPct * 100}
            onChange={(v) => updateBridgeFinancing({ downPaymentPct: v / 100 })}
            suffix="%"
            placeholder="20"
            min={0}
            max={100}
          />

          <InputField
            label="Interest Rate"
            tooltip="Annual interest rate on bridge loan"
            value={bridgeFinancing.interestRate * 100}
            onChange={(v) => updateBridgeFinancing({ interestRate: v / 100 })}
            suffix="%"
            placeholder="11.5"
            min={0}
            max={25}
          />

          <InputField
            label="Loan Term"
            tooltip="Bridge loan term in months"
            value={bridgeFinancing.loanTermMonths}
            onChange={(v) => updateBridgeFinancing({ loanTermMonths: v })}
            suffix="months"
            placeholder="12"
            min={1}
            max={60}
          />

          <InputField
            label="Points"
            tooltip="Origination points as percentage of loan"
            value={bridgeFinancing.pointsPct * 100}
            onChange={(v) => updateBridgeFinancing({ pointsPct: v / 100 })}
            suffix="%"
            placeholder="2"
            min={0}
            max={10}
          />

          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
            <Switch
              id="interest-only"
              checked={bridgeFinancing.isInterestOnly}
              onCheckedChange={(checked) => updateBridgeFinancing({ isInterestOnly: checked })}
            />
            <Label htmlFor="interest-only" className="text-foreground">
              Interest-Only Payments
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
