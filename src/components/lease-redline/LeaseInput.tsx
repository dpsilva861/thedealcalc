import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Send, Loader2 } from "lucide-react";
import type {
  DocumentType,
  OutputMode,
  LeaseRedlineRequest,
} from "@/lib/lease-redline/types";
import {
  DOCUMENT_TYPE_LABELS,
  OUTPUT_MODE_LABELS,
  OUTPUT_MODE_DESCRIPTIONS,
} from "@/lib/lease-redline/types";

interface LeaseInputProps {
  onSubmit: (request: LeaseRedlineRequest) => void;
  isLoading: boolean;
}

export function LeaseInput({ onSubmit, isLoading }: LeaseInputProps) {
  const [documentText, setDocumentText] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>("lease");
  const [outputMode, setOutputMode] = useState<OutputMode>("redline");
  const [additionalInstructions, setAdditionalInstructions] = useState("");

  const canSubmit = documentText.trim().length > 50 && !isLoading;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      documentText: documentText.trim(),
      documentType,
      outputMode,
      additionalInstructions: additionalInstructions.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Document Input
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Document Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="document-type">Document Type</Label>
              <Select
                value={documentType}
                onValueChange={(val) => setDocumentType(val as DocumentType)}
              >
                <SelectTrigger id="document-type">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[]).map(
                    (key) => (
                      <SelectItem key={key} value={key}>
                        {DOCUMENT_TYPE_LABELS[key]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Output Mode */}
            <div className="space-y-2">
              <Label htmlFor="output-mode">Output Mode</Label>
              <Select
                value={outputMode}
                onValueChange={(val) => setOutputMode(val as OutputMode)}
              >
                <SelectTrigger id="output-mode">
                  <SelectValue placeholder="Select output mode" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(OUTPUT_MODE_LABELS) as OutputMode[]).map(
                    (key) => (
                      <SelectItem key={key} value={key}>
                        <span>{OUTPUT_MODE_LABELS[key]}</span>
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {OUTPUT_MODE_DESCRIPTIONS[outputMode]}
              </p>
            </div>
          </div>

          {/* Document Text */}
          <div className="space-y-2">
            <Label htmlFor="document-text">
              Paste Lease / LOI Text
            </Label>
            <Textarea
              id="document-text"
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              placeholder="Paste the full lease, LOI, amendment, or other document text here..."
              className="min-h-[300px] font-mono text-sm"
              disabled={isLoading}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {documentText.length > 0
                  ? `${documentText.length.toLocaleString()} characters`
                  : "Minimum 50 characters required"}
              </span>
              <span>Max 100,000 characters</span>
            </div>
          </div>

          {/* Additional Instructions */}
          <div className="space-y-2">
            <Label htmlFor="additional-instructions">
              Additional Instructions (Optional)
            </Label>
            <Textarea
              id="additional-instructions"
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              placeholder="Any specific focus areas, deal-specific context, or special considerations..."
              className="min-h-[80px] text-sm"
              disabled={isLoading}
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing Document...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Analyze & Redline
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center px-4">
        This tool provides AI-generated redline suggestions from a landlord
        perspective. It does not constitute legal advice and should not replace
        review by a qualified attorney. All suggestions should be reviewed and
        validated by legal counsel before use.
      </p>
    </div>
  );
}
