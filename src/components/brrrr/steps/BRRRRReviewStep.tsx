import { useBRRRR } from "@/contexts/BRRRRContext";
import { formatCurrency, formatPercent } from "@/lib/calculators/types";
import { CheckCircle2, AlertTriangle, DollarSign, TrendingUp, Home } from "lucide-react";

export function BRRRRReviewStep() {
  const { inputs } = useBRRRR();
  const { acquisition, bridgeFinancing, afterRepairValue, refinance, rentalOperations } = inputs;

  // Calculate quick preview numbers
  const downPayment = acquisition.purchasePrice * bridgeFinancing.downPaymentPct;
  const bridgeLoan = acquisition.purchasePrice - downPayment;
  const closingCosts = acquisition.closingCostsIsPercent 
    ? acquisition.purchasePrice * (acquisition.closingCosts / 100)
    : acquisition.closingCosts;
  const totalCashIn = downPayment + closingCosts + acquisition.rehabBudget + 
    (acquisition.monthlyHoldingCosts * acquisition.holdingPeriodMonths);
  
  const maxRefiLoan = afterRepairValue.arv * refinance.refiLtvPct;
  const estimatedCashOut = maxRefiLoan - bridgeLoan;
  const remainingCashIn = totalCashIn - estimatedCashOut;

  const egi = rentalOperations.monthlyRent * (1 - rentalOperations.vacancyPct);
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">
          Review Your Deal
        </h2>
        <p className="text-muted-foreground">
          Verify your inputs before running the analysis.
        </p>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Home className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">All-In Cost</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(acquisition.purchasePrice + acquisition.rehabBudget + closingCosts)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            vs ARV of {formatCurrency(afterRepairValue.arv)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Est. Cash Left In</span>
          </div>
          <p className={`text-2xl font-bold ${remainingCashIn <= 0 ? "text-primary" : "text-foreground"}`}>
            {formatCurrency(Math.max(0, remainingCashIn))}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {remainingCashIn <= 0 ? "All money back + profit!" : "Still in the deal"}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Monthly EGI</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(egi)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            After {formatPercent(rentalOperations.vacancyPct)} vacancy
          </p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Acquisition */}
        <div className="space-y-3 p-4 rounded-lg bg-muted/30">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Acquisition
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Purchase Price</dt>
              <dd className="text-foreground">{formatCurrency(acquisition.purchasePrice)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Rehab Budget</dt>
              <dd className="text-foreground">{formatCurrency(acquisition.rehabBudget)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Holding Period</dt>
              <dd className="text-foreground">{acquisition.holdingPeriodMonths} months</dd>
            </div>
          </dl>
        </div>

        {/* Financing */}
        <div className="space-y-3 p-4 rounded-lg bg-muted/30">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Bridge Financing
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Down Payment</dt>
              <dd className="text-foreground">{formatPercent(bridgeFinancing.downPaymentPct)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Interest Rate</dt>
              <dd className="text-foreground">{formatPercent(bridgeFinancing.interestRate)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Payment Type</dt>
              <dd className="text-foreground">{bridgeFinancing.isInterestOnly ? "Interest Only" : "Amortizing"}</dd>
            </div>
          </dl>
        </div>

        {/* Refinance */}
        <div className="space-y-3 p-4 rounded-lg bg-muted/30">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Refinance
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">ARV</dt>
              <dd className="text-foreground">{formatCurrency(afterRepairValue.arv)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">LTV</dt>
              <dd className="text-foreground">{formatPercent(refinance.refiLtvPct)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Interest Rate</dt>
              <dd className="text-foreground">{formatPercent(refinance.refiInterestRate)}</dd>
            </div>
          </dl>
        </div>

        {/* Rental */}
        <div className="space-y-3 p-4 rounded-lg bg-muted/30">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Rental Operations
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Monthly Rent</dt>
              <dd className="text-foreground">{formatCurrency(rentalOperations.monthlyRent)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Vacancy</dt>
              <dd className="text-foreground">{formatPercent(rentalOperations.vacancyPct)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Management</dt>
              <dd className="text-foreground">{formatPercent(rentalOperations.propertyManagementPct)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Warnings */}
      {afterRepairValue.arv > 0 && acquisition.purchasePrice + acquisition.rehabBudget > afterRepairValue.arv && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">All-in cost exceeds ARV</p>
            <p className="text-sm text-muted-foreground">
              Your total investment of {formatCurrency(acquisition.purchasePrice + acquisition.rehabBudget)} 
              exceeds the after-repair value of {formatCurrency(afterRepairValue.arv)}. This deal may not work as a BRRRR.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
