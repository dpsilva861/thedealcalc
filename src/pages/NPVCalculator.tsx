/**
 * NPV Calculator Page
 * 
 * Full-featured Net Present Value calculator with:
 * - Single recurring and custom cash flow modes
 * - Multiple period frequencies
 * - Beginning/end of period timing
 * - Detailed breakdown table
 * - Export functionality
 * - Shareable links
 * - Saved scenarios
 * - SEO content
 */

import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { buildCalculatorPageSchema } from '@/lib/seo/schemaBuilders';
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
import { HelpTooltip } from '@/components/ui/help-tooltip';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalculatorSelector } from '@/components/calculators/CalculatorSelector';
import { RelatedCalculators } from '@/components/calculators/RelatedCalculators';
import { ExportDropdown } from '@/components/exports/ExportDropdown';
import { transformNPVToCanonical } from '@/lib/exports/npvTransformer';
import { exportNPVToExcel, exportNPVToCSV, exportNPVToPDF } from '@/lib/calculators/npv/exports';
import { generateDiscountRateSensitivity, NPVSensitivityRow } from '@/lib/calculators/npv/sensitivity';
import { formatCurrency, formatPercent } from '@/lib/calculators/types';
import { trackEvent } from '@/lib/analytics';
import { devLog } from '@/lib/devLogger';
import { useNPVScenarios, SavedNPVScenario } from '@/hooks/useNPVScenarios';
import { toast } from 'sonner';
import {
  Calculator,
  Play,
  RotateCcw,
  Lightbulb,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Share2,
  Save,
  FolderOpen,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// NPV FAQs for SEO
const faqs = [
  {
    question: "What is Net Present Value (NPV)?",
    answer: "NPV converts all future cash flows into today's dollars using a discount rate, then subtracts your initial investment. A positive NPV means the investment creates value above your required return; negative NPV means it falls short."
  },
  {
    question: "How do I interpret NPV results?",
    answer: "NPV > 0: accept the investment (exceeds required return). NPV < 0: reject (falls short of required return). NPV = 0: exactly meets required return. When comparing mutually exclusive projects, choose the higher NPV."
  },
  {
    question: "What discount rate should I use?",
    answer: "Use your required rate of return or weighted cost of capital. The discount rate reflects the risk of the investment and the opportunity cost of capital. Higher risk investments warrant higher discount rates."
  },
  {
    question: "NPV vs IRR: what's the difference?",
    answer: "NPV gives a dollar value of wealth created. IRR gives the annualized return rate. NPV is generally preferred because it accounts for investment size and reinvestment rate assumptions. IRR can give misleading results for non-conventional cash flows."
  },
  {
    question: "What is the time value of money?",
    answer: "Money today is worth more than the same amount in the future because it can be invested to earn returns. NPV uses this principle to convert future cash flows into their present value equivalents for comparison."
  },
  {
    question: "What is beginning vs end of period timing?",
    answer: "End of period (ordinary annuity) assumes cash flows occur at period end—standard for most investments. Beginning of period (annuity due) assumes cash flows at period start—used for rent, lease payments, or immediate receipts."
  },
];

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
  const [sensitivityData, setSensitivityData] = useState<NPVSensitivityRow[] | null>(null);
  const [showSensitivity, setShowSensitivity] = useState(false);
  const [showScenarios, setShowScenarios] = useState(false);
  const [scenarioName, setScenarioName] = useState('');

  // Saved scenarios
  const { scenarios, saveScenario, loadScenario, deleteScenario } = useNPVScenarios(
    inputs,
    useCallback((loaded) => updateInputs(loaded), [updateInputs])
  );

  // Share link handler
  const handleShare = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('dr', String(inputs.discountRateAnnual));
      url.searchParams.set('pf', inputs.periodFrequency);
      url.searchParams.set('tc', inputs.timingConvention);
      url.searchParams.set('cm', inputs.cashFlowMode);
      url.searchParams.set('ii', String(inputs.initialInvestment));
      url.searchParams.set('pc', String(inputs.periodicCashFlow));
      url.searchParams.set('np', String(inputs.numberOfPeriods));
      url.searchParams.set('gr', String(inputs.growthRatePeriod));
      if (inputs.cashFlowMode === 'custom_series') {
        url.searchParams.set('cf', inputs.customCashFlows.join(','));
      }
      await navigator.clipboard.writeText(url.toString());
      toast.success('Link copied to clipboard!');
      trackEvent('share_link', { calculator: 'npv' });
    } catch {
      toast.error('Failed to copy link');
    }
  };

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


  const handleSaveScenario = () => {
    const name = scenarioName.trim() || undefined;
    saveScenario(name);
    setScenarioName('');
    setShowScenarios(true);
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

  // Sensitivity analysis handler
  const handleGenerateSensitivity = () => {
    if (!results) return;
    trackEvent('generate_sensitivity', { calculator: 'npv' });
    const sensitivity = generateDiscountRateSensitivity(inputs);
    setSensitivityData(sensitivity);
    setShowSensitivity(true);
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'annual': return 'Year';
      case 'monthly': return 'Month';
      case 'quarterly': return 'Quarter';
      default: return 'Period';
    }
  };

  // JSON-LD structured data using centralized schema builder
  const jsonLd = buildCalculatorPageSchema(
    {
      name: "NPV Calculator",
      description: "Free Net Present Value calculator with support for multiple period frequencies, timing conventions, and custom cash flows.",
      canonicalPath: "/npv-calculator"
    },
    [
      { name: "Home", path: "/" },
      { name: "Calculators", path: "/calculators" },
      { name: "NPV Calculator", path: "/npv-calculator" }
    ],
    faqs
  );

  return (
    <>
      <Helmet>
        <title>Net Present Value (NPV) Calculator | TheDealCalc</title>
        <meta name="description" content="Calculate NPV instantly. Includes formula breakdowns, real estate examples, sensitivity analysis, and investor guidance. Free, no signup required." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thedealcalc.com/npv-calculator" />
        <meta property="og:title" content="Net Present Value (NPV) Calculator | TheDealCalc" />
        <meta property="og:description" content="Free NPV calculator with sensitivity analysis, multiple export formats, and shareable links for real estate investors." />
        <meta property="og:url" content="https://thedealcalc.com/npv-calculator" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://thedealcalc.com/og/og-npv.png" />
        <meta property="og:site_name" content="TheDealCalc" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Net Present Value (NPV) Calculator | TheDealCalc" />
        <meta name="twitter:description" content="Free NPV calculator with sensitivity analysis and export options for real estate investors." />
        <meta name="twitter:image" content="https://thedealcalc.com/og/og-npv.png" />
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Copy a shareable link with your current inputs. Anyone with the link sees the same setup.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {results && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <ExportDropdown
                        calculatorType="underwriting"
                        onExportExcel={handleExportExcel}
                        onExportCSV={handleExportCSV}
                        onExportPDF={handleExportPDF}
                        onExportDocx={handleExportDocx}
                        onExportPptx={handleExportPptx}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Export inputs, results, and period breakdown. Use Excel for editing, PDF for sharing.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
                    <Label htmlFor="discountRate">Discount Rate (Required Return)</Label>
                    <HelpTooltip 
                      content={
                        <p>Your required annual return on investment. This rate converts future cash flows into today's dollars. A higher rate means future cash flows are worth less today.</p>
                      }
                    />
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
                    <Label>Cash Flow Frequency</Label>
                    <HelpTooltip 
                      content={
                        <p>How often you receive or pay cash flows. Monthly means 12 cash flows per year, quarterly means 4, annual means 1.</p>
                      }
                    />
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
                    <Label>When Cash Flows Occur</Label>
                    <HelpTooltip 
                      content={
                        <p>End of period (standard): Cash flows arrive at the end of each period. Beginning of period: Cash flows arrive at the start of each period, giving them slightly more value.</p>
                      }
                    />
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
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Cash Flow Entry Mode</Label>
                    <HelpTooltip 
                      content={
                        <p>Single + Recurring: Enter an upfront investment plus regular repeating cash flows. Custom Series: Enter each period's cash flow individually for irregular amounts.</p>
                      }
                    />
                  </div>
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
                        <div className="flex items-center gap-2">
                          <Label htmlFor="initialInvestment">Initial Investment (Cash Outflow)</Label>
                          <HelpTooltip 
                            content={
                              <p>The upfront amount you invest today. Enter as a negative number (e.g., -100000) since money is flowing out from you.</p>
                            }
                          />
                        </div>
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
                      </div>

                      {/* Periodic Cash Flow */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="periodicCashFlow">Future Cash Flows (per period)</Label>
                          <HelpTooltip 
                            content={
                              <p>The cash you receive (positive) or pay (negative) each period. For investments, this is typically positive income flowing to you.</p>
                            }
                          />
                        </div>
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
                        <div className="flex items-center gap-2">
                          <Label htmlFor="numberOfPeriods">Number of Periods</Label>
                          <HelpTooltip 
                            content={
                              <p>How many periods the cash flows continue. Example: 5 years, 20 quarters, or 60 months depending on your frequency setting.</p>
                            }
                          />
                        </div>
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
                          <HelpTooltip 
                            content={
                              <p>How much your cash flow grows each period. Set to 0% for flat cash flows, or enter a growth rate if cash flows increase over time (e.g., 3% annual rent increases).</p>
                            }
                          />
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
                              <TableHead className="w-20">
                                <div className="flex items-center gap-1">
                                  {getFrequencyLabel(inputs.periodFrequency)}
                                  <HelpTooltip 
                                    iconClassName="h-3 w-3"
                                    content={
                                      <p>Period 0 is today (your initial investment). Periods 1, 2, etc. are future cash flows.</p>
                                    }
                                  />
                                </div>
                              </TableHead>
                              <TableHead>
                                <div className="flex items-center gap-1">
                                  Cash Flow
                                  <HelpTooltip 
                                    iconClassName="h-3 w-3"
                                    content={
                                      <p>Enter each period's cash flow. Negative = money you pay out, positive = money you receive.</p>
                                    }
                                  />
                                </div>
                              </TableHead>
                              <TableHead className="w-16"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {inputs.customCashFlows.map((cf, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">
                                  {idx === 0 ? 'Today' : `${getFrequencyLabel(inputs.periodFrequency)} ${idx}`}
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
                                  {idx > 0 ? (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => removeCustomCashFlow(idx)}
                                          >
                                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Remove this period</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ) : (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="h-8 w-8 flex items-center justify-center text-muted-foreground/50 cursor-not-allowed">
                                            <Trash2 className="h-4 w-4" />
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Initial investment cannot be removed</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addCustomCashFlow(0)}
                              className="w-full"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Period
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Add a new cash flow period to the series</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="hero" onClick={handleRunAnalysis} className="flex-1">
                      <Play className="h-4 w-4 mr-2" />
                      Calculate NPV
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Run the NPV calculation with current inputs</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={loadExample}>
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Example
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Load a sample rental property scenario</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={resetInputs}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clear all inputs and start fresh</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Saved Scenarios */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Saved Scenarios
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowScenarios(!showScenarios)}
                  >
                    {showScenarios ? 'Hide' : 'Show'} ({scenarios.length})
                  </Button>
                </div>
              </CardHeader>
              {showScenarios && (
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Scenario name (optional)"
                      value={scenarioName}
                      onChange={(e) => setScenarioName(e.target.value)}
                      className="flex-1"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={handleSaveScenario}>
                            <Save className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Save current inputs as a named scenario</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {scenarios.length > 0 ? (
                    <ul className="space-y-2">
                      {scenarios.map((s: SavedNPVScenario) => (
                        <li
                          key={s.id}
                          className="flex items-center justify-between p-2 rounded-md bg-muted text-sm"
                        >
                          <div>
                            <span className="font-medium">{s.name}</span>
                            <span className="text-muted-foreground ml-2 text-xs">
                              {new Date(s.savedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => loadScenario(s.id)}>
                              Load
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteScenario(s.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No saved scenarios yet
                    </p>
                  )}
                </CardContent>
              )}
            </Card>
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
                    {/* What this means */}
                    <p className="text-sm text-muted-foreground mt-4 pt-4 border-t">
                      {results.npv >= 0 
                        ? "This investment exceeds your required return. The positive NPV represents extra value created above the discount rate."
                        : "This investment falls short of your required return. Consider adjusting assumptions or seeking alternatives."}
                    </p>
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
                          <dt className="text-sm text-muted-foreground">Present Value of Inflows</dt>
                          <dd className="font-semibold text-primary">{formatCurrency(results.pvOfInflows)}</dd>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <TrendingDown className="h-5 w-5 text-destructive" />
                        <div>
                          <dt className="text-sm text-muted-foreground">Present Value of Outflows</dt>
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
                  <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
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
                      className="flex items-center gap-1"
                    >
                      {showDiscountFactors ? 'Hide' : 'Show'} Discount Factors
                      <HelpTooltip 
                        iconClassName="h-3 w-3"
                        content={
                          <p>The discount factor shows how much each future dollar is worth today. For example, 0.9091 means $1 in that period is worth about $0.91 today.</p>
                        }
                      />
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

                {/* Sensitivity Analysis */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Sensitivity Analysis
                      </CardTitle>
                      <CardDescription>See how NPV changes with discount rate</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateSensitivity}
                    >
                      {sensitivityData ? 'Regenerate' : 'Generate'}
                    </Button>
                  </CardHeader>
                  {showSensitivity && sensitivityData && (
                    <CardContent>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Discount Rate</TableHead>
                              <TableHead className="text-right">NPV</TableHead>
                              <TableHead className="text-right">Change</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sensitivityData.map((row) => {
                              const isBaseCase = Math.abs(row.discountRate - inputs.discountRateAnnual) < 0.001;
                              const baseNpv = sensitivityData.find(r => Math.abs(r.discountRate - inputs.discountRateAnnual) < 0.001)?.npv ?? 0;
                              const npvDelta = row.npv - baseNpv;
                              
                              return (
                                <TableRow
                                  key={row.discountRate}
                                  className={isBaseCase ? 'bg-primary/10' : ''}
                                >
                                  <TableCell className="font-medium">
                                    {formatPercent(row.discountRate)}
                                    {isBaseCase && (
                                      <span className="ml-2 text-xs text-muted-foreground">(base)</span>
                                    )}
                                  </TableCell>
                                  <TableCell className={cn(
                                    'text-right font-semibold',
                                    row.npv >= 0 ? 'text-primary' : 'text-destructive'
                                  )}>
                                    {formatCurrency(row.npv)}
                                  </TableCell>
                                  <TableCell className={cn(
                                    'text-right',
                                    npvDelta >= 0 ? 'text-primary' : 'text-destructive'
                                  )}>
                                    {npvDelta >= 0 ? '+' : ''}{formatCurrency(npvDelta)}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        Range: 6% to 14% at 1% intervals. Highlighted row shows your base case.
                      </p>
                    </CardContent>
                  )}
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

        {/* SEO Content - Comprehensive educational content for SEO */}
        <section className="mt-16 max-w-4xl mx-auto prose prose-slate dark:prose-invert max-w-none">
          <h2 className="text-2xl font-display font-bold text-foreground mb-6">
            What is Net Present Value (NPV)?
          </h2>
          <p className="text-lg text-muted-foreground mb-4">
            Net Present Value (NPV) is a financial metric that tells you how much value an investment creates <strong>today</strong> after converting all future cash flows into today's dollars using your required return, known as the discount rate. NPV is considered one of the most reliable methods for evaluating investment opportunities because it accounts for the time value of money.
          </p>
          <p className="text-muted-foreground mb-6">
            In real estate investing, NPV helps you compare different properties, determine whether a deal meets your return requirements, and make data-driven decisions about where to allocate capital. A positive NPV means the investment creates value beyond your required return; a negative NPV suggests the investment falls short.
          </p>
          
          <div className="my-6 p-4 bg-muted rounded-lg not-prose">
            <h4 className="font-semibold mb-3">How to interpret your results:</h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <span><strong>NPV &gt; 0:</strong> Creates value above your required return — generally a good investment</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <span><strong>NPV &lt; 0:</strong> Returns less than your required return — may not be worth pursuing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-5 w-5 flex items-center justify-center text-muted-foreground mt-0.5 shrink-0">=</span>
                <span><strong>NPV = 0:</strong> Exactly meets your required return — a break-even investment</span>
              </li>
            </ul>
          </div>

          <h2 className="text-xl font-display font-semibold text-foreground mb-4 mt-8">
            Why Net Present Value Matters in Real Estate Investing
          </h2>
          <p className="text-muted-foreground mb-4">
            Real estate investors use NPV to make smarter decisions about where to invest their capital. Here's why NPV is essential:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
            <li><strong>Time Value of Money:</strong> A dollar today is worth more than a dollar tomorrow because you can invest it and earn returns. NPV accounts for this fundamental financial principle.</li>
            <li><strong>Compare Different Investments:</strong> NPV lets you compare properties with different cash flow patterns on an apples-to-apples basis.</li>
            <li><strong>Risk-Adjusted Returns:</strong> By setting your discount rate based on risk, NPV helps you evaluate whether an investment adequately compensates you.</li>
            <li><strong>Capital Allocation:</strong> When you have limited capital, NPV helps you prioritize investments that create the most value.</li>
          </ul>

          <h2 className="text-xl font-display font-semibold text-foreground mb-4">
            The NPV Formula Explained in Plain English
          </h2>
          <div className="p-4 bg-muted rounded-lg font-mono text-sm mb-4 not-prose">
            NPV = CF₀ + CF₁/(1+r)¹ + CF₂/(1+r)² + ... + CFₙ/(1+r)ⁿ
          </div>
          <p className="text-muted-foreground mb-4">
            Here's what each part means:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
            <li><strong>CF₀ (Initial Investment):</strong> The cash you invest today, typically shown as a negative number (money going out).</li>
            <li><strong>CF₁, CF₂, ... CFₙ (Future Cash Flows):</strong> The cash the investment produces in each period—rent income, sale proceeds, etc.</li>
            <li><strong>r (Discount Rate):</strong> Your required annual return, also called the "required rate of return" or "hurdle rate."</li>
            <li><strong>n (Number of Periods):</strong> How many time periods you're analyzing.</li>
          </ul>
          <p className="text-muted-foreground mb-6">
            Each future cash flow is divided by (1+r) raised to the power of its period number. This "discounts" future cash back to today's value. Then you sum everything up—if the total is positive, the investment exceeds your required return.
          </p>

          <h2 className="text-xl font-display font-semibold text-foreground mb-4">
            How to Use This NPV Calculator
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
            <li><strong>Set Your Discount Rate:</strong> Enter your required annual return. Common rates are 8-12% for real estate, 15-25% for higher-risk investments.</li>
            <li><strong>Choose Cash Flow Frequency:</strong> Select annual, quarterly, or monthly depending on how often you receive cash flows.</li>
            <li><strong>Select Timing Convention:</strong> "End of period" (most common) or "beginning of period" for rent received in advance.</li>
            <li><strong>Enter Your Cash Flows:</strong> Use "single recurring" for equal payments or "custom series" for varying amounts.</li>
            <li><strong>Click Calculate:</strong> Review your NPV, period-by-period breakdown, and sensitivity analysis.</li>
          </ol>

          <h2 className="text-xl font-display font-semibold text-foreground mb-4">
            Example NPV Calculation
          </h2>
          <p className="text-muted-foreground mb-4">
            Let's say you're considering a rental property investment:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
            <li><strong>Initial Investment:</strong> $100,000 down payment</li>
            <li><strong>Annual Cash Flow:</strong> $12,000 net rental income for 5 years</li>
            <li><strong>Sale Proceeds:</strong> $130,000 net (after selling in year 5)</li>
            <li><strong>Discount Rate:</strong> 10%</li>
          </ul>
          <p className="text-muted-foreground mb-6">
            Using this calculator, you'd find an NPV of approximately <strong>$6,800</strong>. This positive NPV means the investment exceeds your 10% required return—it creates an additional $6,800 in value today above what you'd need to meet your hurdle rate.
          </p>

          <h2 className="text-xl font-display font-semibold text-foreground mb-4">
            Common Mistakes Investors Make with NPV
          </h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
            <li><strong>Using the Wrong Discount Rate:</strong> Your discount rate should reflect the risk of the investment, not just your borrowing cost or savings rate.</li>
            <li><strong>Forgetting to Include All Cash Flows:</strong> Include closing costs, repairs, property management fees, and the eventual sale price.</li>
            <li><strong>Ignoring Timing:</strong> When cash flows occur matters. Rent received monthly compounds differently than annual payments.</li>
            <li><strong>Being Too Optimistic:</strong> Conservative estimates lead to better decisions. Don't assume 100% occupancy or zero maintenance costs.</li>
            <li><strong>Comparing NPV in Isolation:</strong> Consider NPV alongside other metrics like IRR, cash-on-cash return, and payback period.</li>
          </ul>

          <h2 className="text-xl font-display font-semibold text-foreground mb-4">
            NPV vs IRR: What's the Difference?
          </h2>
          <p className="text-muted-foreground mb-4">
            Both Net Present Value (NPV) and Internal Rate of Return (IRR) are discounted cash flow methods, but they answer different questions:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
            <li><strong>NPV</strong> tells you the dollar amount of value created above your required return.</li>
            <li><strong>IRR</strong> tells you the effective annual return rate the investment produces.</li>
          </ul>
          <p className="text-muted-foreground mb-6">
            Most finance professionals prefer NPV for comparing investments because it accounts for investment size. An investment with a lower IRR but higher NPV often creates more wealth. However, IRR is useful for comparing returns on a percentage basis when investments require similar capital.
          </p>

          {/* FAQ Accordion */}
          <h2 className="text-xl font-display font-semibold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="mb-8 not-prose">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center mt-8">
          For educational purposes only. Not investment, legal, or tax advice.
        </p>
      </div>

      {/* Related Calculators */}
      <RelatedCalculators currentPath="/npv-calculator" />
    </>
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
