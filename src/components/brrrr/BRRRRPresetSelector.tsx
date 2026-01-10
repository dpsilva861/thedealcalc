import { useNavigate } from "react-router-dom";
import { useBRRRR } from "@/contexts/BRRRRContext";
import { BRRRR_PRESETS } from "@/lib/calculators/brrrr/presets";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RotateCcw, Sparkles, Play, ChevronDown } from "lucide-react";

// Simple display labels for presets
const PRESET_LABELS: Record<string, string> = {
  typical: "Moderate Rehab",
  conservative: "Conservative Rehab",
  aggressive: "Aggressive Rehab",
};

export function BRRRRPresetSelector() {
  const navigate = useNavigate();
  const { selectedPreset, loadPreset, loadPresetAndRun, resetInputs } = useBRRRR();

  const handleQuickRun = (presetId: string) => {
    const result = loadPresetAndRun(presetId);
    if (result) {
      navigate("/brrrr/results");
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Quick Run Scenarios Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" size="sm" className="gap-2 whitespace-nowrap">
            <Play className="h-4 w-4" />
            Quick Scenarios
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {BRRRR_PRESETS.map((preset) => (
            <DropdownMenuItem
              key={preset.id}
              onClick={() => handleQuickRun(preset.id)}
              className="cursor-pointer"
            >
              {PRESET_LABELS[preset.id] || preset.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Load Preset Only (for editing) */}
      <Select
        value={selectedPreset || ""}
        onValueChange={(value) => {
          if (value) loadPreset(value);
        }}
      >
        <SelectTrigger className="w-[180px] sm:w-[200px]">
          <span className="flex items-center gap-2 min-w-0">
            <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="truncate">
              <SelectValue placeholder="Load Preset">
                {selectedPreset ? PRESET_LABELS[selectedPreset] || selectedPreset : null}
              </SelectValue>
            </span>
          </span>
        </SelectTrigger>
        <SelectContent>
          {BRRRR_PRESETS.map((preset) => (
            <SelectItem key={preset.id} value={preset.id} textValue={PRESET_LABELS[preset.id] || preset.name}>
              {PRESET_LABELS[preset.id] || preset.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        size="sm"
        onClick={resetInputs}
        className="text-muted-foreground"
      >
        <RotateCcw className="h-4 w-4 mr-1" />
        Reset
      </Button>
    </div>
  );
}
