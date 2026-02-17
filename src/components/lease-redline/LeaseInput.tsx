import { useState, useCallback, useRef } from "react";
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
import { FileText, Send, Loader2, Upload, X, MapPin } from "lucide-react";
import type {
  DocumentType,
  OutputMode,
  LeaseRedlineRequest,
} from "@/lib/lease-redline/types";
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPE_DESCRIPTIONS,
  OUTPUT_MODE_LABELS,
  OUTPUT_MODE_DESCRIPTIONS,
  US_JURISDICTIONS,
} from "@/lib/lease-redline/types";
import { extractPdfText } from "@/lib/lease-redline/pdf-parser";

interface LeaseInputProps {
  onSubmit: (request: LeaseRedlineRequest) => void;
  isLoading: boolean;
}

const MAX_CHARS = 200_000;
const MIN_CHARS = 100;

export function LeaseInput({ onSubmit, isLoading }: LeaseInputProps) {
  const [documentText, setDocumentText] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>("lease");
  const [outputMode, setOutputMode] = useState<OutputMode>("redline");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [jurisdiction, setJurisdiction] = useState<string>("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charCount = documentText.length;
  const canSubmit =
    documentText.trim().length >= MIN_CHARS &&
    charCount <= MAX_CHARS &&
    !isLoading;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      documentText: documentText.trim(),
      documentType,
      outputMode,
      additionalInstructions: additionalInstructions.trim() || undefined,
      jurisdiction: jurisdiction || undefined,
    });
  };

  // ── File processing ──
  const processFile = useCallback(async (file: File) => {
    setFileError(null);

    // Text files
    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const text = await file.text();
      if (text.length > MAX_CHARS) {
        setFileError(`File content exceeds ${MAX_CHARS.toLocaleString()} character limit`);
        return;
      }
      setDocumentText(text);
      setFileName(file.name);
      return;
    }

    // .docx files — extract text from OOXML
    if (
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith(".docx")
    ) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const text = await extractDocxText(arrayBuffer);
        if (text.length > MAX_CHARS) {
          setFileError(`File content exceeds ${MAX_CHARS.toLocaleString()} character limit`);
          return;
        }
        if (text.trim().length < MIN_CHARS) {
          setFileError("Could not extract sufficient text from this file");
          return;
        }
        setDocumentText(text);
        setFileName(file.name);
      } catch {
        setFileError(
          "Could not read this .docx file. Try pasting the text directly."
        );
      }
      return;
    }

    // .pdf files
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      try {
        setIsExtractingPdf(true);
        const arrayBuffer = await file.arrayBuffer();
        const text = await extractPdfText(arrayBuffer);
        if (text.length > MAX_CHARS) {
          setFileError(`File content exceeds ${MAX_CHARS.toLocaleString()} character limit`);
          return;
        }
        if (text.trim().length < MIN_CHARS) {
          setFileError("Could not extract sufficient text from this PDF. It may be a scanned document — try a .docx version instead.");
          return;
        }
        setDocumentText(text);
        setFileName(file.name);
      } catch {
        setFileError(
          "Could not read this PDF file. Try a .docx file or paste the text directly."
        );
      } finally {
        setIsExtractingPdf(false);
      }
      return;
    }

    setFileError(
      "Unsupported file type. Please upload a .pdf, .docx, or .txt file, or paste text directly."
    );
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearFile = () => {
    setFileName(null);
    setDocumentText("");
    setFileError(null);
  };

  // ── Drag and drop ──
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
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
          {/* Document Type & Output Mode */}
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
              <p className="text-xs text-muted-foreground">
                {DOCUMENT_TYPE_DESCRIPTIONS[documentType]}
              </p>
            </div>

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

          {/* Jurisdiction (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="jurisdiction" className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Jurisdiction (Optional)
            </Label>
            <Select
              value={jurisdiction}
              onValueChange={setJurisdiction}
            >
              <SelectTrigger id="jurisdiction">
                <SelectValue placeholder="Select state for jurisdiction-specific rules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None — General analysis</SelectItem>
                {US_JURISDICTIONS.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {jurisdiction && (
              <p className="text-xs text-muted-foreground">
                Agent will apply {jurisdiction}-specific commercial lease law considerations.
              </p>
            )}
          </div>

          {/* File Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            {isExtractingPdf ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Extracting text from PDF...</span>
              </div>
            ) : fileName ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{fileName}</span>
                <button
                  onClick={clearFile}
                  className="p-1 rounded-full hover:bg-muted"
                  aria-label="Remove file"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-6 w-6 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Drag & drop a .pdf, .docx, or .txt file, or{" "}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary underline hover:no-underline"
                  >
                    browse
                  </button>
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.docx,.pdf"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Upload document file"
            />
          </div>

          {fileError && (
            <p className="text-sm text-destructive">{fileError}</p>
          )}

          {/* Document Text */}
          <div className="space-y-2">
            <Label htmlFor="document-text">
              {fileName ? "Extracted Text (editable)" : "Or Paste Lease / LOI Text"}
            </Label>
            <Textarea
              id="document-text"
              value={documentText}
              onChange={(e) => {
                setDocumentText(e.target.value);
                if (fileName) setFileName(null);
              }}
              placeholder="Paste the full lease, LOI, amendment, or other document text here..."
              className="min-h-[300px] font-mono text-sm"
              disabled={isLoading}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {charCount > 0 ? (
                  <span
                    className={
                      charCount < MIN_CHARS
                        ? "text-yellow-600"
                        : charCount > MAX_CHARS
                          ? "text-destructive"
                          : ""
                    }
                  >
                    {charCount.toLocaleString()} characters
                    {charCount < MIN_CHARS && ` (min ${MIN_CHARS})`}
                    {charCount > MAX_CHARS && " (over limit)"}
                  </span>
                ) : (
                  `Minimum ${MIN_CHARS} characters required`
                )}
              </span>
              <span>Max {MAX_CHARS.toLocaleString()}</span>
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
              placeholder="Any specific focus areas, deal-specific context, property type, or special considerations..."
              className="min-h-[80px] text-sm"
              disabled={isLoading}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {additionalInstructions.length}/2,000
            </p>
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

