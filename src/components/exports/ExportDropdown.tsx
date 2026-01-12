/**
 * Export Dropdown Component
 * 
 * Unified export dropdown for all calculator results.
 * Supports Excel, CSV, PDF, Word, and PowerPoint exports.
 * 
 * NOTE: Google Drive exports are NOT implemented per project requirements.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Presentation,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';

export type ExportFormat = 'xlsx' | 'csv' | 'pdf' | 'docx' | 'pptx';

interface ExportDropdownProps {
  calculatorType: 'underwriting' | 'brrrr' | 'syndication';
  onExportExcel: () => Promise<void>;
  onExportCSV: () => void;
  onExportPDF: () => Promise<void>;
  onExportDocx: () => Promise<void>;
  onExportPptx: () => Promise<void>;
  disabled?: boolean;
}

export function ExportDropdown({
  calculatorType,
  onExportExcel,
  onExportCSV,
  onExportPDF,
  onExportDocx,
  onExportPptx,
  disabled = false,
}: ExportDropdownProps) {
  const [loading, setLoading] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat, exportFn: () => Promise<void> | void) => {
    if (loading) return;
    setLoading(format);
    
    try {
      await exportFn();
      trackEvent(`export_${format}`, { calculator: calculatorType });
      toast.success(`${format.toUpperCase()} exported successfully`);
    } catch (err) {
      console.error(`${format} export failed:`, err);
      toast.error(`Failed to export ${format.toUpperCase()}`);
    } finally {
      setLoading(null);
    }
  };

  const isLoading = loading !== null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="hero" disabled={disabled || isLoading}>
          {isLoading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-background">
        <DropdownMenuLabel>Microsoft Formats</DropdownMenuLabel>
        
        <DropdownMenuItem 
          onClick={() => handleExport('xlsx', onExportExcel)}
          disabled={isLoading}
          className="cursor-pointer"
        >
          <FileSpreadsheet className="h-4 w-4 mr-3 text-muted-foreground" />
          <div className="flex flex-col">
            <span>Excel (.xlsx)</span>
            <span className="text-xs text-muted-foreground">Spreadsheet with multiple sheets</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleExport('docx', onExportDocx)}
          disabled={isLoading}
          className="cursor-pointer"
        >
          <FileText className="h-4 w-4 mr-3 text-muted-foreground" />
          <div className="flex flex-col">
            <span>Word (.docx)</span>
            <span className="text-xs text-muted-foreground">Investor memo format</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleExport('pptx', onExportPptx)}
          disabled={isLoading}
          className="cursor-pointer"
        >
          <Presentation className="h-4 w-4 mr-3 text-muted-foreground" />
          <div className="flex flex-col">
            <span>PowerPoint (.pptx)</span>
            <span className="text-xs text-muted-foreground">Presentation slides</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Other Formats</DropdownMenuLabel>
        
        <DropdownMenuItem 
          onClick={() => handleExport('pdf', onExportPDF)}
          disabled={isLoading}
          className="cursor-pointer"
        >
          <FileText className="h-4 w-4 mr-3 text-muted-foreground" />
          <div className="flex flex-col">
            <span>PDF</span>
            <span className="text-xs text-muted-foreground">Print-ready document</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleExport('csv', async () => onExportCSV())}
          disabled={isLoading}
          className="cursor-pointer"
        >
          <FileSpreadsheet className="h-4 w-4 mr-3 text-muted-foreground" />
          <div className="flex flex-col">
            <span>CSV</span>
            <span className="text-xs text-muted-foreground">Simple comma-separated values</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
