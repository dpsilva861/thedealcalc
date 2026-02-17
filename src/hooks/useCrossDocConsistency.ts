/**
 * useCrossDocConsistency — Cross-document consistency checks.
 *
 * When a deal has multiple documents (lease, work letter, guaranty, etc.),
 * checks that defined terms, dates, dollar amounts, party names, and
 * cross-references are consistent across all documents.
 */

import { useCallback } from "react";
import type {
  ConsistencyIssue,
  RiskLevel,
  LeaseRedlineResponse,
} from "@/lib/lease-redline/types";

interface DocumentAnalysis {
  id: string;
  fileName: string;
  documentText: string;
  response: LeaseRedlineResponse;
}

// Common date patterns
const DATE_PATTERN = /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}/gi;

// Dollar amount pattern
const AMOUNT_PATTERN = /\$[\d,]+(?:\.\d{1,2})?/g;

// Common party name indicators
const PARTY_PATTERNS = [
  /(?:Landlord|Lessor)\s*(?::|means|shall mean|is)\s*([^,.\n]+)/gi,
  /(?:Tenant|Lessee)\s*(?::|means|shall mean|is)\s*([^,.\n]+)/gi,
  /(?:Guarantor)\s*(?::|means|shall mean|is)\s*([^,.\n]+)/gi,
];

// Address pattern
const ADDRESS_PATTERN = /\d+\s+[A-Z][a-zA-Z\s]+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl)\.?(?:\s*,\s*(?:Suite|Ste|Unit|#)\s*[\dA-Z-]+)?/g;

function extractMatches(text: string, pattern: RegExp): string[] {
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(pattern.source, pattern.flags);
  while ((match = re.exec(text)) !== null) {
    matches.push(match[0].trim());
  }
  return [...new Set(matches)];
}

function extractPartyNames(text: string): { role: string; name: string }[] {
  const parties: { role: string; name: string }[] = [];
  const roles = ["Landlord", "Tenant", "Guarantor"];

  for (let i = 0; i < PARTY_PATTERNS.length; i++) {
    const re = new RegExp(PARTY_PATTERNS[i].source, PARTY_PATTERNS[i].flags);
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      if (match[1]) {
        parties.push({ role: roles[i], name: match[1].trim() });
      }
    }
  }
  return parties;
}

function getContextAround(text: string, term: string, radius: number = 80): string {
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx < 0) return "";
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + term.length + radius);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";
  return prefix + text.slice(start, end) + suffix;
}

function assessSeverity(category: ConsistencyIssue["category"]): RiskLevel {
  switch (category) {
    case "amount":
      return "critical";
    case "party_name":
      return "high";
    case "date":
      return "high";
    case "defined_term":
      return "medium";
    case "address":
      return "medium";
    case "cross_reference":
      return "low";
    default:
      return "medium";
  }
}

