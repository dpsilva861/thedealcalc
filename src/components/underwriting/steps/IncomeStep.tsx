import { useUnderwriting } from "@/contexts/UnderwritingContext";
import { InputField } from "../InputField";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function IncomeStep() {
  const { inputs, updateIncome } = useUnderwriting();
  const { income } = inputs;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">
          Income & Rent Roll
        </h2>
        <p className="text-muted-foreground">
          Define rent levels, vacancy, and income growth assumptions.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <InputField
          label="Unit Count"
          tooltip="Total number of residential units"
          value={income.unitCount}
          onChange={(v) => updateIncome({ unitCount: v })}
          placeholder="10"
          min={1}
        />

        <InputField
          label="In-Place Monthly Rent"
          tooltip="Current average rent per unit at acquisition"
          value={income.inPlaceMonthlyRentPerUnit}
          onChange={(v) => updateIncome({ inPlaceMonthlyRentPerUnit: v })}
          prefix="$"
          suffix="/unit"
          placeholder="1200"
        />

        <InputField
          label="Market Monthly Rent"
          tooltip="Expected rent per unit after stabilization"
          value={income.marketMonthlyRentPerUnit}
          onChange={(v) => updateIncome({ marketMonthlyRentPerUnit: v })}
          prefix="$"
          suffix="/unit"
          placeholder="1400"
        />

        <InputField
          label="Other Monthly Income"
          tooltip="Parking, laundry, storage, pet fees, etc."
          value={income.otherMonthlyIncome}
          onChange={(v) => updateIncome({ otherMonthlyIncome: v })}
          prefix="$"
          placeholder="200"
        />

        <InputField
          label="Annual Rent Growth"
          tooltip="Expected year-over-year rent increase"
          value={income.rentGrowthAnnualPct}
          onChange={(v) => updateIncome({ rentGrowthAnnualPct: v })}
          suffix="%"
          placeholder="3"
          min={0}
          max={20}
          step={0.5}
        />

        <InputField
          label="Economic Vacancy"
          tooltip="Expected long-term vacancy rate"
          value={income.economicVacancyPct}
          onChange={(v) => updateIncome({ economicVacancyPct: v })}
          suffix="%"
          placeholder="5"
          min={0}
          max={50}
        />

        <InputField
          label="Bad Debt / Loss to Lease"
          tooltip="Expected collection loss as % of collectible rent"
          value={income.badDebtPct}
          onChange={(v) => updateIncome({ badDebtPct: v })}
          suffix="%"
          placeholder="1"
          min={0}
          max={20}
        />

        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
          <Switch
            id="market-rent-immediate"
            checked={income.useMarketRentImmediately}
            onCheckedChange={(checked) => updateIncome({ useMarketRentImmediately: checked })}
          />
          <div>
            <Label htmlFor="market-rent-immediate" className="text-sm font-medium">
              Use market rent immediately
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Otherwise, transition to market after reno/lease-up
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
