/**
 * DOCX Track Changes Import
 *
 * Parses .docx files that contain tracked changes (insertions/deletions)
 * from the counterparty and extracts them for review.
 *
 * Uses the same zip/XML parsing approach as LeaseInput's DOCX handler
 * but specifically targets w:ins and w:del elements.
 */

import type { DocxImportResult, ImportedTrackChange } from "./types";

/**
 * Parse a .docx file's ArrayBuffer to extract tracked changes.
 *
 * DOCX files are ZIP archives containing XML. Track changes live in
 * word/document.xml as <w:ins> (insertions) and <w:del> (deletions).
 */
export async function importDocxTrackChanges(
  buffer: ArrayBuffer
): Promise<DocxImportResult> {
  // Minimal ZIP reader — extract word/document.xml
  const bytes = new Uint8Array(buffer);
  const xmlContent = await extractDocumentXml(bytes);

  if (!xmlContent) {
    throw new Error("Could not find word/document.xml in the DOCX file");
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, "text/xml");

  // Extract plain text (all <w:t> elements)
  const plainText = extractPlainText(doc);

  // Extract tracked changes
  const trackChanges: ImportedTrackChange[] = [];
  const authors = new Set<string>();
  let changeId = 0;

  // Find all <w:ins> elements (insertions)
  const insertions = doc.getElementsByTagName("w:ins");
  for (let i = 0; i < insertions.length; i++) {
    const el = insertions[i];
    const author = el.getAttribute("w:author") || "Unknown";
    const date = el.getAttribute("w:date") || "";
    const text = getTextContent(el);
    const context = getContextForElement(el);

    authors.add(author);
    if (text.trim()) {
      trackChanges.push({
        id: `tc_ins_${++changeId}`,
        type: "insertion",
        author,
        date,
        text: text.trim(),
        context,
        paragraphIndex: getParagraphIndex(el),
      });
    }
  }

  // Find all <w:del> elements (deletions)
  const deletions = doc.getElementsByTagName("w:del");
  for (let i = 0; i < deletions.length; i++) {
    const el = deletions[i];
    const author = el.getAttribute("w:author") || "Unknown";
    const date = el.getAttribute("w:date") || "";
    // Deleted text is in <w:delText> elements
    const text = getDeletedTextContent(el);
    const context = getContextForElement(el);

    authors.add(author);
    if (text.trim()) {
      trackChanges.push({
        id: `tc_del_${++changeId}`,
        type: "deletion",
        author,
        date,
        text: text.trim(),
        context,
        paragraphIndex: getParagraphIndex(el),
      });
    }
  }

  // Sort by paragraph index
  trackChanges.sort((a, b) => a.paragraphIndex - b.paragraphIndex);

  return {
    plainText,
    trackChanges,
    authors: [...authors],
    totalInsertions: trackChanges.filter((tc) => tc.type === "insertion").length,
    totalDeletions: trackChanges.filter((tc) => tc.type === "deletion").length,
  };
}

// ── Internal helpers ──────────────────────────────────────────────────────

async function extractDocumentXml(bytes: Uint8Array): Promise<string | null> {
  // Simple ZIP file reader — find the local file header for word/document.xml
  const target = "word/document.xml";
  let offset = 0;

  while (offset < bytes.length - 4) {
    // Local file header signature: 0x04034b50
    if (
      bytes[offset] === 0x50 &&
      bytes[offset + 1] === 0x4b &&
      bytes[offset + 2] === 0x03 &&
      bytes[offset + 3] === 0x04
    ) {
      const nameLen = bytes[offset + 26] | (bytes[offset + 27] << 8);
      const extraLen = bytes[offset + 28] | (bytes[offset + 29] << 8);
      const compressedSize =
        bytes[offset + 18] |
        (bytes[offset + 19] << 8) |
        (bytes[offset + 20] << 16) |
        (bytes[offset + 21] << 24);

      const nameBytes = bytes.slice(offset + 30, offset + 30 + nameLen);
      const name = new TextDecoder().decode(nameBytes);

      const dataStart = offset + 30 + nameLen + extraLen;

      if (name === target) {
        // Check compression method (0 = stored, 8 = deflate)
        const compressionMethod = bytes[offset + 8] | (bytes[offset + 9] << 8);

        if (compressionMethod === 0) {
          // Stored (uncompressed)
          const data = bytes.slice(dataStart, dataStart + compressedSize);
          return new TextDecoder().decode(data);
        } else if (compressionMethod === 8) {
          // Deflate — use DecompressionStream (async)
          try {
            const data = bytes.slice(dataStart, dataStart + compressedSize);
            return await decompressRaw(data);
          } catch {
            return null;
          }
        }
      }

      offset = dataStart + compressedSize;
    } else {
      offset++;
    }
  }

  return null;
}

async function decompressRaw(data: Uint8Array): Promise<string> {
  const ds = new DecompressionStream("raw");
  const blob = new Blob([data]);
  const decompressedStream = blob.stream().pipeThrough(ds);
  const response = new Response(decompressedStream);
  return response.text();
}

function extractPlainText(doc: Document): string {
  const paragraphs: string[] = [];
  const pElements = doc.getElementsByTagName("w:p");

  for (let i = 0; i < pElements.length; i++) {
    const texts: string[] = [];
    const tElements = pElements[i].getElementsByTagName("w:t");
    for (let j = 0; j < tElements.length; j++) {
      texts.push(tElements[j].textContent || "");
    }
    // Also include deleted text for full context
    const delTexts = pElements[i].getElementsByTagName("w:delText");
    for (let j = 0; j < delTexts.length; j++) {
      texts.push(delTexts[j].textContent || "");
    }
    if (texts.length > 0) {
      paragraphs.push(texts.join(""));
    }
  }

  return paragraphs.join("\n");
}

function getTextContent(el: Element): string {
  const texts: string[] = [];
  const tElements = el.getElementsByTagName("w:t");
  for (let i = 0; i < tElements.length; i++) {
    texts.push(tElements[i].textContent || "");
  }
  return texts.join("");
}

function getDeletedTextContent(el: Element): string {
  const texts: string[] = [];
  const delTexts = el.getElementsByTagName("w:delText");
  for (let i = 0; i < delTexts.length; i++) {
    texts.push(delTexts[i].textContent || "");
  }
  return texts.join("");
}

function getContextForElement(el: Element): string {
  // Get the parent paragraph and extract all text for context
  let parent: Element | null = el.parentElement;
  while (parent && parent.tagName !== "w:p") {
    parent = parent.parentElement;
  }
  if (!parent) return "";

  const texts: string[] = [];
  const tElements = parent.getElementsByTagName("w:t");
  for (let i = 0; i < tElements.length; i++) {
    texts.push(tElements[i].textContent || "");
  }
  const delTexts = parent.getElementsByTagName("w:delText");
  for (let i = 0; i < delTexts.length; i++) {
    texts.push(delTexts[i].textContent || "");
  }
  const full = texts.join("");
  return full.length > 200 ? full.slice(0, 200) + "..." : full;
}

function getParagraphIndex(el: Element): number {
  let parent: Element | null = el.parentElement;
  while (parent && parent.tagName !== "w:p") {
    parent = parent.parentElement;
  }
  if (!parent || !parent.parentElement) return 0;

  const siblings = parent.parentElement.getElementsByTagName("w:p");
  for (let i = 0; i < siblings.length; i++) {
    if (siblings[i] === parent) return i;
  }
  return 0;
}
