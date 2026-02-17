import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, TrendingUp, TrendingDown } from "lucide-react";
import type { FinancialModelResult } from "@/lib/lease-redline/types";
import { FINANCIAL_MODEL_LABELS } from "@/lib/lease-redline/types";
import {
  formatCurrency,
  formatCurrencyPrecise,
  formatPercent,
} from "@/lib/lease-redline/financial-models";

interface FinancialModelCardProps {
  model: FinancialModelResult;
}

function RentEscalationDisplay({
  model,
}: {
  model: Extract<FinancialModelResult, { type: "rent_escalation" }>;
}) {
  const { inputs, results } = model;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Base Rent PSF:</span>{" "}
          <span className="font-medium">{formatCurrencyPrecise(inputs.baseRentPSF)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">SF:</span>{" "}
          <span className="font-medium">{inputs.squareFeet.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Term:</span>{" "}
          <span className="font-medium">{inputs.leaseTerm} years</span>
        </div>
        <div>
          <span className="text-muted-foreground">Escalation:</span>{" "}
          <span className="font-medium">
            {inputs.escalationType === "fixed_pct"
              ? formatPercent(inputs.escalationRate)
              : inputs.escalationType === "flat"
                ? "Flat"
                : inputs.escalationType === "cpi"
                  ? `CPI (${formatPercent(inputs.escalationRate)})`
                  : `$${inputs.escalationRate}/yr step`}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs bg-background rounded-md p-2">
        <div className="text-center">
          <div className="font-semibold text-foreground">{formatCurrency(results.totalRent)}</div>
          <div className="text-muted-foreground">Total Rent</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-foreground">{formatCurrencyPrecise(results.effectiveRentPSF)}</div>
          <div className="text-muted-foreground">Eff. Rent PSF</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-foreground">{formatCurrency(results.avgAnnualRent)}</div>
          <div className="text-muted-foreground">Avg Annual</div>
        </div>
      </div>
      {results.yearlySchedule.length <= 15 && (
        <div className="text-xs">
          <table className="w-full">
            <thead>
              <tr className="text-muted-foreground border-b">
                <th className="text-left py-1">Year</th>
                <th className="text-right py-1">Rent PSF</th>
                <th className="text-right py-1">Annual Rent</th>
              </tr>
            </thead>
            <tbody>
              {results.yearlySchedule.map((row) => (
                <tr key={row.year} className="border-b border-border/30">
                  <td className="py-0.5">{row.year}</td>
                  <td className="text-right">{formatCurrencyPrecise(row.rentPSF)}</td>
                  <td className="text-right">{formatCurrency(row.annualRent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TIAmortizationDisplay({
  model,
}: {
  model: Extract<FinancialModelResult, { type: "ti_amortization" }>;
}) {
  const { inputs, results } = model;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">TI Amount:</span>{" "}
          <span className="font-medium">{formatCurrency(inputs.tiAmount)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Rate:</span>{" "}
          <span className="font-medium">{formatPercent(inputs.interestRate)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Term:</span>{" "}
          <span className="font-medium">{inputs.leaseTerm} years</span>
        </div>
        <div>
          <span className="text-muted-foreground">Monthly Payment:</span>{" "}
          <span className="font-medium">{formatCurrencyPrecise(results.monthlyPayment)}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs bg-background rounded-md p-2">
        <div className="text-center">
          <div className="font-semibold text-foreground">{formatCurrency(results.totalCost)}</div>
          <div className="text-muted-foreground">Total Cost</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-foreground">{formatCurrency(results.totalInterest)}</div>
          <div className="text-muted-foreground">Total Interest</div>
        </div>
        {results.unamortizedAtTermination !== undefined && (
          <div className="text-center">
            <div className="font-semibold text-red-600">
              {formatCurrency(results.unamortizedAtTermination)}
            </div>
            <div className="text-muted-foreground">Unamortized</div>
          </div>
        )}
      </div>
    </div>
  );
}

function NOIImpactDisplay({
  model,
}: {
  model: Extract<FinancialModelResult, { type: "noi_impact" }>;
}) {
  const { results } = model;
  const isPositive = results.noiChange >= 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-xs bg-background rounded-md p-2">
        <div className="text-center">
          <div className="font-semibold text-foreground">{formatCurrency(results.originalNOI)}</div>
          <div className="text-muted-foreground">Original NOI</div>
        </div>
        <div className="text-center">
          <div className={`font-semibold flex items-center justify-center gap-1 ${isPositive ? "text-green-600" : "text-red-600"}`}>
            <Icon className="h-3 w-3" />
            {formatCurrency(Math.abs(results.noiChange))}
          </div>
          <div className="text-muted-foreground">
            NOI Change ({formatPercent(Math.abs(results.noiChangePct))})
          </div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-foreground">{formatCurrency(results.revisedNOI)}</div>
          <div className="text-muted-foreground">Revised NOI</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs bg-background rounded-md p-2">
        <div className="text-center">
          <div className="font-semibold">{formatCurrency(results.originalValue)}</div>
          <div className="text-muted-foreground">Original Value</div>
        </div>
        <div className="text-center">
          <div className={`font-semibold ${results.valueChange >= 0 ? "text-green-600" : "text-red-600"}`}>
            {results.valueChange >= 0 ? "+" : ""}{formatCurrency(results.valueChange)}
          </div>
          <div className="text-muted-foreground">Value Impact</div>
        </div>
      </div>
    </div>
  );
}

function EffectiveRentDisplay({
  model,
}: {
  model: Extract<FinancialModelResult, { type: "effective_rent" }>;
}) {
  const { results } = model;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2 text-xs bg-background rounded-md p-2">
        <div className="text-center">
          <div className="font-semibold text-foreground">{formatCurrency(results.grossRentTotal)}</div>
          <div className="text-muted-foreground">Gross Rent</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-red-600">-{formatCurrency(results.totalConcessions)}</div>
          <div className="text-muted-foreground">Concessions</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-green-600">{formatCurrency(results.netEffectiveRentTotal)}</div>
          <div className="text-muted-foreground">Net Effective</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <div className="font-medium">{formatCurrencyPrecise(results.netEffectiveRentPSF)}</div>
          <div className="text-muted-foreground">Net Eff PSF/yr</div>
        </div>
        <div className="text-center">
          <div className="font-medium">{formatCurrency(results.netEffectiveRentMonthly)}</div>
          <div className="text-muted-foreground">Net Eff/mo</div>
        </div>
        <div className="text-center">
          <div className="font-medium">{formatCurrency(results.landlordCostPerYear)}</div>
          <div className="text-muted-foreground">LL Cost/yr</div>
        </div>
      </div>
    </div>
  );
}

function CoTenancyImpactDisplay({
  model,
}: {
  model: Extract<FinancialModelResult, { type: "co_tenancy_impact" }>;
}) {
  const { results } = model;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 text-xs bg-background rounded-md p-2">
        <div className="text-center">
          <div className="font-semibold text-red-600">{formatCurrency(results.maxAnnualLoss)}</div>
          <div className="text-muted-foreground">Max Annual Loss</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-orange-600">{formatCurrency(results.expectedAnnualLoss)}</div>
          <div className="text-muted-foreground">Expected Annual Loss</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <div className="font-medium text-red-600">{formatCurrency(results.maxLossOverTerm)}</div>
          <div className="text-muted-foreground">Max Term Loss</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-orange-600">{formatCurrency(results.expectedLossOverTerm)}</div>
          <div className="text-muted-foreground">Expected Term Loss</div>
        </div>
        <div className="text-center">
          <div className="font-medium">{formatPercent(results.noiImpactPct)}</div>
          <div className="text-muted-foreground">NOI Impact</div>
        </div>
      </div>
    </div>
  );
}

export function FinancialModelCard({ model }: FinancialModelCardProps) {
  return (
    <Card className="bg-background/50 border-primary/10">
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-xs flex items-center gap-1.5">
          <Calculator className="h-3.5 w-3.5 text-primary" />
          {FINANCIAL_MODEL_LABELS[model.type]}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0">
        {model.type === "rent_escalation" && (
          <RentEscalationDisplay model={model} />
        )}
        {model.type === "ti_amortization" && (
          <TIAmortizationDisplay model={model} />
        )}
        {model.type === "noi_impact" && (
          <NOIImpactDisplay model={model} />
        )}
        {model.type === "effective_rent" && (
          <EffectiveRentDisplay model={model} />
        )}
        {model.type === "co_tenancy_impact" && (
          <CoTenancyImpactDisplay model={model} />
        )}
      </CardContent>
    </Card>
  );
}
