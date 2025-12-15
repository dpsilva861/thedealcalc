import { useUnderwriting } from "@/contexts/UnderwritingContext";
import { formatCurrency, formatPercent } from "@/lib/underwriting";
import { 
  Building2, 
  Coins, 
  Wrench, 
  CreditCard, 
  Home,
  TrendingUp 
} from "lucide-react";

export function ReviewStep() {
  const { inputs } = useUnderwriting();
  const { acquisition, income, expenses, renovation, financing } = inputs;

  const closingCostsDisplay = acquisition.closingCostsIsPercent
    ? `${acquisition.closingCosts}% of purchase price`
    : formatCurrency(acquisition.closingCosts);

  const loanDisplay = financing.useLtv
    ? `${financing.loanLtv}% LTV`
    : formatCurrency(financing.loanAmount);

  const sections = [
    {
      icon: Building2,
      title: "Acquisition",
      items: [
        { label: "Purchase Price", value: formatCurrency(acquisition.purchasePrice) },
        { label: "Closing Costs", value: closingCostsDisplay },
        { label: "Hold Period", value: `${acquisition.holdPeriodMonths} months` },
        { label: "Exit Cap Rate", value: formatPercent(acquisition.exitCapRate) },
      ],
    },
    {
      icon: Coins,
      title: "Income",
      items: [
        { label: "Units", value: income.unitCount.toString() },
        { label: "In-Place Rent", value: `${formatCurrency(income.inPlaceMonthlyRentPerUnit)}/unit` },
        { label: "Market Rent", value: `${formatCurrency(income.marketMonthlyRentPerUnit)}/unit` },
        { label: "Vacancy", value: formatPercent(income.economicVacancyPct) },
      ],
    },
    {
      icon: Wrench,
      title: "Expenses",
      items: [
        { label: "Property Taxes", value: `${formatCurrency(expenses.propertyTaxesAnnual)}/yr` },
        { label: "Insurance", value: `${formatCurrency(expenses.insuranceAnnual)}/yr` },
        { label: "Management", value: `${expenses.propertyMgmtPctOfEgi}% of EGI` },
        { label: "Reserves", value: `${formatCurrency(expenses.replacementReservesAnnual)}/yr` },
      ],
    },
    {
      icon: Home,
      title: "Renovation",
      items: [
        { label: "Budget", value: formatCurrency(renovation.renoBudgetTotal) },
        { label: "Duration", value: `${renovation.renoDurationMonths} months` },
        { label: "Rent Loss", value: formatPercent(renovation.renoRentLossPct * 100) },
        { label: "Lease-Up", value: `${renovation.leaseUpMonthsAfterReno} months` },
      ],
    },
    {
      icon: CreditCard,
      title: "Financing",
      items: financing.useFinancing ? [
        { label: "Loan", value: loanDisplay },
        { label: "Interest Rate", value: formatPercent(financing.interestRateAnnual) },
        { label: "Amortization", value: `${financing.amortizationYears} years` },
        { label: "I/O Period", value: `${financing.interestOnlyMonths} months` },
      ] : [
        { label: "Structure", value: "All Cash" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">
          Review Your Inputs
        </h2>
        <p className="text-muted-foreground">
          Confirm all assumptions before running the analysis.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <div 
            key={section.title}
            className="p-5 rounded-xl bg-card border border-border shadow-card"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sage-light text-primary">
                <section.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">{section.title}</h3>
            </div>
            <dl className="space-y-2">
              {section.items.map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <dt className="text-muted-foreground">{item.label}</dt>
                  <dd className="font-medium text-foreground">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <div className="p-4 bg-sage-light rounded-lg border border-primary/20">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-primary" />
          <p className="text-sm text-foreground">
            <strong>Ready to run?</strong> Click "Run Analysis" below to generate your 
            complete underwriting report with cash flows, metrics, and sensitivity tables.
          </p>
        </div>
      </div>
    </div>
  );
}
