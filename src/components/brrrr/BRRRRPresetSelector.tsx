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
          <Button variant="default" size="sm" className="gap-2">
            <Play className="h-4 w-4" />
            Quick Scenarios
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          {BRRRR_PRESETS.map((preset) => (
            <DropdownMenuItem
              key={preset.id}
              onClick={() => handleQuickRun(preset.id)}
              className="flex flex-col items-start py-2 whitespace-normal"
            >
              <span className="font-medium">{preset.name}</span>
              <span className="text-xs text-muted-foreground line-clamp-2">{preset.description}</span>
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
        <SelectTrigger className="w-[180px]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <SelectValue placeholder="Load Preset" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {BRRRR_PRESETS.map((preset) => (
            <SelectItem key={preset.id} value={preset.id} className="flex-col items-start">
              <span className="font-medium">{preset.name}</span>
              <span className="text-xs text-muted-foreground">{preset.description}</span>
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
