import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts } from "@/data/blog-posts";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";

/* ------------------------------------------------------------------ */
/*  Static params                                                     */
/* ------------------------------------------------------------------ */

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
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
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return { title: "Not Found" };

  return {
    title: `${post.title} | RedlineIQ Blog`,
    description: post.metaDescription,
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      type: "article",
      publishedTime: post.publishedDate,
      authors: ["RedlineIQ"],
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function estimateReadTime(content: string): number {
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.round(words / 250));
}

/** Extract H2 headings from markdown content for table of contents */
function extractH2s(content: string): { id: string; text: string }[] {
  const h2Regex = /^## (.+)$/gm;
  const headings: { id: string; text: string }[] = [];
  let match;
  while ((match = h2Regex.exec(content)) !== null) {
    const text = match[1].trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
    headings.push({ id, text });
  }
  return headings;
}

/** Render markdown-style content to React elements */
function renderContent(content: string): React.ReactNode[] {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;
  let listItems: React.ReactNode[] = [];
  let listType: "ul" | "ol" | null = null;
  let inList = false;

  function flushList() {
    if (inList && listItems.length > 0) {
      if (listType === "ol") {
        elements.push(
          <ol key={key++} className="list-decimal list-outside ml-6 space-y-2 text-slate-300 leading-relaxed mb-6">
            {listItems}
          </ol>
        );
      } else {
        elements.push(
          <ul key={key++} className="list-disc list-outside ml-6 space-y-2 text-slate-300 leading-relaxed mb-6">
            {listItems}
          </ul>
        );
      }
      listItems = [];
      listType = null;
      inList = false;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Empty line
    if (line.trim() === "") {
      flushList();
      continue;
    }

    // H2
    if (line.startsWith("## ")) {
      flushList();
      const text = line.slice(3).trim();
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");
      elements.push(
        <h2 key={key++} id={id} className="text-2xl font-bold text-white mt-12 mb-4 scroll-mt-24">
          {renderInline(text)}
        </h2>
      );
      continue;
    }

    // H3
    if (line.startsWith("### ")) {
      flushList();
      const text = line.slice(4).trim();
      elements.push(
        <h3 key={key++} className="text-xl font-semibold text-white mt-8 mb-3">
          {renderInline(text)}
        </h3>
      );
      continue;
    }

    // Unordered list item
    if (line.match(/^- /)) {
      if (listType !== "ul") flushList();
      inList = true;
      listType = "ul";
      listItems.push(
        <li key={key++}>{renderInline(line.slice(2).trim())}</li>
      );
      continue;
    }

    // Ordered list item
    const olMatch = line.match(/^(\d+)\.\s/);
    if (olMatch) {
      if (listType !== "ol") flushList();
      inList = true;
      listType = "ol";
      listItems.push(
        <li key={key++}>{renderInline(line.slice(olMatch[0].length).trim())}</li>
      );
      continue;
    }

    // Paragraph
    flushList();
    elements.push(
      <p key={key++} className="text-slate-300 leading-relaxed mb-6">
        {renderInline(line)}
      </p>
    );
  }

  flushList();
  return elements;
}

/** Render inline markdown: **bold**, [links](url) */
function renderInline(text: string): React.ReactNode {
  // Split on bold and link patterns
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let partKey = 0;

  while (remaining.length > 0) {
    // Find the next pattern
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);

    let nextIdx = remaining.length;
    let nextType: "bold" | "link" | null = null;

    if (boldMatch && boldMatch.index !== undefined && boldMatch.index < nextIdx) {
      nextIdx = boldMatch.index;
      nextType = "bold";
    }
    if (linkMatch && linkMatch.index !== undefined && linkMatch.index < nextIdx) {
      nextIdx = linkMatch.index;
      nextType = "link";
    }

    if (nextType === null) {
      // No more patterns
      parts.push(remaining);
      break;
    }

    // Text before the pattern
    if (nextIdx > 0) {
      parts.push(remaining.slice(0, nextIdx));
    }

    if (nextType === "bold" && boldMatch) {
      parts.push(
        <strong key={`b-${partKey++}`} className="text-white font-semibold">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(nextIdx + boldMatch[0].length);
    } else if (nextType === "link" && linkMatch) {
      const href = linkMatch[2];
      const isInternal = href.startsWith("/");
      if (isInternal) {
        parts.push(
          <Link
            key={`l-${partKey++}`}
            href={href}
            className="text-electric hover:text-electric-hover underline underline-offset-2 transition-colors"
          >
            {linkMatch[1]}
          </Link>
        );
      } else {
        parts.push(
          <a
            key={`l-${partKey++}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-electric hover:text-electric-hover underline underline-offset-2 transition-colors"
          >
            {linkMatch[1]}
          </a>
        );
      }
      remaining = remaining.slice(nextIdx + linkMatch[0].length);
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  const readTime = estimateReadTime(post.content);
  const h2s = extractH2s(post.content);
  const related = post.relatedSlugs
    .map((s) => blogPosts.find((p) => p.slug === s))
    .filter(Boolean) as typeof blogPosts;

  return (
    <div className="min-h-screen bg-navy">
      {/* Schema */}
      <SchemaMarkup
        type="Article"
        data={{
          headline: post.title,
          datePublished: post.publishedDate,
          author: "RedlineIQ",
        }}
      />
      {post.faqs.length > 0 && (
        <SchemaMarkup type="FAQPage" data={{ faqs: post.faqs }} />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex gap-12">
          {/* Table of Contents - Desktop sidebar */}
          {h2s.length > 0 && (
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  Table of Contents
                </h4>
                <nav className="space-y-2">
                  {h2s.map((h) => (
                    <a
                      key={h.id}
                      href={`#${h.id}`}
                      className="block text-sm text-slate-400 hover:text-electric transition-colors leading-snug py-1"
                    >
                      {h.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}

          {/* Main content */}
          <article className="flex-1 max-w-3xl">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-8">
              <Link href="/blog" className="hover:text-white transition-colors">
                Blog
              </Link>
              <span>/</span>
              <span className="text-slate-400">{post.category}</span>
            </div>

            {/* Post header */}
            <header className="mb-10">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
                {post.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <time dateTime={post.publishedDate}>
                  {new Date(post.publishedDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <span className="px-2.5 py-1 rounded-full bg-electric/10 text-electric border border-electric/20 text-xs font-medium">
                  {post.category}
                </span>
                <span>{readTime} min read</span>
              </div>
            </header>

            {/* Post body */}
            <div className="prose-custom">{renderContent(post.content)}</div>

            {/* CTA */}
            <div className="bg-electric/5 border border-electric/20 rounded-lg p-8 text-center mt-16 mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">
                Ready to Redline Your Next LOI?
              </h2>
              <p className="text-slate-400 mb-6">
                Upload your LOI and get institutional-grade redlines in 60
                seconds. Just $2 per document.
              </p>
              <Link
                href="/redline"
                className="inline-flex items-center justify-center rounded-lg bg-electric hover:bg-electric-hover text-white px-8 py-3 text-lg font-medium transition-colors"
              >
                Try RedlineIQ for $2
              </Link>
            </div>

            {/* FAQ Section */}
            {post.faqs.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-semibold text-white mb-6">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                  {post.faqs.map((faq, i) => (
                    <div
                      key={i}
                      className="border border-white/5 rounded-lg p-6 bg-navy-light/50"
                    >
                      <h3 className="text-lg font-medium text-white mb-3">
                        {faq.question}
                      </h3>
                      <p className="text-slate-400 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Posts */}
            {related.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">
                  Related Articles
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {related.map((r) => (
                    <Link
                      key={r.slug}
                      href={`/blog/${r.slug}`}
                      className="group block border border-white/5 rounded-lg p-5 hover:border-electric/30 transition-colors bg-navy-light/50"
                    >
                      <span className="text-xs text-electric mb-1 block">
                        {r.category}
                      </span>
                      <span className="text-sm font-medium text-white group-hover:text-electric transition-colors">
                        {r.title}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>
      </div>
    </div>
  );
}
