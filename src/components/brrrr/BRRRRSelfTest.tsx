// BRRRR Self-Test UI Component (Dev Mode Only)

import { useState } from "react";
import { runBrrrrSelfTest, isDevModeEnabled, SelfTestResult } from "@/lib/calculators/brrrr/selfTest";
import { useBRRRR } from "@/contexts/BRRRRContext";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, FlaskConical, Download } from "lucide-react";
import { formatCurrency } from "@/lib/calculators/types";

export function BRRRRSelfTest() {
  const [result, setResult] = useState<SelfTestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const { loadPreset, runAnalysis } = useBRRRR();

  // Only render in dev mode
  if (!isDevModeEnabled()) {
    return null;
  }

  const handleRunTest = () => {
    setIsRunning(true);
    // Small delay for UI feedback
    setTimeout(() => {
      const testResult = runBrrrrSelfTest();
      setResult(testResult);
      setIsRunning(false);
    }, 100);
  };

  const handleLoadPreset = () => {
    loadPreset("typical");
    runAnalysis();
  };

  return (
    <div className="p-4 rounded-xl border-2 border-dashed border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
      <div className="flex items-center gap-2 mb-3">
        <FlaskConical className="h-5 w-5 text-amber-600" />
        <span className="font-semibold text-amber-800 dark:text-amber-400 text-sm">
          Dev Mode: Self-Test
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRunTest}
          disabled={isRunning}
          className="text-xs"
        >
          {isRunning ? "Running..." : "Run BRRRR Self-Test"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLoadPreset}
          className="text-xs"
        >
          <Download className="h-3 w-3 mr-1" />
          Load Preset A into Form
        </Button>
      </div>

      {result && (
        <div className="mt-3 space-y-2">
          {/* Overall Status */}
          <div className={`flex items-center gap-2 p-2 rounded-lg ${
            result.pass 
              ? "bg-green-100 dark:bg-green-900/30" 
              : "bg-red-100 dark:bg-red-900/30"
          }`}>
            {result.pass ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <span className={`font-semibold text-sm ${
              result.pass ? "text-green-800 dark:text-green-400" : "text-red-800 dark:text-red-400"
            }`}>
              {result.pass ? "All checks passed" : "Some checks failed"}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              Preset: {result.presetUsed}
            </span>
          </div>

          {/* Individual Checks */}
          <div className="space-y-1">
            {result.checks.map((check, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 p-2 rounded text-xs ${
                  check.pass 
                    ? "bg-green-50 dark:bg-green-900/10" 
                    : "bg-red-50 dark:bg-red-900/10"
                }`}
              >
                {check.pass ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground">{check.name}</div>
                  <div className="text-muted-foreground">
                    Expected: {formatCurrency(check.expected)} | 
                    Actual: {formatCurrency(check.actual)}
                  </div>
                  {check.message && (
                    <div className="text-muted-foreground/70 mt-0.5">
                      {check.message}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
