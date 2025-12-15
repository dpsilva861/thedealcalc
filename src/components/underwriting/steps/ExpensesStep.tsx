import { useUnderwriting } from "@/contexts/UnderwritingContext";
import { InputField } from "../InputField";

export function ExpensesStep() {
  const { inputs, updateExpenses } = useUnderwriting();
  const { expenses } = inputs;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">
          Operating Expenses
        </h2>
        <p className="text-muted-foreground">
          Enter annual operating costs. These will be spread monthly in the model.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <InputField
          label="Property Taxes"
          tooltip="Annual real estate taxes"
          value={expenses.propertyTaxesAnnual}
          onChange={(v) => updateExpenses({ propertyTaxesAnnual: v })}
          prefix="$"
          suffix="/year"
          placeholder="12000"
        />

        <InputField
          label="Insurance"
          tooltip="Annual property insurance premium"
          value={expenses.insuranceAnnual}
          onChange={(v) => updateExpenses({ insuranceAnnual: v })}
          prefix="$"
          suffix="/year"
          placeholder="6000"
        />

        <InputField
          label="Repairs & Maintenance"
          tooltip="Annual repairs and general maintenance budget"
          value={expenses.repairsMaintenanceAnnual}
          onChange={(v) => updateExpenses({ repairsMaintenanceAnnual: v })}
          prefix="$"
          suffix="/year"
          placeholder="6000"
        />

        <InputField
          label="Property Management"
          tooltip="Management fee as percentage of Effective Gross Income"
          value={expenses.propertyMgmtPctOfEgi}
          onChange={(v) => updateExpenses({ propertyMgmtPctOfEgi: v })}
          suffix="% of EGI"
          placeholder="8"
          min={0}
          max={20}
        />

        <InputField
          label="Utilities"
          tooltip="Annual utilities paid by owner (if any)"
          value={expenses.utilitiesAnnual}
          onChange={(v) => updateExpenses({ utilitiesAnnual: v })}
          prefix="$"
          suffix="/year"
          placeholder="3600"
        />

        <InputField
          label="HOA / Condo Fees"
          tooltip="Annual HOA or condo association fees (if applicable)"
          value={expenses.hoaAnnual}
          onChange={(v) => updateExpenses({ hoaAnnual: v })}
          prefix="$"
          suffix="/year"
          placeholder="0"
        />

        <InputField
          label="Replacement Reserves"
          tooltip="Annual capital reserve for major repairs (roof, HVAC, etc.)"
          value={expenses.replacementReservesAnnual}
          onChange={(v) => updateExpenses({ replacementReservesAnnual: v })}
          prefix="$"
          suffix="/year"
          placeholder="3000"
        />

        <InputField
          label="Other Expenses"
          tooltip="Miscellaneous annual operating expenses"
          value={expenses.otherExpensesAnnual}
          onChange={(v) => updateExpenses({ otherExpensesAnnual: v })}
          prefix="$"
          suffix="/year"
          placeholder="2400"
        />
      </div>

      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Tip:</strong> The model converts annual expenses 
          to monthly figures automatically. Property management is calculated as a percentage 
          of Effective Gross Income (EGI) each month.
        </p>
      </div>
    </div>
  );
}
