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
  HelpCircle,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Share2,
  Save,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// NPV FAQs for SEO
const faqs = [
  {
    question: "What is Net Present Value (NPV)?",
    answer: "NPV is the difference between the present value of future cash inflows and the present value of cash outflows. It measures whether an investment creates or destroys value given a required rate of return."
  },
  {
    question: "How do I calculate NPV?",
    answer: "NPV = CF₀ + CF₁/(1+r)¹ + CF₂/(1+r)² + ... + CFₙ/(1+r)ⁿ. Discount each future cash flow by (1+r)^t where r is the periodic discount rate and t is the period number."
  },
  {
    question: "What is a good NPV?",
    answer: "A positive NPV means the investment exceeds your required return and creates value. A negative NPV means it falls short. Generally, accept projects with NPV > 0 when comparing similar-risk investments."
  },
  {
    question: "NPV vs IRR: what's the difference?",
    answer: "NPV gives a dollar value of wealth created. IRR gives the effective return rate. NPV is preferred for comparing projects because it accounts for investment size and timing."
  },
  {
    question: "What discount rate should I use?",
    answer: "Use your required rate of return or cost of capital. Common rates: 8-12% for real estate, 10-15% for corporate projects, 20-30% for venture investments."
  },
  {
    question: "Is this NPV calculator free?",
    answer: "Yes! TheDealCalc is 100% free with no signup required. Calculate NPV, compare scenarios, and export to PDF or Excel."
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

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://thedealcalc.com/" },
          { "@type": "ListItem", "position": 2, "name": "Calculators", "item": "https://thedealcalc.com/calculators" },
          { "@type": "ListItem", "position": 3, "name": "NPV Calculator", "item": "https://thedealcalc.com/npv-calculator" }
        ]
      },
      {
        "@type": "SoftwareApplication",
        "name": "NPV Calculator",
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Any",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "description": "Free Net Present Value calculator with support for multiple period frequencies, timing conventions, and custom cash flows.",
        "url": "https://thedealcalc.com/npv-calculator"
      },
      {
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
        }))
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>NPV Calculator (Free) | Net Present Value — TheDealCalc</title>
        <meta name="description" content="Free NPV calculator: calculate Net Present Value with multiple period frequencies, timing conventions, and custom cash flows. Export to PDF, Excel. No signup." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thedealcalc.com/npv-calculator" />
        <meta property="og:title" content="NPV Calculator (Free) | Net Present Value — TheDealCalc" />
        <meta property="og:description" content="Free Net Present Value calculator with sensitivity analysis, multiple export formats, and shareable links." />
        <meta property="og:url" content="https://thedealcalc.com/npv-calculator" />
        <meta property="og:type" content="website" />
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
                    <Label htmlFor="discountRate">Annual Discount Rate</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>The required annual return used to discount future cash flows. Higher rates reduce present value.</p>
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
                          <p>How often cash flows occur. The annual rate is converted: r_periodic = (1 + r_annual)^(1/m) - 1.</p>
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
                          <p>End of period assumes cash flows at period end (standard). Beginning of period treats them as occurring at the start.</p>
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
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Cash Flow Entry Mode</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Single + Recurring: CF₀ plus repeating cash flows with optional growth. Custom Series: enter each period individually.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
                          <Label htmlFor="initialInvestment">Initial Investment (CF₀)</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>Cash flow at time zero, usually negative for an upfront investment. Example: -100000.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
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
                          <Label htmlFor="periodicCashFlow">Periodic Cash Flow</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>Cash flow received (positive) or paid (negative) each period. Can include ongoing costs or income.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
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
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>How many periods the recurring cash flow continues. Example: 5 years or 60 months.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
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
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>Percentage change applied each period. CFₜ = CF₁ × (1 + g)^(t-1). Leave 0 for flat cash flows.</p>
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
                              <TableHead className="w-20">
                                <div className="flex items-center gap-1">
                                  {getFrequencyLabel(inputs.periodFrequency)}
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <p>CF₀ = initial investment (period 0). CF₁, CF₂, etc. = future period cash flows.</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </TableHead>
                              <TableHead>
                                <div className="flex items-center gap-1">
                                  Cash Flow
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <p>Enter each period's cash flow. Negative = outflow, positive = inflow.</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </TableHead>
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
                                          <p>CF₀ cannot be removed</p>
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
                        <li key={s.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                          <span className="truncate flex-1">{s.name}</span>
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
                        ? "This investment exceeds your required return. The positive NPV represents the wealth created above the discount rate."
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
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDiscountFactors(!showDiscountFactors)}
                          >
                            {showDiscountFactors ? 'Hide' : 'Show'} Discount Factors
                            <HelpCircle className="h-3 w-3 ml-1 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Discount factor = 1/(1+r)^t for end-of-period, or 1/(1+r)^(t-1) for beginning-of-period.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
                  {showSensitivity && sensitivityData && sensitivityData.length > 0 && (
                    <CardContent>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Discount Rate</TableHead>
                              <TableHead className="text-right">NPV</TableHead>
                              <TableHead className="text-right">PV Inflows</TableHead>
                              <TableHead className="text-right">PV Outflows</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sensitivityData.map((row, idx) => {
                              const isBase = Math.abs(row.discountRate - inputs.discountRateAnnual) < 0.001;
                              return (
                                <TableRow 
                                  key={idx} 
                                  className={isBase ? 'bg-primary/10 font-medium' : ''}
                                >
                                  <TableCell>
                                    {formatPercent(row.discountRate)}
                                    {isBase && <span className="ml-2 text-xs text-primary">(Base)</span>}
                                  </TableCell>
                                  <TableCell className={cn(
                                    'text-right',
                                    row.npv >= 0 ? 'text-primary' : 'text-destructive'
                                  )}>
                                    {formatCurrency(row.npv)}
                                  </TableCell>
                                  <TableCell className="text-right text-primary">
                                    {formatCurrency(row.pvInflows)}
                                  </TableCell>
                                  <TableCell className="text-right text-destructive">
                                    -{formatCurrency(row.pvOutflows)}
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

        {/* SEO Content */}
        <section className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-display font-bold text-foreground mb-6">
            What is Net Present Value (NPV)?
          </h2>
          <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
            <p>
              Net Present Value (NPV) measures the difference between the present value of future cash inflows 
              and the present value of cash outflows over a given time period. It's a fundamental metric in 
              capital budgeting and investment analysis that accounts for the time value of money.
            </p>
            <p>
              A positive NPV indicates that the projected earnings exceed the anticipated costs, meaning the 
              investment will generate value above your required rate of return. Conversely, a negative NPV 
              suggests the investment would destroy value relative to your discount rate.
            </p>
          </div>

          <h3 className="text-xl font-display font-semibold text-foreground mb-4">
            NPV Formula
          </h3>
          <div className="p-4 bg-muted rounded-lg mb-8 font-mono text-sm">
            NPV = CF₀ + CF₁/(1+r)¹ + CF₂/(1+r)² + ... + CFₙ/(1+r)ⁿ
          </div>
          <p className="text-muted-foreground mb-8">
            Where CFₜ is the cash flow at period t, r is the discount rate per period, and n is the total 
            number of periods. CF₀ (initial investment) is typically negative.
          </p>

          <h3 className="text-xl font-display font-semibold text-foreground mb-4">
            How to Use This NPV Calculator
          </h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-8">
            <li>Enter your annual discount rate (required rate of return)</li>
            <li>Choose period frequency: annual, quarterly, or monthly</li>
            <li>Select timing convention: end-of-period (standard) or beginning-of-period</li>
            <li>Enter cash flows using Single + Recurring mode or Custom Series for irregular flows</li>
            <li>Click "Calculate NPV" to see results, breakdown, and sensitivity analysis</li>
          </ul>

          {/* FAQ Accordion */}
          <h3 className="text-xl font-display font-semibold text-foreground mb-4">
            Frequently Asked Questions
          </h3>
          <Accordion type="single" collapsible className="mb-8">
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