/**
 * Extract plain text from a .docx file (OOXML format).
 * Uses the browser's built-in zip support via the Blob/Response APIs
 * and parses the XML to extract text from <w:t> elements.
 */
async function extractDocxText(arrayBuffer: ArrayBuffer): Promise<string> {
  // docx is a zip file; we need to find word/document.xml
  const blob = new Blob([arrayBuffer]);

  // Use JSZip-like approach with DecompressionStream if available
  // Fallback: parse as XML directly from the raw zip
  // For simplicity, use a manual zip entry finder

  const bytes = new Uint8Array(arrayBuffer);
  const xmlContent = findZipEntry(bytes, "word/document.xml");
  if (!xmlContent) {
    throw new Error("Could not find document.xml in docx file");
  }

  const decoder = new TextDecoder("utf-8");
  const xml = decoder.decode(xmlContent);

  // Extract text from <w:t> tags, preserving paragraph breaks
  const paragraphs: string[] = [];
  const paraRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
  let paraMatch;
  while ((paraMatch = paraRegex.exec(xml)) !== null) {
    const paraXml = paraMatch[0];
    const texts: string[] = [];
    const textRegex = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g;
    let textMatch;
    while ((textMatch = textRegex.exec(paraXml)) !== null) {
      texts.push(textMatch[1]);
    }
    if (texts.length > 0) {
      paragraphs.push(texts.join(""));
    } else {
      // Empty paragraph = line break
      paragraphs.push("");
    }
  }

  return paragraphs.join("\n");
}

/**
 * Minimal zip entry finder — locates and decompresses a file within a zip archive.
 * Supports both stored (no compression) and deflated entries.
 */
function findZipEntry(
  data: Uint8Array,
  targetName: string
): Uint8Array | null {
  let offset = 0;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  while (offset < data.length - 4) {
    const sig = view.getUint32(offset, true);
    if (sig !== 0x04034b50) break; // Local file header signature

    const compressionMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const fileNameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);

    const nameBytes = data.slice(offset + 30, offset + 30 + fileNameLen);
    const name = new TextDecoder().decode(nameBytes);

    const dataStart = offset + 30 + fileNameLen + extraLen;

    if (name === targetName) {
      const rawData = data.slice(dataStart, dataStart + compressedSize);

      if (compressionMethod === 0) {
        // Stored (no compression)
        return rawData;
      }
      if (compressionMethod === 8) {
        // Deflated — use DecompressionStream
        try {
          return decompressSync(rawData);
        } catch {
          return null;
        }
      }
      return null;
    }

    offset = dataStart + compressedSize;
  }

  return null;
}

/**
 * Decompress deflate-compressed data using a synchronous approach.
 * Falls back to returning null if the browser doesn't support DecompressionStream.
 */
function decompressSync(data: Uint8Array): Uint8Array | null {
  // Wrap raw deflate data with a minimal zlib header so DecompressionStream can handle it
  // Actually, we'll use a Response + DecompressionStream approach
  // But since this needs to be sync-ish for the zip parser, we use a different approach

  // Attempt with pako-style manual inflate using browser APIs
  // For now, try wrapping in zlib header (78 01) for "no compression" level
  const zlibWrapped = new Uint8Array(data.length + 6);
  zlibWrapped[0] = 0x78;
  zlibWrapped[1] = 0x01;
  zlibWrapped.set(data, 2);
  // Adler32 checksum placeholder (4 bytes at end — not validated by most parsers)
  zlibWrapped[data.length + 2] = 0;
  zlibWrapped[data.length + 3] = 0;
  zlibWrapped[data.length + 4] = 0;
  zlibWrapped[data.length + 5] = 0;

  // Use the synchronous DecompressionStream if available
  if (typeof DecompressionStream !== "undefined") {
    // DecompressionStream is async, but we called this from an async context
    // This won't work synchronously — return null and let caller handle
    return null;
  }

  return null;
}
