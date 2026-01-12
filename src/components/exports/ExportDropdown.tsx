/**
 * Export Dropdown Component
 * 
 * Unified export dropdown for all calculator results.
 * Supports Excel, CSV, PDF, Word, PowerPoint, and Google Drive exports.
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
  Cloud,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';

export type ExportFormat = 'xlsx' | 'csv' | 'pdf' | 'docx' | 'pptx' | 'google-docs' | 'google-sheets' | 'google-slides';

interface ExportDropdownProps {
  calculatorType: 'underwriting' | 'brrrr' | 'syndication';
  onExportExcel: () => Promise<void>;
  onExportCSV: () => void;
  onExportPDF: () => Promise<void>;
  onExportDocx?: () => Promise<void>;
  onExportPptx?: () => Promise<void>;
  onExportGoogleDocs?: () => Promise<{ webViewLink?: string } | void>;
  onExportGoogleSheets?: () => Promise<{ webViewLink?: string } | void>;
  onExportGoogleSlides?: () => Promise<{ webViewLink?: string } | void>;
  disabled?: boolean;
}

export function ExportDropdown({
  calculatorType,
  onExportExcel,
  onExportCSV,
  onExportPDF,
  onExportDocx,
  onExportPptx,
  onExportGoogleDocs,
  onExportGoogleSheets,
  onExportGoogleSlides,
  disabled = false,
}: ExportDropdownProps) {
  const [loading, setLoading] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat, exportFn: () => Promise<any> | void) => {
    if (loading) return;
    setLoading(format);
    
    try {
      const result = await exportFn();
      trackEvent(`export_${format}`, { calculator: calculatorType });
      
      // Handle Google Drive results with links
      if (result?.webViewLink) {
        toast.success(
          <div className="flex items-center gap-2">
            <span>Exported to Google Drive</span>
            <a 
              href={result.webViewLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline flex items-center gap-1"
            >
              Open <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        );
      } else {
        toast.success(`${format.toUpperCase()} exported successfully`);
      }
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
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span>Excel (.xlsx)</span>
            <span className="text-xs text-muted-foreground">Spreadsheet with multiple sheets</span>
          </div>
        </DropdownMenuItem>
        
        {onExportDocx && (
          <DropdownMenuItem 
            onClick={() => handleExport('docx', onExportDocx)}
            disabled={isLoading}
          >
            <FileText className="h-4 w-4 mr-2" />
            <div className="flex flex-col">
              <span>Word (.docx)</span>
              <span className="text-xs text-muted-foreground">Investor memo format</span>
            </div>
          </DropdownMenuItem>
        )}
        
        {onExportPptx && (
          <DropdownMenuItem 
            onClick={() => handleExport('pptx', onExportPptx)}
            disabled={isLoading}
          >
            <Presentation className="h-4 w-4 mr-2" />
            <div className="flex flex-col">
              <span>PowerPoint (.pptx)</span>
              <span className="text-xs text-muted-foreground">Presentation slides</span>
            </div>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Other Formats</DropdownMenuLabel>
        
        <DropdownMenuItem 
          onClick={() => handleExport('pdf', onExportPDF)}
          disabled={isLoading}
        >
          <FileText className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span>PDF</span>
            <span className="text-xs text-muted-foreground">Print-ready document</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleExport('csv', async () => onExportCSV())}
          disabled={isLoading}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span>CSV</span>
            <span className="text-xs text-muted-foreground">Simple comma-separated values</span>
          </div>
        </DropdownMenuItem>

        {(onExportGoogleDocs || onExportGoogleSheets || onExportGoogleSlides) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-1">
              <Cloud className="h-3 w-3" /> Google Drive
            </DropdownMenuLabel>
            
            {onExportGoogleDocs && (
              <DropdownMenuItem 
                onClick={() => handleExport('google-docs', onExportGoogleDocs)}
                disabled={isLoading}
              >
                <Cloud className="h-4 w-4 mr-2" />
                <div className="flex flex-col">
                  <span>Google Docs</span>
                  <span className="text-xs text-muted-foreground">Copy to Google Drive</span>
                </div>
              </DropdownMenuItem>
            )}
            
            {onExportGoogleSheets && (
              <DropdownMenuItem 
                onClick={() => handleExport('google-sheets', onExportGoogleSheets)}
                disabled={isLoading}
              >
                <Cloud className="h-4 w-4 mr-2" />
                <div className="flex flex-col">
                  <span>Google Sheets</span>
                  <span className="text-xs text-muted-foreground">Copy to Google Drive</span>
                </div>
              </DropdownMenuItem>
            )}
            
            {onExportGoogleSlides && (
              <DropdownMenuItem 
                onClick={() => handleExport('google-slides', onExportGoogleSlides)}
                disabled={isLoading}
              >
                <Cloud className="h-4 w-4 mr-2" />
                <div className="flex flex-col">
                  <span>Google Slides</span>
                  <span className="text-xs text-muted-foreground">Copy to Google Drive</span>
                </div>
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
