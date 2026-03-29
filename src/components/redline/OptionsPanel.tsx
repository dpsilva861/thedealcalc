"use client";

import { Info } from "lucide-react";
import { useState } from "react";

export interface RedlineOptions {
  perspective: "landlord" | "tenant";
  mode: "aggressive" | "standard" | "lenient";
  propertyType: string;
  dealType: string;
}

interface OptionsPanelProps {
  options: RedlineOptions;
  onChange: (options: RedlineOptions) => void;
}

const propertyTypes = [
  { value: "retail", label: "Retail" },
  { value: "office", label: "Office" },
  { value: "industrial", label: "Industrial" },
  { value: "mixed-use", label: "Mixed-Use" },
  { value: "multifamily", label: "Multifamily" },
  { value: "medical", label: "Medical" },
  { value: "restaurant", label: "Restaurant" },
  { value: "other", label: "Other" },
];

const dealTypes = [
  { value: "new_lease", label: "New Lease" },
  { value: "renewal", label: "Renewal" },
  { value: "amendment", label: "Amendment" },
  { value: "sublease", label: "Sublease" },
  { value: "assignment", label: "Assignment" },
  { value: "expansion", label: "Expansion" },
];

const modeDescriptions: Record<string, string> = {
  aggressive: "Flag everything. Maximum protection.",
  standard: "Industry-standard benchmarks. Balanced approach.",
  lenient: "Focus on critical issues only. Deal-friendly.",
};

function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  tooltips,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  tooltips?: Record<string, string>;
}) {
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      <div className="flex rounded-xl bg-black/20 border border-white/[0.06] p-1">
        {options.map((opt) => (
          <div key={opt.value} className="relative flex-1">
            <button
              onClick={() => onChange(opt.value)}
              onMouseEnter={() => tooltips && setHoveredTooltip(opt.value)}
              onMouseLeave={() => setHoveredTooltip(null)}
              className={`w-full px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                value === opt.value
                  ? "bg-electric text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {opt.label}
            </button>
            {tooltips && hoveredTooltip === opt.value && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-navy-lighter border border-white/10 text-xs text-slate-300 whitespace-nowrap z-10 shadow-lg">
                {tooltips[opt.value]}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-navy-lighter" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function OptionsPanel({ options, onChange }: OptionsPanelProps) {
  const selectStyle = {
    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
    backgroundPosition: "right 0.5rem center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "1.5em 1.5em",
  };

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 space-y-6">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <Info className="w-4 h-4 text-electric" />
        Analysis Options
      </h3>

      {/* Perspective */}
      <SegmentedControl
        label="Perspective"
        options={[
          { value: "landlord" as const, label: "Landlord" },
          { value: "tenant" as const, label: "Tenant" },
        ]}
        value={options.perspective}
        onChange={(v) => onChange({ ...options, perspective: v })}
      />

      {/* Mode */}
      <SegmentedControl
        label="Redline Mode"
        options={[
          { value: "aggressive" as const, label: "Aggressive" },
          { value: "standard" as const, label: "Standard" },
          { value: "lenient" as const, label: "Lenient" },
        ]}
        value={options.mode}
        onChange={(v) => onChange({ ...options, mode: v })}
        tooltips={modeDescriptions}
      />

      {/* Property Type */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Property Type
        </label>
        <select
          value={options.propertyType}
          onChange={(e) => onChange({ ...options, propertyType: e.target.value })}
          className="w-full px-3 py-2.5 rounded-xl bg-black/20 border border-white/[0.06] text-sm text-slate-300 focus:outline-none focus:border-electric/30 focus:ring-1 focus:ring-electric/20 transition-colors appearance-none cursor-pointer"
          style={selectStyle}
        >
          {propertyTypes.map((t) => (
            <option key={t.value} value={t.value} className="bg-navy-light">
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Deal Type */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Deal Type
        </label>
        <select
          value={options.dealType}
          onChange={(e) => onChange({ ...options, dealType: e.target.value })}
          className="w-full px-3 py-2.5 rounded-xl bg-black/20 border border-white/[0.06] text-sm text-slate-300 focus:outline-none focus:border-electric/30 focus:ring-1 focus:ring-electric/20 transition-colors appearance-none cursor-pointer"
          style={selectStyle}
        >
          {dealTypes.map((t) => (
            <option key={t.value} value={t.value} className="bg-navy-light">
              {t.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
