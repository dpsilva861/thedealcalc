import { useUnderwriting } from "@/contexts/UnderwritingContext";
import { InputField } from "../InputField";

export function RenovationStep() {
  const { inputs, updateRenovation } = useUnderwriting();
  const { renovation } = inputs;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">
          Renovation & Lease-Up
        </h2>
        <p className="text-muted-foreground">
          Model renovation spending, rent loss during construction, and lease-up timeline.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <InputField
          label="Total Renovation Budget"
          tooltip="Total capital expenditure for renovations"
          value={renovation.renoBudgetTotal}
          onChange={(v) => updateRenovation({ renoBudgetTotal: v })}
          prefix="$"
          placeholder="50000"
        />

        <InputField
          label="Renovation Duration"
          tooltip="Number of months to complete renovations"
          value={renovation.renoDurationMonths}
          onChange={(v) => updateRenovation({ renoDurationMonths: v })}
          suffix="months"
          placeholder="6"
          min={0}
          max={36}
        />

        <InputField
          label="Rent Loss During Reno"
          tooltip="Percentage of rent lost during renovation period"
          value={renovation.renoRentLossPct * 100}
          onChange={(v) => updateRenovation({ renoRentLossPct: v / 100 })}
          suffix="%"
          placeholder="50"
          min={0}
          max={100}
        />

        <InputField
          label="Lease-Up Period"
          tooltip="Months needed to stabilize occupancy after renovations"
          value={renovation.leaseUpMonthsAfterReno}
          onChange={(v) => updateRenovation({ leaseUpMonthsAfterReno: v })}
          suffix="months"
          placeholder="3"
          min={0}
          max={24}
        />

        <InputField
          label="Leasing Commission"
          tooltip="Commission paid for new leases as % of first month's rent"
          value={renovation.leasingCommissionPctOfNewLease}
          onChange={(v) => updateRenovation({ leasingCommissionPctOfNewLease: v })}
          suffix="%"
          placeholder="50"
          min={0}
          max={200}
        />

        <InputField
          label="Make Ready Cost"
          tooltip="Cost to prepare each unit between tenants"
          value={renovation.makeReadyPerUnit}
          onChange={(v) => updateRenovation({ makeReadyPerUnit: v })}
          prefix="$"
          suffix="/unit"
          placeholder="500"
        />
      </div>

      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Note:</strong> Renovation budget is spread evenly 
          over the renovation duration. During renovation months, rent is reduced by the specified 
          loss percentage. During lease-up, units are assumed 100% vacant.
        </p>
      </div>
    </div>
  );
}
