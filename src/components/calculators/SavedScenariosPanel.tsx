/**
 * Saved Scenarios Panel Component
 * 
 * Reusable UI for save/load/delete scenarios across all calculators.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FolderOpen, Save, Trash2 } from 'lucide-react';

interface Scenario {
  id: string;
  name: string;
  savedAt: string;
}

interface SavedScenariosPanelProps {
  scenarios: Scenario[];
  onSave: (name?: string) => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  title?: string;
}

export function SavedScenariosPanel({
  scenarios,
  onSave,
  onLoad,
  onDelete,
  title = 'Saved Scenarios',
}: SavedScenariosPanelProps) {
  const [showScenarios, setShowScenarios] = useState(false);
  const [scenarioName, setScenarioName] = useState('');

  const handleSave = () => {
    onSave(scenarioName.trim() || undefined);
    setScenarioName('');
    setShowScenarios(true);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            {title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowScenarios(!showScenarios)}
          >
            {showScenarios ? 'Hide' : 'Show'} ({scenarios.length})
          </Button>
        </div>
      </CardHeader>
      {showScenarios && (
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Scenario name (optional)"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleSave}>
                    <Save className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save current inputs as a named scenario</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {scenarios.length > 0 ? (
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {scenarios.map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                  <span className="truncate flex-1">{s.name}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onLoad(s.id)}>
                      Load
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(s.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No saved scenarios yet
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
