export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { extractText, detectPropertyType, detectDealType } from "@/lib/file-processor";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
const ALLOWED_EXTENSIONS = ["pdf", "docx", "txt"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file extension
    const ext = file.name.toLowerCase().split(".").pop();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { success: false, error: `Unsupported file type: .${ext}. Accepted: .pdf, .docx, .txt` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Validate MIME type (relaxed - some files may have generic types)
    if (file.type && !ALLOWED_TYPES.includes(file.type) && file.type !== "application/octet-stream") {
      // Only warn, don't block - rely on extension check
      console.warn(`Unexpected MIME type: ${file.type} for file ${file.name}`);
    }

    // Extract text
    const buffer = Buffer.from(await file.arrayBuffer());
    const { text, truncated } = await extractText(buffer, file.name);

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Could not extract text from file. The file may be empty, scanned, or corrupted." },
        { status: 422 }
      );
    }

    // Auto-detect property and deal types
    const detectedPropertyType = detectPropertyType(text);
    const detectedDealType = detectDealType(text);

    return NextResponse.json({
      success: true,
      data: {
        text,
        detectedPropertyType,
        detectedDealType,
        filename: file.name,
        charCount: text.length,
        truncated,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to process file" },
      { status: 500 }
    );
  }
}
