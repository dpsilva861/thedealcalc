import { useMemo, useState } from "react";
import { useSyndication } from "@/contexts/SyndicationContext";
import { runSyndicationSelfTest, runEdgeCaseTests, SelfTestCheck } from "@/lib/calculators/syndication/selfTest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";

export default function SyndicationSelfTest() {
  const { inputs } = useSyndication();
  const [showEdgeCases, setShowEdgeCases] = useState(false);

  const mainChecks = useMemo(() => runSyndicationSelfTest(inputs), [inputs]);
  const edgeCaseChecks = useMemo(() => showEdgeCases ? runEdgeCaseTests() : [], [showEdgeCases]);

  const allChecks = [...mainChecks, ...edgeCaseChecks];
  const passed = allChecks.filter((c) => c.pass).length;
  const total = allChecks.length;
  const allPassed = passed === total;

  return (
    <Card className={allPassed ? "border-green-500/50" : "border-amber-500/50"}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            {allPassed ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
            Dev Self-Test
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEdgeCases(!showEdgeCases)}
            >
              {showEdgeCases ? "Hide" : "Show"} Edge Cases
            </Button>
            <span className={allPassed ? "text-green-600" : "text-amber-600"}>
              {passed}/{total} passed
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {allChecks.map((check, i) => (
            <CheckRow key={i} check={check} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CheckRow({ check }: { check: SelfTestCheck }) {
  return (
    <div
      className={`p-2 rounded text-sm ${
        check.pass ? "bg-green-500/10" : "bg-red-500/10"
      }`}
    >
      <div className="flex items-start gap-2">
        {check.pass ? (
          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
        )}
        <div className="flex-1">
          <div className="font-medium">{check.name}</div>
          {check.note && (
            <div className="text-xs text-muted-foreground">{check.note}</div>
          )}
          {(check.expected !== undefined || check.actual !== undefined) && (
            <div className="text-xs text-muted-foreground mt-1">
              {check.expected !== undefined && (
                <span>Expected: {typeof check.expected === 'number' ? check.expected.toFixed(2) : check.expected} </span>
              )}
              {check.actual !== undefined && (
                <span>| Actual: {typeof check.actual === 'number' ? check.actual.toFixed(2) : check.actual}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
