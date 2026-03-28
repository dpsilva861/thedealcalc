"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, X, ClipboardPaste, File } from "lucide-react";

export interface UploadResult {
  text: string;
  filename: string;
  charCount: number;
  detectedPropertyType: string | null;
  detectedDealType: string | null;
  truncated: boolean;
}

interface UploadZoneProps {
  onUploadComplete: (result: UploadResult) => void;
  onClear: () => void;
  uploadResult: UploadResult | null;
}

type TabType = "file" | "paste";

export function UploadZone({ onUploadComplete, onClear, uploadResult }: UploadZoneProps) {
  const [activeTab, setActiveTab] = useState<TabType>("file");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();

        if (!data.success) {
          setError(data.error || "Upload failed");
          return;
        }

        onUploadComplete({
          text: data.data.text,
          filename: data.data.filename,
          charCount: data.data.charCount,
          detectedPropertyType: data.data.detectedPropertyType,
          detectedDealType: data.data.detectedDealType,
          truncated: data.data.truncated,
        });
      } catch {
        setError("Failed to upload file. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [onUploadComplete]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handlePasteSubmit = useCallback(() => {
    if (!pasteText.trim()) return;
    setError(null);
    onUploadComplete({
      text: pasteText.trim(),
      filename: "pasted-text.txt",
      charCount: pasteText.trim().length,
      detectedPropertyType: null,
      detectedDealType: null,
      truncated: false,
    });
  }, [pasteText, onUploadComplete]);

  // Already uploaded state
  if (uploadResult) {
    return (
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-electric/10 border border-electric/20 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-electric" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{uploadResult.filename}</p>
              <p className="text-xs text-slate-500 mt-1">
                {uploadResult.charCount.toLocaleString()} characters extracted
                {uploadResult.truncated && " (truncated)"}
              </p>
              {(uploadResult.detectedPropertyType || uploadResult.detectedDealType) && (
                <div className="flex gap-2 mt-2">
                  {uploadResult.detectedPropertyType && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-electric/10 text-electric border border-electric/20">
                      {uploadResult.detectedPropertyType}
                    </span>
                  )}
                  {uploadResult.detectedDealType && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {uploadResult.detectedDealType.replace("_", " ")}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClear}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
            aria-label="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Text preview */}
        <div className="mt-4 p-3 rounded-lg bg-black/20 border border-white/[0.04]">
          <p className="text-xs text-slate-500 mb-1 font-medium">Preview</p>
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-4 whitespace-pre-wrap">
            {uploadResult.text.slice(0, 500)}
            {uploadResult.text.length > 500 && "..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-white/[0.06]">
        <button
          onClick={() => setActiveTab("file")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "file"
              ? "text-electric border-b-2 border-electric bg-electric/5"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Upload className="w-4 h-4" />
          Upload File
        </button>
        <button
          onClick={() => setActiveTab("paste")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "paste"
              ? "text-electric border-b-2 border-electric bg-electric/5"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <ClipboardPaste className="w-4 h-4" />
          Paste Text
        </button>
      </div>

      <div className="p-6">
        {activeTab === "file" ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center px-6 py-12 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
              isDragging
                ? "border-electric bg-electric/5"
                : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
            } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />

            {isUploading ? (
              <>
                <div className="w-10 h-10 rounded-full border-2 border-electric border-t-transparent animate-spin mb-4" />
                <p className="text-sm text-slate-300">Processing document...</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                  <File className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-white mb-1">
                  Drop your LOI here or click to browse
                </p>
                <p className="text-xs text-slate-500">
                  PDF, DOCX, or TXT up to 10MB
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste your LOI text here..."
              className="w-full h-48 px-4 py-3 rounded-xl bg-black/20 border border-white/[0.06] text-sm text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:border-electric/30 focus:ring-1 focus:ring-electric/20 transition-colors"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {pasteText.length.toLocaleString()} characters
              </p>
              <button
                onClick={handlePasteSubmit}
                disabled={!pasteText.trim()}
                className="px-4 py-2 bg-electric hover:bg-electric-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                Process Text
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
