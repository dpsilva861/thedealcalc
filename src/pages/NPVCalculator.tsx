/**
 * NPV Calculator Page
 * 
 * Full-featured Net Present Value calculator with:
 * - Single recurring and custom cash flow modes
 * - Multiple period frequencies
 * - Beginning/end of period timing
 * - Detailed breakdown table
 * - Export functionality
 */

import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { NPVProvider, useNPV } from '@/contexts/NPVContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalculatorSelector } from '@/components/calculators/CalculatorSelector';
import { ExportDropdown } from '@/components/exports/ExportDropdown';
import { transformNPVToCanonical } from '@/lib/exports/npvTransformer';
import { exportNPVToExcel, exportNPVToCSV, exportNPVToPDF } from '@/lib/calculators/npv/exports';
import { formatCurrency, formatPercent } from '@/lib/calculators/types';
import { trackEvent } from '@/lib/analytics';
import { devLog } from '@/lib/devLogger';
import {
  Calculator,
  Play,
  RotateCcw,
  Lightbulb,
  Plus,
  Trash2,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function NPVCalculatorContent() {
  const {
    inputs,
    results,
    updateInputs,
    runAnalysis,
    resetInputs,
    loadExample,
    addCustomCashFlow,
    removeCustomCashFlow,
    updateCustomCashFlow,
  } = useNPV();

  const [showDiscountFactors, setShowDiscountFactors] = useState(false);

  useEffect(() => {
    trackEvent('page_view', { page: '/npv-calculator' });
  }, []);

  // Helper to handle numeric input
  const handleNumberChange = (
    field: keyof typeof inputs,
    value: string,
    isPercent = false
  ) => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      updateInputs({ [field]: 0 });
    } else {
      updateInputs({ [field]: isPercent ? num / 100 : num });
    }
  };

  const handleRunAnalysis = () => {
    devLog.analysisStarted('NPV');
    trackEvent('calculate_npv', {
      mode: inputs.cashFlowMode,
      frequency: inputs.periodFrequency,
      periods: inputs.cashFlowMode === 'single_recurring' 
        ? inputs.numberOfPeriods 
        : inputs.customCashFlows.length - 1,
    });
    runAnalysis();
  };

  // Export handlers
  const handleExportPDF = async () => {
    if (!results) return;
    devLog.exportClicked('NPV', 'pdf');
    exportNPVToPDF({ inputs, results });
    trackEvent('export_pdf', { calculator: 'npv' });
  };

  const handleExportCSV = () => {
    if (!results) return;
    devLog.exportClicked('NPV', 'csv');
    exportNPVToCSV({ inputs, results });
    trackEvent('export_csv', { calculator: 'npv' });
  };

  const handleExportExcel = async () => {
    if (!results) return;
    devLog.exportClicked('NPV', 'excel');
    await exportNPVToExcel({ inputs, results });
    trackEvent('export_excel', { calculator: 'npv' });
  };

  const handleExportDocx = async () => {
    if (!results) return;
    devLog.exportClicked('NPV', 'docx');
    const { exportToDocx } = await import('@/lib/exports/docx');
    const canonicalData = transformNPVToCanonical(inputs, results);
    await exportToDocx(canonicalData);
  };

  const handleExportPptx = async () => {
    if (!results) return;
    devLog.exportClicked('NPV', 'pptx');
    const { exportToPptx } = await import('@/lib/exports/pptx');
    const canonicalData = transformNPVToCanonical(inputs, results);
    await exportToPptx(canonicalData);
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'annual': return 'Year';
      case 'monthly': return 'Month';
      case 'quarterly': return 'Quarter';
      default: return 'Period';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-3">
            <Calculator className="h-8 w-8 text-primary" />
            NPV Calculator
          </h1>
          <p className="text-muted-foreground mt-1">
            Calculate Net Present Value for investment decisions
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <CalculatorSelector />
          {results && (
            <ExportDropdown
              calculatorType="underwriting"
              onExportExcel={handleExportExcel}
              onExportCSV={handleExportCSV}
              onExportPDF={handleExportPDF}
              onExportDocx={handleExportDocx}
              onExportPptx={handleExportPptx}
            />
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-6">
          {/* Core Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Discount Rate & Settings</CardTitle>
              <CardDescription>Configure calculation parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Discount Rate */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="discountRate">Annual Discount Rate</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>The required rate of return used to discount future cash flows. Common values: 8-12% for real estate, 15-25% for venture capital.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="relative">
                  <Input
                    id="discountRate"
                    type="number"
                    value={(inputs.discountRateAnnual * 100).toFixed(2)}
                    onChange={(e) => handleNumberChange('discountRateAnnual', e.target.value, true)}
                    step="0.5"
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>

              {/* Period Frequency */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Period Frequency</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>The annual rate is converted to a periodic rate: r_periodic = (1 + r_annual)^(1/m) - 1</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select
                  value={inputs.periodFrequency}
                  onValueChange={(v) => updateInputs({ periodFrequency: v as typeof inputs.periodFrequency })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Timing Convention */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Timing Convention</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>End-of-period: cash flows occur at period end (standard). Beginning-of-period: cash flows occur at period start (annuity due).</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select
                  value={inputs.timingConvention}
                  onValueChange={(v) => updateInputs({ timingConvention: v as typeof inputs.timingConvention })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="end_of_period">End of Period</SelectItem>
                    <SelectItem value="beginning_of_period">Beginning of Period</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Cash Flow Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cash Flows</CardTitle>
              <CardDescription>Enter your investment cash flows</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mode Tabs */}
              <Tabs
                value={inputs.cashFlowMode}
                onValueChange={(v) => updateInputs({ cashFlowMode: v as typeof inputs.cashFlowMode })}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="single_recurring">Single + Recurring</TabsTrigger>
                  <TabsTrigger value="custom_series">Custom Series</TabsTrigger>
                </TabsList>

                <TabsContent value="single_recurring" className="space-y-4 mt-4">
                  {/* Initial Investment */}
                  <div className="space-y-2">
                    <Label htmlFor="initialInvestment">Initial Investment (CF₀)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="initialInvestment"
                        type="number"
                        value={inputs.initialInvestment}
                        onChange={(e) => handleNumberChange('initialInvestment', e.target.value)}
                        className="pl-8"
                        placeholder="-100000"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Typically negative for outgoing investment</p>
                  </div>

                  {/* Periodic Cash Flow */}
                  <div className="space-y-2">
                    <Label htmlFor="periodicCashFlow">Periodic Cash Flow</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="periodicCashFlow"
                        type="number"
                        value={inputs.periodicCashFlow}
                        onChange={(e) => handleNumberChange('periodicCashFlow', e.target.value)}
                        className="pl-8"
                        placeholder="25000"
                      />
                    </div>
                  </div>

                  {/* Number of Periods */}
                  <div className="space-y-2">
                    <Label htmlFor="numberOfPeriods">Number of Periods</Label>
                    <Input
                      id="numberOfPeriods"
                      type="number"
                      value={inputs.numberOfPeriods}
                      onChange={(e) => updateInputs({ numberOfPeriods: parseInt(e.target.value) || 1 })}
                      min={1}
                      step={1}
                    />
                  </div>

                  {/* Growth Rate */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="growthRate">Growth Rate per Period</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Optional: Escalate periodic cash flow by this rate each period. CFₜ = CF₁ × (1 + g)^(t-1)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="relative">
                      <Input
                        id="growthRate"
                        type="number"
                        value={(inputs.growthRatePeriod * 100).toFixed(2)}
                        onChange={(e) => handleNumberChange('growthRatePeriod', e.target.value, true)}
                        step="0.5"
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="custom_series" className="space-y-4 mt-4">
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">{getFrequencyLabel(inputs.periodFrequency)}</TableHead>
                          <TableHead>Cash Flow</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inputs.customCashFlows.map((cf, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">
                              {idx === 0 ? 'CF₀' : `CF${idx}`}
                            </TableCell>
                            <TableCell>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                                <Input
                                  type="number"
                                  value={cf}
                                  onChange={(e) => updateCustomCashFlow(idx, parseFloat(e.target.value) || 0)}
                                  className="pl-8 h-8"
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              {idx > 0 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => removeCustomCashFlow(idx)}
                                >
                                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addCustomCashFlow(0)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Period
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="hero" onClick={handleRunAnalysis} className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              Calculate NPV
            </Button>
            <Button variant="outline" onClick={loadExample}>
              <Lightbulb className="h-4 w-4 mr-2" />
              Load Example
            </Button>
            <Button variant="outline" onClick={resetInputs}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {results ? (
            <>
              {/* Key Result */}
              <Card className={cn(
                'border-2',
                results.npv >= 0 ? 'border-primary bg-primary/5' : 'border-destructive bg-destructive/5'
              )}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Net Present Value</p>
                      <p className={cn(
                        'text-4xl font-display font-bold',
                        results.npv >= 0 ? 'text-primary' : 'text-destructive'
                      )}>
                        {formatCurrency(results.npv)}
                      </p>
                    </div>
                    {results.npv >= 0 ? (
                      <div className="flex items-center gap-2 text-primary">
                        <CheckCircle2 className="h-8 w-8" />
                        <span className="font-medium">Positive NPV</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-8 w-8" />
                        <span className="font-medium">Negative NPV</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Summary Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <div>
                        <dt className="text-sm text-muted-foreground">PV of Inflows</dt>
                        <dd className="font-semibold text-primary">{formatCurrency(results.pvOfInflows)}</dd>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <TrendingDown className="h-5 w-5 text-destructive" />
                      <div>
                        <dt className="text-sm text-muted-foreground">PV of Outflows</dt>
                        <dd className="font-semibold text-destructive">-{formatCurrency(results.pvOfOutflows)}</dd>
                      </div>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Total Cash Flows</dt>
                      <dd className="font-semibold">{formatCurrency(results.totalCashFlows)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Periodic Rate</dt>
                      <dd className="font-semibold">{formatPercent(results.periodicDiscountRate)}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Warnings */}
              {results.warnings.length > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="pt-4">
                    <ul className="space-y-2">
                      {results.warnings.map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className={cn(
                            'h-4 w-4 mt-0.5',
                            w.severity === 'error' ? 'text-destructive' : 'text-amber-600'
                          )} />
                          <span>{w.message}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Breakdown Table */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Period Breakdown</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDiscountFactors(!showDiscountFactors)}
                  >
                    {showDiscountFactors ? 'Hide' : 'Show'} Discount Factors
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-muted">
                        <TableRow>
                          <TableHead>{getFrequencyLabel(inputs.periodFrequency)}</TableHead>
                          <TableHead className="text-right">Cash Flow</TableHead>
                          {showDiscountFactors && (
                            <TableHead className="text-right">Discount Factor</TableHead>
                          )}
                          <TableHead className="text-right">Present Value</TableHead>
                          <TableHead className="text-right">Cumulative PV</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.periodBreakdowns.map((pb) => (
                          <TableRow key={pb.period}>
                            <TableCell className="font-medium">{pb.period}</TableCell>
                            <TableCell className={cn(
                              'text-right',
                              pb.cashFlow < 0 ? 'text-destructive' : 'text-foreground'
                            )}>
                              {formatCurrency(pb.cashFlow)}
                            </TableCell>
                            {showDiscountFactors && (
                              <TableCell className="text-right text-muted-foreground">
                                {pb.discountFactor.toFixed(4)}
                              </TableCell>
                            )}
                            <TableCell className={cn(
                              'text-right',
                              pb.presentValue < 0 ? 'text-destructive' : 'text-primary'
                            )}>
                              {formatCurrency(pb.presentValue)}
                            </TableCell>
                            <TableCell className={cn(
                              'text-right font-medium',
                              pb.cumulativePV < 0 ? 'text-destructive' : 'text-primary'
                            )}>
                              {formatCurrency(pb.cumulativePV)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="h-full min-h-[400px] flex items-center justify-center">
              <CardContent className="text-center py-12">
                <Calculator className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold text-muted-foreground mb-2">
                  Enter your inputs and calculate
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Configure your discount rate, cash flows, and click "Calculate NPV" to see results.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center mt-8">
        For educational purposes only. Not investment, legal, or tax advice.
      </p>
    </div>
  );
}

export default function NPVCalculator() {
  return (
    <Layout>
      <NPVProvider>
        <NPVCalculatorContent />
      </NPVProvider>
    </Layout>
  );
}
