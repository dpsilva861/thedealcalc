import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { states, TOP_STATES } from "@/data/states";
import { propertyTypes } from "@/data/property-types";
import { dealTypes } from "@/data/deal-types";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";

/* ------------------------------------------------------------------ */
/*  Page type detection                                               */
/* ------------------------------------------------------------------ */

type PageType =
  | { kind: "state"; state: (typeof states)[number] }
  | { kind: "propertyType"; pt: (typeof propertyTypes)[number] }
  | { kind: "dealType"; dt: (typeof dealTypes)[number] }
  | { kind: "cross"; pt: (typeof propertyTypes)[number]; state: (typeof states)[number] };

function detectPage(slug: string): PageType | null {
  const s = states.find((st) => st.slug === slug);
  if (s) return { kind: "state", state: s };

  const pt = propertyTypes.find((p) => p.slug === slug);
  if (pt) return { kind: "propertyType", pt };

  const dt = dealTypes.find((d) => d.slug === slug);
  if (dt) return { kind: "dealType", dt };

  // Cross: "{propertyType}-{state}"
  for (const p of propertyTypes) {
    if (slug.startsWith(p.slug + "-")) {
      const stateSlug = slug.slice(p.slug.length + 1);
      const st = states.find((ss) => ss.slug === stateSlug);
      if (st) return { kind: "cross", pt: p, state: st };
    }
  }

  return null;
}

/* ------------------------------------------------------------------ */
/*  Static params                                                     */
/* ------------------------------------------------------------------ */