export function useCrossDocConsistency() {
  /** Run consistency checks across multiple document analyses */
  const checkConsistency = useCallback(
    (documents: DocumentAnalysis[]): ConsistencyIssue[] => {
      if (documents.length < 2) return [];

      const issues: ConsistencyIssue[] = [];
      let issueId = 0;

      // 1. Check defined terms consistency
      for (let i = 0; i < documents.length; i++) {
        for (let j = i + 1; j < documents.length; j++) {
          const docA = documents[i];
          const docB = documents[j];

          // Defined terms: check terms exist in both docs
          const termsA = new Set(docA.response.definedTerms.map((t) => t.toLowerCase()));
          const termsB = new Set(docB.response.definedTerms.map((t) => t.toLowerCase()));

          // Terms in A not in B
          for (const term of docA.response.definedTerms) {
            if (!termsB.has(term.toLowerCase())) {
              // Check if the term is referenced in docB's text
              if (docB.documentText.toLowerCase().includes(term.toLowerCase())) {
                issues.push({
                  id: `consistency_${++issueId}`,
                  severity: assessSeverity("defined_term"),
                  category: "defined_term",
                  description: `"${term}" is defined in ${docA.fileName} but used without definition in ${docB.fileName}`,
                  documentA: {
                    id: docA.id,
                    fileName: docA.fileName,
                    excerpt: getContextAround(docA.documentText, term),
                  },
                  documentB: {
                    id: docB.id,
                    fileName: docB.fileName,
                    excerpt: getContextAround(docB.documentText, term),
                  },
                  suggestion: `Add definition of "${term}" to ${docB.fileName} or add incorporation by reference`,
                });
              }
            }
          }

          // 2. Check dollar amounts for consistency
          const amountsA = extractMatches(docA.documentText, AMOUNT_PATTERN);
          const amountsB = extractMatches(docB.documentText, AMOUNT_PATTERN);

          // Look for amounts that appear in both docs — flag if different amounts
          // appear near the same context words
          const significantAmountsA = amountsA.filter(
            (a) => parseFloat(a.replace(/[$,]/g, "")) > 1000
          );
          const significantAmountsB = amountsB.filter(
            (a) => parseFloat(a.replace(/[$,]/g, "")) > 1000
          );

          // Check for specific labeled amounts that differ
          const labeledAmountPattern = /((?:rent|deposit|allowance|fee|cost|price|amount)\s*(?:of|:|\s)\s*)\$[\d,]+(?:\.\d{2})?/gi;
          const labeledA = extractMatches(docA.documentText, labeledAmountPattern);
          const labeledB = extractMatches(docB.documentText, labeledAmountPattern);

          for (const la of labeledA) {
            const labelPartA = la.replace(/\$[\d,]+(?:\.\d{2})?/, "").trim().toLowerCase();
            for (const lb of labeledB) {
              const labelPartB = lb.replace(/\$[\d,]+(?:\.\d{2})?/, "").trim().toLowerCase();
              if (labelPartA === labelPartB && la !== lb) {
                issues.push({
                  id: `consistency_${++issueId}`,
                  severity: "critical",
                  category: "amount",
                  description: `Amount mismatch: "${la}" in ${docA.fileName} vs "${lb}" in ${docB.fileName}`,
                  documentA: {
                    id: docA.id,
                    fileName: docA.fileName,
                    excerpt: getContextAround(docA.documentText, la),
                  },
                  documentB: {
                    id: docB.id,
                    fileName: docB.fileName,
                    excerpt: getContextAround(docB.documentText, lb),
                  },
                  suggestion: "Verify these amounts are intentionally different or correct the discrepancy",
                });
              }
            }
          }

          // 3. Check dates
          const datesA = extractMatches(docA.documentText, DATE_PATTERN);
          const datesB = extractMatches(docB.documentText, DATE_PATTERN);

          // Flag dates that appear in one doc but not the other, near key terms
          const keyDateTerms = [
            "commencement",
            "expiration",
            "termination",
            "effective",
            "delivery",
          ];
          for (const term of keyDateTerms) {
            const nearA = datesA.filter((d) => {
              const ctx = getContextAround(docA.documentText, d, 200).toLowerCase();
              return ctx.includes(term);
            });
            const nearB = datesB.filter((d) => {
              const ctx = getContextAround(docB.documentText, d, 200).toLowerCase();
              return ctx.includes(term);
            });

            if (nearA.length > 0 && nearB.length > 0) {
              const dateSetA = new Set(nearA);
              const dateSetB = new Set(nearB);
              for (const da of nearA) {
                if (!dateSetB.has(da)) {
                  issues.push({
                    id: `consistency_${++issueId}`,
                    severity: "high",
                    category: "date",
                    description: `${term} date "${da}" in ${docA.fileName} does not match dates near "${term}" in ${docB.fileName}: ${nearB.join(", ")}`,
                    documentA: {
                      id: docA.id,
                      fileName: docA.fileName,
                      excerpt: getContextAround(docA.documentText, da),
                    },
                    documentB: {
                      id: docB.id,
                      fileName: docB.fileName,
                      excerpt: getContextAround(docB.documentText, nearB[0]),
                    },
                    suggestion: `Verify the ${term} date is consistent across both documents`,
                  });
                  break; // One issue per term per pair
                }
              }
            }
          }

          // 4. Check party names
          const partiesA = extractPartyNames(docA.documentText);
          const partiesB = extractPartyNames(docB.documentText);

          for (const pa of partiesA) {
            for (const pb of partiesB) {
              if (
                pa.role === pb.role &&
                pa.name.toLowerCase() !== pb.name.toLowerCase() &&
                pa.name.length > 3 &&
                pb.name.length > 3
              ) {
                issues.push({
                  id: `consistency_${++issueId}`,
                  severity: "high",
                  category: "party_name",
                  description: `${pa.role} name differs: "${pa.name}" in ${docA.fileName} vs "${pb.name}" in ${docB.fileName}`,
                  documentA: {
                    id: docA.id,
                    fileName: docA.fileName,
                    excerpt: getContextAround(docA.documentText, pa.name),
                  },
                  documentB: {
                    id: docB.id,
                    fileName: docB.fileName,
                    excerpt: getContextAround(docB.documentText, pb.name),
                  },
                  suggestion: `Ensure ${pa.role} entity name is identical across all deal documents`,
                });
              }
            }
          }

          // 5. Check addresses
          const addressesA = extractMatches(docA.documentText, ADDRESS_PATTERN);
          const addressesB = extractMatches(docB.documentText, ADDRESS_PATTERN);

          if (addressesA.length > 0 && addressesB.length > 0) {
            const primaryA = addressesA[0];
            const primaryB = addressesB[0];
            if (
              primaryA.toLowerCase() !== primaryB.toLowerCase() &&
              primaryA.length > 10 &&
              primaryB.length > 10
            ) {
              issues.push({
                id: `consistency_${++issueId}`,
                severity: "medium",
                category: "address",
                description: `Primary address differs: "${primaryA}" vs "${primaryB}"`,
                documentA: {
                  id: docA.id,
                  fileName: docA.fileName,
                  excerpt: getContextAround(docA.documentText, primaryA),
                },
                documentB: {
                  id: docB.id,
                  fileName: docB.fileName,
                  excerpt: getContextAround(docB.documentText, primaryB),
                },
                suggestion: "Verify premises address is consistent across all documents",
              });
            }
          }
        }
      }

      // Sort by severity
      const severityOrder: Record<string, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
      };
      issues.sort(
        (a, b) =>
          (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3)
      );

      return issues;
    },
    []
  );

  return { checkConsistency };
}
