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
import { RotateCcw, Sparkles } from "lucide-react";

export function BRRRRPresetSelector() {
  const { selectedPreset, loadPreset, resetInputs } = useBRRRR();

  return (
    <div className="flex items-center gap-3">
      <Select
        value={selectedPreset || ""}
        onValueChange={(value) => {
          if (value) loadPreset(value);
        }}
      >
        <SelectTrigger className="w-[240px]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <SelectValue placeholder="Load Scenario Preset" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {BRRRR_PRESETS.map((preset) => (
            <SelectItem key={preset.id} value={preset.id}>
              <div>
                <div className="font-medium">{preset.name}</div>
                <div className="text-xs text-muted-foreground">{preset.description}</div>
              </div>
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
