import { useUnderwriting } from "@/contexts/UnderwritingContext";
import { InputField } from "../InputField";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function FinancingStep() {
  const { inputs, updateFinancing } = useUnderwriting();
  const { financing } = inputs;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">
          Financing Terms
        </h2>
        <p className="text-muted-foreground">
          Configure your debt structure. Leave financing off for an all-cash analysis.
        </p>
      </div>

      {/* Financing Toggle */}
      <div className="flex items-center gap-3 p-4 bg-sage-light rounded-lg border border-primary/20">
        <Switch
          id="use-financing"
          checked={financing.useFinancing}
          onCheckedChange={(checked) => updateFinancing({ useFinancing: checked })}
        />
        <div>
          <Label htmlFor="use-financing" className="text-sm font-medium">
            Use Financing
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            {financing.useFinancing 
              ? "Debt is included in the analysis" 
              : "All-cash purchase (no debt)"
            }
          </p>
        </div>
      </div>

      {financing.useFinancing && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <InputField
              label={financing.useLtv ? "Loan-to-Value (LTV)" : "Loan Amount"}
              tooltip={financing.useLtv 
                ? "Percentage of purchase price financed by debt" 
                : "Total loan amount in dollars"
              }
              value={financing.useLtv ? financing.loanLtv : financing.loanAmount}
              onChange={(v) => financing.useLtv 
                ? updateFinancing({ loanLtv: v }) 
                : updateFinancing({ loanAmount: v })
              }
              prefix={financing.useLtv ? undefined : "$"}
              suffix={financing.useLtv ? "%" : undefined}
              placeholder={financing.useLtv ? "75" : "750000"}
            />
            <div className="flex items-center gap-2">
              <Switch
                id="loan-type"
                checked={financing.useLtv}
                onCheckedChange={(checked) => updateFinancing({ useLtv: checked })}
              />
              <Label htmlFor="loan-type" className="text-sm text-muted-foreground">
                Enter as LTV percentage
              </Label>
            </div>
          </div>

          <InputField
            label="Interest Rate"
            tooltip="Annual interest rate on the loan"
            value={financing.interestRateAnnual}
            onChange={(v) => updateFinancing({ interestRateAnnual: v })}
            suffix="%"
            placeholder="7"
            min={0}
            max={20}
            step={0.125}
          />

          <InputField
            label="Amortization Period"
            tooltip="Years over which the loan is amortized"
            value={financing.amortizationYears}
            onChange={(v) => updateFinancing({ amortizationYears: v })}
            suffix="years"
            placeholder="30"
            min={5}
            max={40}
          />

          <InputField
            label="Loan Term"
            tooltip="Actual loan term (maturity) in months"
            value={financing.loanTermMonths}
            onChange={(v) => updateFinancing({ loanTermMonths: v })}
            suffix="months"
            placeholder="60"
            min={12}
            max={360}
          />

          <InputField
            label="Origination Fee"
            tooltip="Lender fee as percentage of loan amount"
            value={financing.loanOriginationFeePct}
            onChange={(v) => updateFinancing({ loanOriginationFeePct: v })}
            suffix="%"
            placeholder="1"
            min={0}
            max={5}
            step={0.25}
          />

          <InputField
            label="Interest-Only Period"
            tooltip="Initial months with interest-only payments"
            value={financing.interestOnlyMonths}
            onChange={(v) => updateFinancing({ interestOnlyMonths: v })}
            suffix="months"
            placeholder="12"
            min={0}
            max={60}
          />
        </div>
      )}

      {!financing.useFinancing && (
        <div className="p-6 bg-muted/50 rounded-lg text-center">
          <p className="text-muted-foreground">
            Running as an all-cash analysis. Enable financing above to model debt.
          </p>
        </div>
      )}
    </div>
  );
}