export function generateStaticParams() {
  const params: { slug: string }[] = [];

  for (const s of states) params.push({ slug: s.slug });
  for (const p of propertyTypes) params.push({ slug: p.slug });
  for (const d of dealTypes) params.push({ slug: d.slug });

  // Cross pages: top 5 states x all property types
  for (const stateSlug of TOP_STATES) {
    for (const p of propertyTypes) {
      params.push({ slug: `${p.slug}-${stateSlug}` });
    }
  }

  return params;
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                          */
/* ------------------------------------------------------------------ */

function pageTitle(page: PageType): string {
  switch (page.kind) {
    case "state":
      return `LOI Redlining in ${page.state.name} | RedlineIQ`;
    case "propertyType":
      return `${page.pt.name} LOI Redlining | RedlineIQ`;
    case "dealType":
      return `${page.dt.name} LOI Review | RedlineIQ`;
    case "cross":
      return `${page.pt.name} LOI in ${page.state.name} | RedlineIQ`;
  }
}

function pageDescription(page: PageType): string {
  switch (page.kind) {
    case "state":
      return `AI-powered LOI redlining for ${page.state.name} commercial real estate. Get instant, expert analysis for $2 per document.`;
    case "propertyType":
      return `Redline ${page.pt.name.toLowerCase()} LOIs with AI. Benchmarks, checklists, and suggested language specific to ${page.pt.name.toLowerCase()} leases.`;
    case "dealType":
      return `AI analysis for ${page.dt.name.toLowerCase()} LOIs. Key considerations, market benchmarks, and redline recommendations for $2.`;
    case "cross":
      return `${page.pt.name} LOI redlining for ${page.state.name}. State-specific benchmarks and property-type analysis in 60 seconds.`;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = detectPage(slug);
  if (!page) return { title: "Not Found" };

  return {
    title: pageTitle(page),
    description: pageDescription(page),
  };
}

/* ------------------------------------------------------------------ */
/*  Content builders                                                  */
/* ------------------------------------------------------------------ */

function buildH1(page: PageType): string {
  switch (page.kind) {
    case "state":
      return `LOI Redlining for Commercial Real Estate in ${page.state.name}`;
    case "propertyType":
      return `${page.pt.name} LOI Redlining and Analysis`;
    case "dealType":
      return `${page.dt.name} LOI Review and Redlining`;
    case "cross":
      return `${page.pt.name} LOI Redlining in ${page.state.name}`;
  }
}

function buildFaqs(page: PageType): { question: string; answer: string }[] {
  switch (page.kind) {
    case "state":
      return [
        { question: `What should I look for in a ${page.state.name} commercial LOI?`, answer: `${page.state.context} RedlineIQ analyzes every provision against ${page.state.name}-relevant market standards and flags issues automatically.` },
        { question: `How much does LOI redlining cost in ${page.state.name}?`, answer: `RedlineIQ charges $2 per document regardless of location. Traditional attorney review in ${page.state.name} typically costs $500 to $2,000+ per LOI.` },
        { question: `Does RedlineIQ understand ${page.state.name} commercial lease regulations?`, answer: `Yes. RedlineIQ's AI engine is trained on CRE lease provisions across all 50 states and flags state-specific considerations for ${page.state.name} properties.` },
        { question: `How fast is LOI analysis for ${page.state.name} properties?`, answer: `RedlineIQ delivers comprehensive redline analysis in approximately 60 seconds, compared to 2 to 5 business days for traditional manual review.` },
      ];
    case "propertyType":
      return [
        { question: `What are the most important provisions in a ${page.pt.name.toLowerCase()} LOI?`, answer: `Key provisions include ${page.pt.keyChecklist.slice(0, 3).join(", ").toLowerCase()}. RedlineIQ checks all of these automatically.` },
        { question: `Can AI accurately review ${page.pt.name.toLowerCase()} LOIs?`, answer: `Yes. RedlineIQ's AI is specifically trained on CRE lease provisions including ${page.pt.name.toLowerCase()}-specific benchmarks, market standards, and common issues.` },
        { question: `What does a ${page.pt.name.toLowerCase()} LOI redline include?`, answer: `RedlineIQ provides severity-rated findings, suggested alternative language, market benchmarks, missing provision alerts, and a negotiation strategy tailored to ${page.pt.name.toLowerCase()} deals.` },
      ];
    case "dealType":
      return [
        { question: `What makes a ${page.dt.name.toLowerCase()} LOI different from other LOIs?`, answer: `${page.dt.description} RedlineIQ's analysis is tailored to these specific dynamics.` },
        { question: `What are the key risks in a ${page.dt.name.toLowerCase()} LOI?`, answer: `Critical considerations include ${page.dt.keyConsiderations.slice(0, 3).join("; ").toLowerCase()}. RedlineIQ flags all of these automatically.` },
        { question: `How does RedlineIQ handle ${page.dt.name.toLowerCase()} LOIs?`, answer: `RedlineIQ identifies the deal type from the LOI text and applies deal-specific analysis criteria, benchmarks, and risk factors relevant to ${page.dt.name.toLowerCase()} transactions.` },
      ];
    case "cross":
      return [
        { question: `What are ${page.pt.name.toLowerCase()} LOI considerations specific to ${page.state.name}?`, answer: `${page.state.context} For ${page.pt.name.toLowerCase()} properties specifically, this means paying attention to ${page.pt.keyChecklist[0].toLowerCase()} and ${page.pt.keyChecklist[1].toLowerCase()}.` },
        { question: `How much does a ${page.pt.name.toLowerCase()} LOI review cost in ${page.state.name}?`, answer: `RedlineIQ analyzes any commercial LOI for $2, including ${page.pt.name.toLowerCase()} properties in ${page.state.name}. Attorney review typically costs $500 to $2,000+.` },
        { question: `Does RedlineIQ cover ${page.pt.name.toLowerCase()} lease provisions in ${page.state.name}?`, answer: `Yes. RedlineIQ combines ${page.state.name}-specific regulatory knowledge with ${page.pt.name.toLowerCase()} property type analysis, covering provisions like ${page.pt.keyChecklist[2].toLowerCase()}.` },
        { question: `How quickly can I get ${page.pt.name.toLowerCase()} LOI redlines for a ${page.state.name} property?`, answer: `RedlineIQ delivers comprehensive analysis in approximately 60 seconds. Upload your LOI and receive institutional-grade redlines immediately.` },
      ];
  }
}

function buildChecklist(page: PageType): string[] {
  switch (page.kind) {
    case "state":
      return [
        "State-specific regulatory compliance provisions",
        "Property tax escalation structure appropriate for the jurisdiction",
        "Security deposit requirements under state law",
        "Default cure periods that meet or exceed state minimums",
        "Environmental disclosure requirements",
        "Assignment and subletting consent standards",
        "Insurance requirements aligned with local market standards",
      ];
    case "propertyType":
      return page.pt.keyChecklist;
    case "dealType":
      return page.dt.keyConsiderations;
    case "cross":
      return [
        ...page.pt.keyChecklist.slice(0, 4),
        `${page.state.name}-specific regulatory compliance`,
        `Property tax provisions appropriate for ${page.state.abbreviation}`,
        `Insurance requirements meeting ${page.state.name} standards`,
      ];
  }
}

function buildContent(page: PageType): string[] {
  switch (page.kind) {
    case "state":
      return [
        `Commercial real estate transactions in ${page.state.name} require careful LOI review to ensure lease provisions comply with state regulations and reflect local market standards. ${page.state.context}`,
        `RedlineIQ analyzes every provision in your ${page.state.name} LOI against institutional-grade benchmarks, flagging issues from security deposit structures to operating expense pass-throughs. Our AI engine understands the nuances of ${page.state.name}'s commercial lease environment and identifies provisions that need attention before you sign.`,
        `Whether you are a landlord, tenant representative, broker, or attorney working on ${page.state.name} commercial properties, RedlineIQ delivers comprehensive redline analysis in 60 seconds for $2 per document. Upload your LOI and receive severity-rated findings, suggested alternative language, and a complete negotiation strategy.`,
        `Our self-learning engine continuously improves its analysis by incorporating feedback from real CRE transactions across ${page.state.name} and all 50 states, ensuring you always get the most current and relevant recommendations.`,
      ];
    case "propertyType":
      return [
        `${page.pt.name} leases involve specialized provisions that generic contract review tools often miss. ${page.pt.description}`,
        `RedlineIQ is built specifically for commercial real estate LOI analysis, with deep knowledge of ${page.pt.name.toLowerCase()} lease benchmarks and industry standards. Our AI flags missing provisions, identifies below-market terms, and provides specific alternative language for every issue found.`,
        `Every ${page.pt.name.toLowerCase()} LOI is different, but the critical provisions remain consistent. RedlineIQ checks each LOI against a comprehensive framework covering rent structure, operating expenses, build-out provisions, use restrictions, and more, all calibrated for ${page.pt.name.toLowerCase()} properties.`,
        `Upload your ${page.pt.name.toLowerCase()} LOI and receive institutional-grade redlines in 60 seconds. RedlineIQ costs $2 per document with no subscription required.`,
      ];
    case "dealType":
      return [
        `${page.dt.name} LOIs present unique challenges that require specialized analysis. ${page.dt.description}`,
        `RedlineIQ automatically identifies the deal type from your LOI text and applies the appropriate analysis framework. For ${page.dt.name.toLowerCase()} transactions, this means evaluating provisions through the lens of ${page.dt.keyConsiderations[0].toLowerCase()} and ${page.dt.keyConsiderations[1].toLowerCase()}.`,
        `Traditional manual review of a ${page.dt.name.toLowerCase()} LOI costs $500 to $2,000+ and takes 2 to 5 business days. RedlineIQ delivers the same institutional-grade analysis in 60 seconds for $2 per document, making professional LOI review accessible to every CRE professional.`,
        `Our AI engine learns from thousands of real ${page.dt.name.toLowerCase()} transactions, continuously improving its benchmarks and recommendations. Every LOI RedlineIQ processes makes the next analysis smarter.`,
      ];
    case "cross":
      return [
        `${page.pt.name} properties in ${page.state.name} require LOI analysis that combines property-type expertise with state-specific regulatory knowledge. ${page.state.context}`,
        `For ${page.pt.name.toLowerCase()} leases specifically, ${page.state.name} presents considerations around ${page.pt.keyChecklist[0].toLowerCase()} and ${page.pt.keyChecklist[1].toLowerCase()}. RedlineIQ evaluates every provision against both ${page.pt.name.toLowerCase()} industry standards and ${page.state.name}-specific benchmarks.`,
        `RedlineIQ's AI engine has analyzed commercial LOIs across all 50 states and every major property type. This cross-market knowledge base means your ${page.pt.name.toLowerCase()} LOI in ${page.state.name} benefits from insights gathered across thousands of similar transactions nationwide.`,
        `Upload your ${page.state.name} ${page.pt.name.toLowerCase()} LOI and get comprehensive redlines in 60 seconds for just $2. No subscription, no setup, no minimum commitment.`,
      ];
  }
}

function buildRelatedLinks(page: PageType): { href: string; label: string }[] {
  const links: { href: string; label: string }[] = [];

  switch (page.kind) {
    case "state":
      for (const pt of propertyTypes.slice(0, 6)) {
        links.push({ href: `/loi-redline/${pt.slug}-${page.state.slug}`, label: `${pt.name} in ${page.state.name}` });
      }
      break;
    case "propertyType":
      for (const stSlug of TOP_STATES) {
        const st = states.find((s) => s.slug === stSlug);
        if (st) links.push({ href: `/loi-redline/${page.pt.slug}-${st.slug}`, label: `${page.pt.name} in ${st.name}` });
      }
      break;
    case "dealType":
      for (const pt of propertyTypes.slice(0, 4)) {
        links.push({ href: `/loi-redline/${pt.slug}`, label: `${pt.name} LOI Redlining` });
      }
      for (const stSlug of TOP_STATES.slice(0, 3)) {
        const st = states.find((s) => s.slug === stSlug);
        if (st) links.push({ href: `/loi-redline/${st.slug}`, label: `LOI Redlining in ${st.name}` });
      }
      break;
    case "cross":
      for (const pt of propertyTypes.filter((p) => p.slug !== page.pt.slug).slice(0, 4)) {
        links.push({ href: `/loi-redline/${pt.slug}-${page.state.slug}`, label: `${pt.name} in ${page.state.name}` });
      }
      links.push({ href: `/loi-redline/${page.state.slug}`, label: `All CRE in ${page.state.name}` });
      links.push({ href: `/loi-redline/${page.pt.slug}`, label: `All ${page.pt.name} LOIs` });
      break;
  }

  return links;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default async function LOIRedlinePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = detectPage(slug);
  if (!page) notFound();

  const h1 = buildH1(page);
  const content = buildContent(page);
  const checklist = buildChecklist(page);
  const faqs = buildFaqs(page);
  const related = buildRelatedLinks(page);
  const ctaLabel =
    page.kind === "propertyType"
      ? `Redline Your ${page.pt.name} LOI Now`
      : page.kind === "cross"
        ? `Redline Your ${page.pt.name} LOI Now`
        : "Redline Your LOI Now";

  return (
    <div className="min-h-screen bg-background">
      {/* Schema */}
      <SchemaMarkup type="SoftwareApplication" />
      <SchemaMarkup
        type="FAQPage"
        data={{ faqs }}
      />
      <SchemaMarkup
        type="HowTo"
        data={{
          howToName: `How to Redline a ${page.kind === "propertyType" ? page.pt.name : page.kind === "state" ? page.state.name : page.kind === "dealType" ? page.dt.name : `${page.pt.name} ${page.state.name}`} LOI`,
          howToDescription: `Use RedlineIQ to analyze your commercial real estate LOI in 60 seconds.`,
          steps: [
            { name: "Upload Your LOI", text: "Upload your LOI as a DOCX, PDF, or paste the text directly." },
            { name: "Select Options", text: "Choose your perspective (landlord or tenant), property type, and analysis mode." },
            { name: "Pay $2", text: "Complete a secure $2 payment via Stripe." },
            { name: "Review Redlines", text: "Receive severity-rated findings, suggested language, and a negotiation strategy." },
          ],
        }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* H1 */}
        <h1 className="text-4xl font-bold text-foreground mb-8">{h1}</h1>

        {/* Content paragraphs */}
        <div className="space-y-6 mb-12">
          {content.map((para, i) => (
            <p key={i} className="text-lg text-muted-foreground leading-relaxed">
              {para}
            </p>
          ))}
        </div>

        {/* Key Items to Check */}
        <div className="bg-secondary/50 border border-border rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Key Items to Check</h2>
          <ul className="space-y-3">
            {checklist.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-primary mt-1">&#x2713;</span>
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Ready to Redline Your LOI?
          </h2>
          <p className="text-muted-foreground mb-6">
            Upload your LOI and get institutional-grade redlines in 60 seconds. Just $2 per document.
          </p>
          <Link
            href="/redline"
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-8 py-3 text-lg font-medium hover:bg-primary/90 transition-colors"
          >
            {ctaLabel}
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
                <h3 className="text-lg font-medium text-foreground mb-3">
                  {faq.question}
                </h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Related Pages */}
        {related.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Related Pages
            </h2>
            <div className="flex flex-wrap gap-3">
              {related.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-primary hover:text-primary/80 border border-border rounded-md px-4 py-2 transition-colors hover:bg-secondary/50"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
