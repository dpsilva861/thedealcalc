import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { competitors } from "@/data/competitors";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";

/* ------------------------------------------------------------------ */
/*  Static params                                                     */
/* ------------------------------------------------------------------ */

export function generateStaticParams() {
  return competitors.map((c) => ({ slug: c.slug }));
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                          */
/* ------------------------------------------------------------------ */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const comp = competitors.find((c) => c.slug === slug);
  if (!comp) return { title: "Not Found" };

  return {
    title: `RedlineIQ vs ${comp.name} | CRE LOI Comparison`,
    description: `Compare RedlineIQ and ${comp.name} for commercial real estate LOI redlining. See pricing, features, and which tool wins.`,
  };
}

/* ------------------------------------------------------------------ */
/*  Feature comparison rows                                           */
/* ------------------------------------------------------------------ */

interface FeatureRow {
  feature: string;
  redlineiq: string;
  competitor: string;
}

function buildFeatureRows(comp: (typeof competitors)[number]): FeatureRow[] {
  return [
    { feature: "Price Per Document", redlineiq: "$2 flat fee", competitor: comp.price },
    { feature: "Monthly Subscription", redlineiq: "None required", competitor: comp.slug === "manual-review" || comp.slug === "in-house-legal" ? "N/A" : "Required" },
    { feature: "Analysis Speed", redlineiq: "60 seconds", competitor: comp.slug === "manual-review" ? "2-5 business days" : comp.slug === "in-house-legal" ? "Hours to days" : "Minutes" },
    { feature: "CRE Specialization", redlineiq: "Purpose-built for CRE LOIs", competitor: comp.slug === "manual-review" || comp.slug === "in-house-legal" ? "Depends on individual" : "General-purpose" },
    { feature: "Self-Learning AI", redlineiq: "Yes, improves with every LOI", competitor: comp.slug === "manual-review" || comp.slug === "in-house-legal" ? "Limited to individual experience" : "No CRE-specific learning" },
    { feature: "Market Benchmarks", redlineiq: "Built-in CRE benchmarks", competitor: comp.slug === "manual-review" || comp.slug === "in-house-legal" ? "Varies by reviewer" : "Generic contract data" },
    { feature: "Property Type Analysis", redlineiq: "8 property types supported", competitor: comp.slug === "manual-review" || comp.slug === "in-house-legal" ? "Depends on expertise" : "Not property-specific" },
    { feature: "Output Format", redlineiq: "Redlined DOCX + PDF summary", competitor: comp.slug === "manual-review" ? "Markup or memo" : comp.slug === "in-house-legal" ? "Email or memo" : "In-app suggestions" },
  ];
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default async function ComparePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const comp = competitors.find((c) => c.slug === slug);
  if (!comp) notFound();

  const features = buildFeatureRows(comp);
  const faqs = [
    { question: `How does RedlineIQ compare to ${comp.name}?`, answer: `RedlineIQ is purpose-built for CRE LOI redlining at $2 per document with no subscription. ${comp.description} ${comp.redlineiqAdvantage}` },
    { question: `Is RedlineIQ cheaper than ${comp.name}?`, answer: `Yes. RedlineIQ costs $2 per document with no subscription or monthly commitment. ${comp.name} costs ${comp.price}, making RedlineIQ significantly more cost-effective for CRE professionals.` },
    { question: `Can RedlineIQ replace ${comp.name} for LOI review?`, answer: `RedlineIQ provides comprehensive first-pass LOI analysis that catches the same issues a manual review would identify. For complex negotiations, use RedlineIQ for initial analysis and bring in additional review for final strategy.` },
    { question: "Does RedlineIQ work for all property types?", answer: "Yes. RedlineIQ supports retail, office, industrial, mixed-use, multifamily, medical, restaurant, and warehouse properties, with property-type-specific benchmarks and checklists for each." },
  ];

  const otherComps = competitors.filter((c) => c.slug !== slug);

  return (
    <div className="min-h-screen bg-background">
      <SchemaMarkup type="SoftwareApplication" />
      <SchemaMarkup type="FAQPage" data={{ faqs }} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* H1 */}
        <h1 className="text-4xl font-bold text-foreground mb-4">
          RedlineIQ vs {comp.name}: CRE LOI Redlining Compared
        </h1>
        <p className="text-lg text-muted-foreground mb-12">
          A detailed comparison of RedlineIQ and {comp.name} for commercial real estate LOI analysis.
        </p>

        {/* Intro */}
        <div className="space-y-6 mb-12">
          <p className="text-muted-foreground leading-relaxed">
            Choosing the right tool for LOI redlining can save your team thousands of dollars and days of review time. {comp.description}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            RedlineIQ takes a different approach. Built exclusively for commercial real estate LOI analysis, RedlineIQ delivers institutional-grade redlines in 60 seconds for $2 per document. No subscription, no setup, no minimum volume.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {comp.redlineiqAdvantage}
          </p>
        </div>

        {/* Comparison Table */}
        <div className="border border-border rounded-lg overflow-hidden mb-12">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary/50">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Feature</th>
                <th className="text-left p-4 text-sm font-medium text-primary">RedlineIQ</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{comp.name}</th>
              </tr>
            </thead>
            <tbody>
              {features.map((row, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="p-4 text-sm font-medium text-foreground">{row.feature}</td>
                  <td className="p-4 text-sm text-green-400">{row.redlineiq}</td>
                  <td className="p-4 text-sm text-muted-foreground">{row.competitor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pros/Cons */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Where {comp.name} Does Well
            </h2>
            <ul className="space-y-3">
              {comp.prosForThem.map((pro, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">+</span>
                  <span className="text-muted-foreground">{pro}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              {comp.name} Limitations
            </h2>
            <ul className="space-y-3">
              {comp.consForThem.map((con, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">-</span>
                  <span className="text-muted-foreground">{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Why RedlineIQ */}
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Why CRE Professionals Choose RedlineIQ
          </h2>
          <div className="space-y-4 text-muted-foreground mb-6">
            <p>
              RedlineIQ is the only AI tool built exclusively for commercial real estate LOI redlining. While {comp.name} {comp.slug === "manual-review" || comp.slug === "in-house-legal" ? "offers human expertise" : "provides general contract analysis"}, RedlineIQ combines CRE-specific benchmarks with a self-learning engine that gets smarter with every document processed.
            </p>
            <p>
              At $2 per document, RedlineIQ removes cost as a barrier to professional LOI review. Every commercial lease negotiation deserves expert analysis, not just the largest deals.
            </p>
          </div>
          <Link
            href="/redline"
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-8 py-3 text-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Try RedlineIQ for $2
          </Link>
        </div>

        {/* FAQ */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-border rounded-lg p-6">
                <h3 className="text-lg font-medium text-foreground mb-3">{faq.question}</h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Other comparisons */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Other Comparisons
          </h2>
          <div className="flex flex-wrap gap-3">
            {otherComps.map((c) => (
              <Link
                key={c.slug}
                href={`/compare/${c.slug}`}
                className="text-sm text-primary hover:text-primary/80 border border-border rounded-md px-4 py-2 transition-colors hover:bg-secondary/50"
              >
                RedlineIQ vs {c.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
