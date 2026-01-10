import { useSyndication } from "@/contexts/SyndicationContext";
import { InputField } from "@/components/underwriting/InputField";

export function SyndicationEquityStep() {
  const { inputs, updateEquity, hasAttemptedRun, touchedFields, touchField, validation } = useSyndication();
  const { equity } = inputs;
  const lpPct = equity.lp_equity_pct * 100;
  const gpPct = equity.gp_equity_pct * 100;

  const getFieldError = (fieldName: string): string | undefined => {
    return validation.errors.find(e => e.field === fieldName)?.message;
  };

  const shouldShowError = (fieldName: string): boolean => {
    return hasAttemptedRun || touchedFields.has(fieldName);
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-1">Capital Stack (LP/GP Split)</h3>
        <p className="text-sm text-muted-foreground mb-6">Split equity between LP and GP. Must equal 100%.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField 
            label="LP Equity %" 
            tooltip="Limited Partner equity contribution %" 
            value={lpPct} 
            onChange={(v) => { const lp = v / 100; updateEquity({ lp_equity_pct: lp, gp_equity_pct: 1 - lp }); }} 
            onBlur={() => touchField("equity.lp_equity_pct")}
            suffix="%" 
            placeholder="90" 
            min={0} 
            max={100}
            error={getFieldError("equity.lp_equity_pct")}
            showError={shouldShowError("equity.lp_equity_pct")}
          />
          <InputField 
            label="GP Equity %" 
            tooltip="General Partner equity contribution %" 
            value={gpPct} 
            onChange={(v) => { const gp = v / 100; updateEquity({ gp_equity_pct: gp, lp_equity_pct: 1 - gp }); }} 
            onBlur={() => touchField("equity.gp_equity_pct")}
            suffix="%" 
            placeholder="10" 
            min={0} 
            max={100}
            error={getFieldError("equity.gp_equity_pct")}
            showError={shouldShowError("equity.gp_equity_pct")}
          />
        </div>
        <div className="mt-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">Equity Split</p>
          <div className="h-4 rounded-full overflow-hidden flex bg-muted">
            <div className="bg-primary transition-all" style={{ width: `${lpPct}%` }} />
            <div className="bg-accent transition-all" style={{ width: `${gpPct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{lpPct >= 15 && `LP ${lpPct.toFixed(0)}%`}</span>
            <span>{gpPct >= 15 && `GP ${gpPct.toFixed(0)}%`}</span>
          </div>
        </div>
        {Math.abs(lpPct + gpPct - 100) > 0.1 && (
          <p className="text-sm text-destructive mt-4">LP + GP must equal 100%. Currently: {(lpPct + gpPct).toFixed(1)}%</p>
        )}
      </div>
    </div>
  );
}
