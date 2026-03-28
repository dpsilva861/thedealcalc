"use client";

interface DealScoreGaugeProps {
  score: number;
  size?: number;
}

export function DealScoreGauge({ score, size = 140 }: DealScoreGaugeProps) {
  const clampedScore = Math.max(1, Math.min(10, score));
  const percentage = clampedScore / 10;
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  // 270 degree arc (0.75 of circle)
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength * (1 - percentage);
  const center = size / 2;

  const getColor = () => {
    if (clampedScore <= 3) return { stroke: "#EF4444", text: "text-red-400", label: "High Risk" };
    if (clampedScore <= 6) return { stroke: "#EAB308", text: "text-yellow-400", label: "Moderate" };
    return { stroke: "#22C55E", text: "text-emerald-400", label: "Strong" };
  };

  const color = getColor();

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-[135deg]">
          {/* Background arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference - arcLength}`}
          />
          {/* Score arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference - arcLength}`}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${color.text}`}>
            {clampedScore}
          </span>
          <span className="text-xs text-slate-500">/10</span>
        </div>
      </div>
      <p className={`text-sm font-medium mt-1 ${color.text}`}>{color.label}</p>
    </div>
  );
}
