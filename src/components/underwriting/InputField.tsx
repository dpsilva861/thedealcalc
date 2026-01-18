import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { cn } from "@/lib/utils";

interface InputFieldProps {
  label: string;
  tooltip?: string;
  value: number | string;
  onChange: (value: number) => void;
  onBlur?: () => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  error?: string;
  showError?: boolean;
}

export function InputField({
  label,
  tooltip,
  value,
  onChange,
  onBlur,
  prefix,
  suffix,
  placeholder,
  min,
  max,
  step = 1,
  disabled,
  className,
  error,
  showError = false,
}: InputFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || val === "-") {
      onChange(0);
    } else {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        onChange(num);
      }
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium text-foreground">
          {label}
        </Label>
        {tooltip && (
          <HelpTooltip content={<p className="text-sm">{tooltip}</p>} />
        )}
      </div>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {prefix}
          </span>
        )}
        <Input
          type="number"
          value={typeof value === "number" ? Math.round(value * 1e10) / 1e10 : value}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={cn(
            prefix && "pl-8",
            suffix && "pr-12",
            showError && error && "border-destructive focus-visible:ring-destructive"
          )}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {suffix}
          </span>
        )}
      </div>
      {showError && error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}
