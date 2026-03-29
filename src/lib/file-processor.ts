import mammoth from "mammoth";

const MAX_TEXT_LENGTH = 50000;

/**
 * Extract text from an uploaded file based on its type.
 */
export async function extractText(
  fileBuffer: Buffer,
  filename: string
): Promise<{ text: string; truncated: boolean }> {
  const ext = filename.toLowerCase().split(".").pop();

  let rawText: string;

  switch (ext) {
    case "docx":
      rawText = await extractDocx(fileBuffer);
      break;
    case "pdf":
      rawText = await extractPdf(fileBuffer);
      break;
    case "txt":
      rawText = fileBuffer.toString("utf-8");
      break;
    default:
      throw new Error(`Unsupported file type: .${ext}. Accepted: .pdf, .docx, .txt`);
  }

  // Clean extracted text
  const cleaned = cleanText(rawText);

  // Truncate if too long
  const truncated = cleaned.length > MAX_TEXT_LENGTH;
  const text = truncated ? cleaned.substring(0, MAX_TEXT_LENGTH) : cleaned;

  return { text, truncated };
}

/**
 * Extract text from DOCX using mammoth.
 */
async function extractDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/**
 * Extract text from PDF using pdf-parse.
 * Dynamic import to avoid issues with pdf-parse's bundling.
 */
async function extractPdf(buffer: Buffer): Promise<string> {
  // pdf-parse has issues with static imports in Next.js, so dynamic import
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
  const result = await pdfParse(buffer);
  return result.text;
}

/**
 * Clean extracted text: normalize whitespace, remove common artifacts.
 */
function cleanText(text: string): string {
  return (
    text
      // Normalize line endings
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      // Remove excessive blank lines (3+ becomes 2)
      .replace(/\n{3,}/g, "\n\n")
      // Remove page number artifacts like "Page 1 of 5"
      .replace(/\bPage\s+\d+\s+of\s+\d+\b/gi, "")
      // Remove common header/footer artifacts
      .replace(/^(CONFIDENTIAL|DRAFT|PRIVILEGED)\s*$/gim, "")
      // Normalize multiple spaces to single
      .replace(/ {2,}/g, " ")
      // Trim each line
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      // Final trim
      .trim()
  );
}

/**
 * Auto-detect property type from LOI text using keyword matching.
 */
export function detectPropertyType(text: string): string | null {
  const lower = text.toLowerCase();

  const patterns: [string, string[]][] = [
    ["restaurant", ["restaurant", "food service", "kitchen", "grease trap", "hood ventilation", "liquor license", "dining", "food court"]],
    ["medical", ["medical", "dental", "healthcare", "clinic", "patient", "hipaa", "medical waste", "exam room", "physician"]],
    ["industrial", ["warehouse", "industrial", "dock door", "clear height", "truck court", "loading", "manufacturing", "distribution", "cold storage"]],
    ["retail", ["retail", "storefront", "shopping center", "mall", "tenant mix", "anchor tenant", "inline", "pad site", "outparcel", "percentage rent"]],
    ["office", ["office", "cubicle", "conference room", "executive suite", "business hours", "after-hours hvac", "elevator", "lobby"]],
    ["multifamily", ["multifamily", "apartment", "residential unit", "dwelling", "tenant unit", "unit mix"]],
    ["mixed-use", ["mixed-use", "mixed use", "residential and commercial", "live/work", "ground floor retail"]],
  ];

  // Score each type by keyword matches
  let bestType: string | null = null;
  let bestScore = 0;

  for (const [type, keywords] of patterns) {
    const score = keywords.reduce(
      (sum, keyword) => sum + (lower.includes(keyword) ? 1 : 0),
      0
    );
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  return bestScore >= 2 ? bestType : null;
}

/**
 * Auto-detect deal type from LOI text using keyword matching.
 */
export function detectDealType(text: string): string | null {
  const lower = text.toLowerCase();

  const patterns: [string, string[]][] = [
    ["renewal", ["renewal", "renew", "extend the term", "extension option", "lease extension", "renewal option"]],
    ["sublease", ["sublease", "sub-lease", "sublet", "subtenant", "sublessee", "master lease"]],
    ["amendment", ["amendment", "amend", "modification", "modify the lease", "lease amendment", "first amendment"]],
    ["assignment", ["assignment", "assign", "assignee", "assignor", "transfer of lease"]],
    ["expansion", ["expansion", "expand", "additional space", "expansion option", "expansion premises"]],
    ["new_lease", ["letter of intent", "loi", "new lease", "proposed lease", "lease proposal", "initial term"]],
  ];

  let bestType: string | null = null;
  let bestScore = 0;

  for (const [type, keywords] of patterns) {
    const score = keywords.reduce(
      (sum, keyword) => sum + (lower.includes(keyword) ? 1 : 0),
      0
    );
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  // Default to new_lease if no strong signal
  return bestScore >= 2 ? bestType : "new_lease";
}
