import { useBRRRR } from "@/contexts/BRRRRContext";
import { InputField } from "@/components/underwriting/InputField";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function BRRRRRentalStep() {
  const { inputs, updateRentalOperations } = useBRRRR();
  const { rentalOperations } = inputs;

  return (
    <div className="space-y-8">
      {/* Income Section */}
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">
          Rental Operations
        </h2>
        <p className="text-muted-foreground mb-6">
          Projected rental income and operating expenses.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <InputField
            label="Monthly Rent"
            tooltip="Expected monthly rental income"
            value={rentalOperations.monthlyRent}
            onChange={(v) => updateRentalOperations({ monthlyRent: v })}
            prefix="$"
            suffix="/mo"
            placeholder="2450"
          />

          <InputField
            label="Vacancy Rate"
            tooltip="Expected vacancy as percentage of rent"
            value={rentalOperations.vacancyPct * 100}
            onChange={(v) => updateRentalOperations({ vacancyPct: v / 100 })}
            suffix="%"
            placeholder="5"
            min={0}
            max={50}
          />
        </div>
      </div>

      {/* Expense Base Selection */}
      <div className="p-4 rounded-lg bg-muted/50">
        <Label className="text-foreground font-medium mb-3 block">
          Calculate % Expenses Based On:
        </Label>
        <RadioGroup
          value={rentalOperations.expenseBase}
          onValueChange={(v) => updateRentalOperations({ expenseBase: v as "gross_rent" | "egi" })}
          className="flex gap-6"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="egi" id="egi" />
            <Label htmlFor="egi" className="text-muted-foreground cursor-pointer">
              Effective Gross Income (Recommended)
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="gross_rent" id="gross_rent" />
            <Label htmlFor="gross_rent" className="text-muted-foreground cursor-pointer">
              Gross Rent
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Variable Expenses */}
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-4">
          Variable Expenses (% of {rentalOperations.expenseBase === "egi" ? "EGI" : "Gross Rent"})
        </h3>

        <div className="grid gap-6 md:grid-cols-2">
          <InputField
            label="Property Management"
            tooltip="Property management fee as percentage"
            value={rentalOperations.propertyManagementPct * 100}
            onChange={(v) => updateRentalOperations({ propertyManagementPct: v / 100 })}
            suffix="%"
            placeholder="8"
            min={0}
            max={20}
          />

          <InputField
            label="Maintenance"
            tooltip="Ongoing maintenance and repairs"
            value={rentalOperations.maintenancePct * 100}
            onChange={(v) => updateRentalOperations({ maintenancePct: v / 100 })}
            suffix="%"
            placeholder="7"
            min={0}
            max={20}
          />
        </div>
      </div>

      {/* Fixed Expenses */}
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-4">
          Fixed Monthly Expenses
        </h3>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <InputField
            label="Insurance"
            tooltip="Monthly insurance premium"
            value={rentalOperations.insuranceMonthly}
            onChange={(v) => updateRentalOperations({ insuranceMonthly: v })}
            prefix="$"
            suffix="/mo"
            placeholder="135"
          />

          <InputField
            label="Property Taxes"
            tooltip="Monthly property tax payment"
            value={rentalOperations.propertyTaxesMonthly}
            onChange={(v) => updateRentalOperations({ propertyTaxesMonthly: v })}
            prefix="$"
            suffix="/mo"
            placeholder="250"
          />

          <InputField
            label="Utilities (Owner Paid)"
            tooltip="Utilities paid by owner, if any"
            value={rentalOperations.utilitiesMonthly}
            onChange={(v) => updateRentalOperations({ utilitiesMonthly: v })}
            prefix="$"
            suffix="/mo"
            placeholder="0"
          />

          <InputField
            label="HOA"
            tooltip="Monthly HOA dues, if any"
            value={rentalOperations.hoaMonthly}
            onChange={(v) => updateRentalOperations({ hoaMonthly: v })}
            prefix="$"
            suffix="/mo"
            placeholder="0"
          />

          <InputField
            label="Other Expenses"
            tooltip="Any other monthly expenses"
            value={rentalOperations.otherMonthly}
            onChange={(v) => updateRentalOperations({ otherMonthly: v })}
            prefix="$"
            suffix="/mo"
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );
}
