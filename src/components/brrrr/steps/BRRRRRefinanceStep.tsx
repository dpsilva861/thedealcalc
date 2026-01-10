import { useBRRRR } from "@/contexts/BRRRRContext";
import { InputField } from "@/components/underwriting/InputField";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { validateBRRRRInputs } from "@/lib/calculators/brrrr/validation";
import { useMemo } from "react";

export function BRRRRRefinanceStep() {
  const { inputs, updateAfterRepairValue, updateRefinance, hasAttemptedRun, touchedFields, touchField } = useBRRRR();
  const { afterRepairValue, refinance } = inputs;

  const validation = useMemo(() => validateBRRRRInputs(inputs), [inputs]);

  const getFieldError = (fieldName: string): string | undefined => {
    return validation.errors.find(e => e.field === fieldName)?.message;
  };

  const shouldShowError = (fieldName: string): boolean => {
    return hasAttemptedRun || touchedFields.has(fieldName);
  };

  return (
    <div className="space-y-8">
      {/* ARV Section */}
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">
          After Repair Value
        </h2>
        <p className="text-muted-foreground mb-6">
          The estimated market value of the property after renovations are complete.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <InputField
            label="After Repair Value (ARV)"
            tooltip="Estimated market value after all renovations"
            value={afterRepairValue.arv}
            onChange={(v) => updateAfterRepairValue({ arv: v })}
            onBlur={() => touchField("arv")}
            prefix="$"
            placeholder="320000"
            error={getFieldError("arv")}
            showError={shouldShowError("arv")}
          />
        </div>

        {/* Quick metrics */}
        {inputs.acquisition.purchasePrice > 0 && afterRepairValue.arv > 0 && (
          <div className="mt-4 p-4 rounded-lg bg-muted/50 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Purchase to ARV Ratio</p>
              <p className="font-semibold text-foreground">
                {((inputs.acquisition.purchasePrice / afterRepairValue.arv) * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Equity Created</p>
              <p className="font-semibold text-foreground">
                ${(afterRepairValue.arv - inputs.acquisition.purchasePrice - inputs.acquisition.rehabBudget).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Refinance Section */}
      <div>
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
          Refinance Terms
        </h3>
        <p className="text-muted-foreground mb-6">
          Long-term financing to replace the bridge loan.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <InputField
            label="Refi LTV"
            tooltip="Loan-to-value ratio for refinance (max loan as % of ARV)"
            value={refinance.refiLtvPct * 100}
            onChange={(v) => updateRefinance({ refiLtvPct: v / 100 })}
            onBlur={() => touchField("refiLtvPct")}
            suffix="%"
            placeholder="75"
            min={50}
            max={85}
            error={getFieldError("refiLtvPct")}
            showError={shouldShowError("refiLtvPct")}
          />

          <InputField
            label="Refi Interest Rate"
            tooltip="Annual interest rate on permanent loan"
            value={refinance.refiInterestRate * 100}
            onChange={(v) => updateRefinance({ refiInterestRate: v / 100 })}
            suffix="%"
            placeholder="6.75"
            min={0}
            max={15}
          />

          <InputField
            label="Loan Term"
            tooltip="Loan amortization period"
            value={refinance.refiTermYears}
            onChange={(v) => updateRefinance({ refiTermYears: v })}
            suffix="years"
            placeholder="30"
            min={10}
            max={40}
          />

          <div className="space-y-2">
            <InputField
              label="Refi Closing Costs"
              tooltip="Closing costs for refinance"
              value={refinance.refiClosingCosts}
              onChange={(v) => updateRefinance({ refiClosingCosts: v })}
              prefix={refinance.refiClosingCostsIsPercent ? "" : "$"}
              suffix={refinance.refiClosingCostsIsPercent ? "%" : ""}
              placeholder={refinance.refiClosingCostsIsPercent ? "2" : "4800"}
            />
            <div className="flex items-center gap-2">
              <Switch
                id="refi-closing-pct"
                checked={refinance.refiClosingCostsIsPercent}
                onCheckedChange={(checked) => updateRefinance({ refiClosingCostsIsPercent: checked })}
              />
              <Label htmlFor="refi-closing-pct" className="text-sm text-muted-foreground">
                As percentage of loan
              </Label>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
            <Switch
              id="roll-closing"
              checked={refinance.rollClosingCostsIntoLoan}
              onCheckedChange={(checked) => updateRefinance({ rollClosingCostsIntoLoan: checked })}
            />
            <div>
              <Label htmlFor="roll-closing" className="text-foreground">
                Roll Closing Costs Into Loan
              </Label>
              <p className="text-xs text-muted-foreground">
                Reduces cash-out but increases loan balance
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
