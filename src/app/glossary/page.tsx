import { Metadata } from "next";
import Link from "next/link";
import { glossaryTerms } from "@/data/glossary-terms";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";

export const metadata: Metadata = {
  title: "CRE Glossary: 50+ Commercial Real Estate Terms | CREagentic",
  description: "Complete glossary of commercial real estate lease terms. LOI, NNN, CAM, TI, SNDA, and 50+ more terms explained clearly.",
};

export default function GlossaryPage() {
  // Sort alphabetically by term
  const sorted = [...glossaryTerms].sort((a, b) =>
    a.term.localeCompare(b.term)
  );

  // Group by first letter
  const groups: Record<string, typeof sorted> = {};
  for (const term of sorted) {
    const letter = term.term[0].toUpperCase();
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(term);
  }
  const letters = Object.keys(groups).sort();

  // Build FAQ schema from all terms
  const faqs = sorted.map((t) => ({
    question: `What does ${t.term} mean in commercial real estate?`,
    answer: t.definition,
  }));

  return (
    <div className="min-h-screen bg-background">
      <SchemaMarkup type="SoftwareApplication" />
      <SchemaMarkup type="FAQPage" data={{ faqs }} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Commercial Real Estate Glossary
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          {sorted.length}+ essential CRE lease and LOI terms explained. Use this reference
          to understand every provision in your next commercial real estate transaction.
        </p>

        {/* Alphabet nav */}
        <div className="flex flex-wrap gap-2 mb-12 border-b border-border pb-6">
          {letters.map((letter) => (
            <a
              key={letter}
              href={`#letter-${letter}`}
              className="w-9 h-9 flex items-center justify-center rounded-md text-sm font-medium text-primary hover:bg-primary/10 border border-border transition-colors"
            >
              {letter}
            </a>
          ))}
        </div>

        {/* Terms by letter */}
        <div className="space-y-12">
          {letters.map((letter) => (
            <div key={letter} id={`letter-${letter}`}>
              <h2 className="text-2xl font-bold text-primary mb-6 border-b border-border pb-2">
                {letter}
              </h2>
              <div className="space-y-6">
                {groups[letter].map((term) => (
                  <div
                    key={term.slug}
                    id={term.slug}
                    className="border border-border rounded-lg p-6 hover:border-primary/30 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {term.term}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-3">
                      {term.definition}
                    </p>
                    {term.relatedTerms.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-muted-foreground">Related:</span>
                        {term.relatedTerms.map((rt) => {
                          const related = glossaryTerms.find((g) => g.slug === rt);
                          return related ? (
                            <a
                              key={rt}
                              href={`#${rt}`}
                              className="text-xs text-primary hover:text-primary/80 border border-border rounded px-2 py-1 transition-colors"
                            >
                              {related.term}
                            </a>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-8 text-center mt-16">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Know the Terms. Redline the LOI.
          </h2>
          <p className="text-muted-foreground mb-6">
            Now that you understand the terminology, upload your LOI and get
            institutional-grade redlines in 60 seconds. Just $2 per document.
          </p>
          <Link
            href="/redline"
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-8 py-3 text-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Redline Your LOI Now
          </Link>
        </div>
      </div>
    </div>
  );
}
