/**
 * FAQ Types and Utilities
 * 
 * Shared types for FAQ content that serves as the single source of truth
 * for both UI rendering and FAQPage JSON-LD structured data.
 */

export interface FAQ {
  question: string;
  answer: string;
}

type JsonRecord = Record<string, unknown>;

/**
 * Build FAQPage schema from FAQ items
 * Returns null if no FAQs provided (do not emit empty FAQPage)
 */
export function buildFAQPageSchema(faqs: FAQ[]): JsonRecord | null {
  if (!faqs || faqs.length === 0) {
    return null;
  }

  return {
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}
