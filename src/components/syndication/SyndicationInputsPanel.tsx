import { useSyndication } from "@/contexts/SyndicationContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Play, RotateCcw } from "lucide-react";
import { formatCurrency } from "@/lib/calculators/types";

export default function SyndicationInputsPanel() {
  const { inputs, setInputs, runAnalysis, resetInputs, isCalculating } = useSyndication();

  const updateAcquisition = (field: string, value: any) => {
    setInputs((prev) => ({
      ...prev,
      acquisition: { ...prev.acquisition, [field]: value },
    }));
  };

  const updateDebt = (field: string, value: any) => {
    setInputs((prev) => ({
      ...prev,
      debt: { ...prev.debt, [field]: value },
    }));
  };

  const updateEquity = (field: string, value: any) => {
    setInputs((prev) => ({
      ...prev,
      equity: { ...prev.equity, [field]: value },
    }));
  };

  const updateProforma = (field: string, value: any) => {
    setInputs((prev) => ({
      ...prev,
      proforma: { ...prev.proforma, [field]: value },
    }));
  };

  const updateExit = (field: string, value: any) => {
    setInputs((prev) => ({
      ...prev,
      exit: { ...prev.exit, [field]: value },
    }));
  };

  const updateWaterfall = (field: string, value: any) => {
    setInputs((prev) => ({
      ...prev,
      waterfall: { ...prev.waterfall, [field]: value },
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Deal Assumptions</CardTitle>
            <CardDescription>
              Configure acquisition, debt, operations, exit, and waterfall structure
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetInputs}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button size="sm" onClick={runAnalysis} disabled={isCalculating}>
              <Play className="h-4 w-4 mr-1" />
              {isCalculating ? "Calculating..." : "Run Analysis"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={["acquisition", "debt", "operations"]} className="space-y-2">
          {/* Acquisition Section */}
          <AccordionItem value="acquisition" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="font-semibold">Acquisition & Sources/Uses</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Define purchase price and closing costs. These flow into the Sources & Uses table.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Purchase Price</Label>
                    <Tooltip>
                      <TooltipTrigger><HelpCircle className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>Total acquisition price for the property</TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    type="number"
                    value={inputs.acquisition.purchase_price}
                    onChange={(e) => updateAcquisition("purchase_price", Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Closing Costs (%)</Label>
                    <Tooltip>
                      <TooltipTrigger><HelpCircle className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>Title, escrow, legal fees as % of purchase price</TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    type="number"
                    step="0.001"
                    value={inputs.acquisition.closing_costs_pct * 100}
                    onChange={(e) => updateAcquisition("closing_costs_pct", Number(e.target.value) / 100)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>CapEx Budget</Label>
                  <Input
                    type="number"
                    value={inputs.acquisition.capex_budget_total}
                    onChange={(e) => updateAcquisition("capex_budget_total", Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Initial Reserves</Label>
                  <Input
                    type="number"
                    value={inputs.acquisition.initial_reserves}
                    onChange={(e) => updateAcquisition("initial_reserves", Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Acquisition Fee (%)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={inputs.acquisition.acquisition_fee_value * 100}
                    onChange={(e) => updateAcquisition("acquisition_fee_value", Number(e.target.value) / 100)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Organizational Costs</Label>
                  <Input
                    type="number"
                    value={inputs.acquisition.organizational_costs}
                    onChange={(e) => updateAcquisition("organizational_costs", Number(e.target.value))}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Debt Section */}
          <AccordionItem value="debt" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="font-semibold">Debt Structure</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Configure loan terms. Loan amount = LTV × Purchase Price. Monthly payment uses standard amortization formula.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Financing Type</Label>
                  <Select
                    value={inputs.debt.financing_type}
                    onValueChange={(v) => updateDebt("financing_type", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Debt</SelectItem>
                      <SelectItem value="amortizing">Fully Amortizing</SelectItem>
                      <SelectItem value="interest_only_then_amort">I/O then Amortizing</SelectItem>
                      <SelectItem value="bridge_interest_only">Bridge (I/O Only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>LTV (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={inputs.debt.ltv_or_ltc_pct * 100}
                    onChange={(e) => updateDebt("ltv_or_ltc_pct", Number(e.target.value) / 100)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Interest Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={inputs.debt.interest_rate_annual * 100}
                    onChange={(e) => updateDebt("interest_rate_annual", Number(e.target.value) / 100)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Amortization (Years)</Label>
                  <Input
                    type="number"
                    value={inputs.debt.amort_years}
                    onChange={(e) => updateDebt("amort_years", Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>I/O Period (Months)</Label>
                  <Input
                    type="number"
                    value={inputs.debt.interest_only_months}
                    onChange={(e) => updateDebt("interest_only_months", Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Loan Term (Months)</Label>
                  <Input
                    type="number"
                    value={inputs.debt.loan_term_months}
                    onChange={(e) => updateDebt("loan_term_months", Number(e.target.value))}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Equity Section */}
          <AccordionItem value="equity" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="font-semibold">Capital Stack (LP/GP)</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Split equity between LP and GP. Total Equity = Total Uses - Loan Amount.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>LP Equity (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={inputs.equity.lp_equity_pct * 100}
                    onChange={(e) => {
                      const lp = Number(e.target.value) / 100;
                      updateEquity("lp_equity_pct", lp);
                      updateEquity("gp_equity_pct", 1 - lp);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>GP Equity (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={inputs.equity.gp_equity_pct * 100}
                    onChange={(e) => {
                      const gp = Number(e.target.value) / 100;
                      updateEquity("gp_equity_pct", gp);
                      updateEquity("lp_equity_pct", 1 - gp);
                    }}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Operations Section */}
          <AccordionItem value="operations" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="font-semibold">Operations Pro Forma</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Monthly income and expenses. NOI = EGI - OpEx - PM Fee. Cash grows at specified annual rates.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Unit Count</Label>
                  <Input
                    type="number"
                    value={inputs.proforma.unit_count}
                    onChange={(e) => updateProforma("unit_count", Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Avg Rent/Unit (Month 1)</Label>
                  <Input
                    type="number"
                    value={inputs.proforma.avg_rent_month1}
                    onChange={(e) => updateProforma("avg_rent_month1", Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Other Income (Month 1)</Label>
                  <Input
                    type="number"
                    value={inputs.proforma.other_income_month1}
                    onChange={(e) => updateProforma("other_income_month1", Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Vacancy (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={inputs.proforma.vacancy_rate * 100}
                    onChange={(e) => updateProforma("vacancy_rate", Number(e.target.value) / 100)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rent Growth (%/yr)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={inputs.proforma.rent_growth_annual * 100}
                    onChange={(e) => updateProforma("rent_growth_annual", Number(e.target.value) / 100)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Expense Growth (%/yr)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={inputs.proforma.expense_growth_annual * 100}
                    onChange={(e) => updateProforma("expense_growth_annual", Number(e.target.value) / 100)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>PM Fee (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={inputs.proforma.property_management_fee_pct * 100}
                    onChange={(e) => updateProforma("property_management_fee_pct", Number(e.target.value) / 100)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Replacement Reserves ($/mo)</Label>
                  <Input
                    type="number"
                    value={inputs.proforma.replacement_reserves_monthly}
                    onChange={(e) => updateProforma("replacement_reserves_monthly", Number(e.target.value))}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Exit Section */}
          <AccordionItem value="exit" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="font-semibold">Exit / Sale</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Exit value = Annualized NOI ÷ Exit Cap Rate. Net proceeds = Sale Price - Costs - Loan Payoff.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hold Period (Months)</Label>
                  <Input
                    type="number"
                    value={inputs.hold_period_months}
                    onChange={(e) => setInputs(prev => ({ ...prev, hold_period_months: Number(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sale Month</Label>
                  <Input
                    type="number"
                    value={inputs.exit.sale_month}
                    onChange={(e) => updateExit("sale_month", Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Exit Cap Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={inputs.exit.exit_cap_rate * 100}
                    onChange={(e) => updateExit("exit_cap_rate", Number(e.target.value) / 100)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sale Costs (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={inputs.exit.sale_cost_pct * 100}
                    onChange={(e) => updateExit("sale_cost_pct", Number(e.target.value) / 100)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Disposition Fee (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={inputs.exit.disposition_fee_pct * 100}
                    onChange={(e) => updateExit("disposition_fee_pct", Number(e.target.value) / 100)}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Waterfall Section */}
          <AccordionItem value="waterfall" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="font-semibold">Waterfall Structure</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Cash flows through: ROC → Pref Return → (Catch-up) → Promote Tiers.
                Pref accrues monthly: Accrual = LP Unreturned Capital × (Annual Rate ÷ 12).
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preferred Return (%/yr)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={inputs.waterfall.pref_rate_annual * 100}
                    onChange={(e) => updateWaterfall("pref_rate_annual", Number(e.target.value) / 100)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>ROC Mode</Label>
                  <Select
                    value={inputs.waterfall.roc_mode}
                    onValueChange={(v) => updateWaterfall("roc_mode", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pro_rata">Pro Rata</SelectItem>
                      <SelectItem value="lp_first">LP First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Waterfall Variant</Label>
                  <Select
                    value={inputs.waterfall.variant}
                    onValueChange={(v) => updateWaterfall("variant", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="em_hurdles">Equity Multiple Hurdles</SelectItem>
                      <SelectItem value="pref_roc_promote">Pref + ROC + Promote</SelectItem>
                      <SelectItem value="pref_roc_catchup_promote">With Catch-Up</SelectItem>
                      <SelectItem value="irr_hurdles">IRR Hurdles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4">
                <Label className="text-sm font-medium">Promote Tiers</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Configure LP/GP splits at each equity multiple hurdle.
                </p>
                <div className="space-y-2">
                  {inputs.waterfall.tiers.map((tier, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded">
                      <span className="w-20">Tier {idx + 1}:</span>
                      <span className="text-muted-foreground">
                        {tier.tier_type === "equity_multiple" ? `≥${tier.hurdle}x EM` : "Remaining"}
                      </span>
                      <span className="ml-auto">
                        LP {(tier.lp_split * 100).toFixed(0)}% / GP {(tier.gp_split * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
