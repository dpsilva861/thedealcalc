import { Check, X, Minus } from "lucide-react";

const rows = [
  {
    feature: "Cost per LOI",
    redlineiq: "$2",
    manual: "$200-500/hr",
    enterprise: "$160+/month",
  },
  {
    feature: "Time to Complete",
    redlineiq: "60 seconds",
    manual: "2-4 hours",
    enterprise: "15-30 min",
  },
  {
    feature: "CRE Specialized",
    redlineiq: true,
    manual: "varies",
    enterprise: false,
  },
  {
    feature: "Self-Learning",
    redlineiq: true,
    manual: false,
    enterprise: "limited",
  },
  {
    feature: "No Subscription",
    redlineiq: true,
    manual: "n/a",
    enterprise: false,
  },
  {
    feature: "Tracked Changes Output",
    redlineiq: true,
    manual: true,
    enterprise: "some",
  },
];

function CellValue({ value }: { value: boolean | string }) {
  if (value === true)
    return (
      <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
        <Check className="w-3.5 h-3.5 text-emerald-400" />
      </div>
    );
  if (value === false)
    return (
      <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
        <X className="w-3.5 h-3.5 text-red-400" />
      </div>
    );
  if (value === "n/a")
    return <Minus className="w-4 h-4 text-slate-600 mx-auto" />;
  return <span className="text-sm text-slate-400">{value}</span>;
}

export function Comparison() {
  return (
    <section id="comparison" className="relative py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-electric tracking-wide uppercase mb-3">
            Comparison
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            How CREagentic Stacks Up
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Compare the speed, cost, and capabilities of different LOI review approaches.
          </p>
        </div>

        {/* Table */}
        <div className="max-w-4xl mx-auto overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-sm font-medium text-slate-500 pb-4 pr-4 w-1/4">
                  Feature
                </th>
                <th className="text-center pb-4 px-4 w-1/4">
                  <div className="inline-flex flex-col items-center">
                    <span className="text-sm font-semibold text-electric">CREagentic</span>
                  </div>
                </th>
                <th className="text-center text-sm font-medium text-slate-500 pb-4 px-4 w-1/4">
                  Manual Review
                </th>
                <th className="text-center text-sm font-medium text-slate-500 pb-4 pl-4 w-1/4">
                  Enterprise Legal AI
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.feature}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="text-sm text-slate-300 py-4 pr-4 font-medium">
                    {row.feature}
                  </td>
                  <td className="text-center py-4 px-4">
                    <div className="relative">
                      {typeof row.redlineiq === "string" ? (
                        <span className="text-sm font-semibold text-white">
                          {row.redlineiq}
                        </span>
                      ) : (
                        <CellValue value={row.redlineiq} />
                      )}
                    </div>
                  </td>
                  <td className="text-center py-4 px-4">
                    <CellValue value={row.manual} />
                  </td>
                  <td className="text-center py-4 pl-4">
                    <CellValue value={row.enterprise} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Highlight bar for CREagentic column */}
        <div className="max-w-4xl mx-auto mt-2">
          <div className="flex">
            <div className="w-1/4" />
            <div className="w-1/4 px-4">
              <div className="h-0.5 bg-gradient-to-r from-electric/0 via-electric/40 to-electric/0 rounded-full" />
            </div>
            <div className="w-1/4" />
            <div className="w-1/4" />
          </div>
        </div>
      </div>
    </section>
  );
}
