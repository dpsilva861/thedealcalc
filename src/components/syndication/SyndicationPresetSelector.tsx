import { useNavigate } from "react-router-dom";
import { useSyndication, SYNDICATION_PRESETS } from "@/contexts/SyndicationContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RotateCcw, Sparkles, Play, ChevronDown } from "lucide-react";

const PRESET_LABELS: Record<string, string> = { default: "Standard 5-Year", conservative: "Conservative", aggressive: "Value-Add" };

export function SyndicationPresetSelector() {
  const navigate = useNavigate();
  const { selectedPreset, loadPreset, loadPresetAndRun, resetInputs } = useSyndication();
  const handleQuickRun = (presetId: string) => { const result = loadPresetAndRun(presetId); if (result) navigate("/syndication/results"); };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="whitespace-nowrap">
            <Play className="h-3 w-3 mr-1" />
            Quick Scenarios
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {Object.entries(SYNDICATION_PRESETS).map(([key, preset]) => (
            <DropdownMenuItem key={key} onClick={() => handleQuickRun(key)} className="cursor-pointer">{PRESET_LABELS[key] || preset.name}</DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Select value={selectedPreset || ""} onValueChange={(v) => { if (v) loadPreset(v); }}>
        <SelectTrigger className="w-[160px]">
          <div className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            <SelectValue placeholder="Load Preset" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(SYNDICATION_PRESETS).map(([key, preset]) => (
            <SelectItem key={key} value={key} textValue={PRESET_LABELS[key] || preset.name}>{PRESET_LABELS[key] || preset.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="ghost" size="sm" onClick={resetInputs}><RotateCcw className="h-3 w-3 mr-1" />Reset</Button>
    </div>
  );
}
