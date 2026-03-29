import { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/data/blog-posts";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";

export const metadata: Metadata = {
  title: "Blog | CREagentic",
  description:
    "CRE insights, LOI negotiation strategies, and AI-powered lease analysis tips from the CREagentic team.",
};

const CATEGORIES = [
  "All",
  "LOI Basics",
  "Negotiation Strategy",
  "AI & Technology",
  "Property Types",
] as const;

const POSTS_PER_PAGE = 6;

function estimateReadTime(content: string): number {
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.round(words / 250));
}

function excerpt(content: string, maxLen = 150): string {
  // Strip markdown formatting for the excerpt
  const plain = content
    .replace(/#{1,3}\s+/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^- /gm, "")
    .replace(/^\d+\.\s/gm, "")
    .replace(/\n+/g, " ")
    .trim();
  if (plain.length <= maxLen) return plain;
  return plain.slice(0, maxLen).replace(/\s+\S*$/, "") + "...";
}

export default function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  // Note: We read searchParams synchronously from the resolved object
  // but Next.js 15 requires it to be a Promise type in the signature.
  // For static generation, we render the "All" / page 1 default.
  // Client-side filtering is handled via URL params.

  return <BlogContent />;
}

function BlogContent() {
  const sorted = [...blogPosts].sort(
    (a, b) =>
      new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
  );

  return (
    <div className="min-h-screen bg-navy">
      <SchemaMarkup
        type="WebPage"
        data={{
          pageTitle: "Blog | CREagentic",
          pageDescription:
            "CRE insights, LOI negotiation strategies, and AI-powered lease analysis tips.",
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Header */}
        <h1 className="text-4xl font-bold text-white mb-4">
          CREagentic Blog
        </h1>
        <p className="text-lg text-slate-400 mb-12">
          Practical CRE insights, LOI negotiation strategies, and guides for
          commercial real estate professionals.
        </p>

        {/* Category Filter Tabs (client-side via CSS :target or JS) */}
        <BlogFilteredGrid posts={sorted} />
      </div>
    </div>
  );
}

function BlogFilteredGrid({ posts }: { posts: typeof blogPosts }) {
  // Since this is a static page, render all posts grouped by category.
  // We use a simple approach: render all categories as sections with IDs,
  // and provide tabs that link to anchors. For full interactivity,
  // this would be a client component, but for SEO we render everything.

  return (
    <>
      {/* Category nav */}
      <div className="flex flex-wrap gap-2 mb-10 border-b border-white/5 pb-6">
        {CATEGORIES.map((cat) => (
          <a
            key={cat}
            href={cat === "All" ? "#all" : `#cat-${cat.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "and")}`}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-electric/40 transition-colors"
          >
            {cat}
          </a>
        ))}
      </div>

      {/* All posts grid */}
      <div id="all" className="grid md:grid-cols-2 gap-6">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </>
  );
}

function BlogCard({ post }: { post: (typeof blogPosts)[number] }) {
  const readTime = estimateReadTime(post.content);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block border border-white/5 rounded-lg p-6 hover:border-electric/30 transition-colors bg-navy-light/50"
    >
      {/* Category badge + date */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-electric/10 text-electric border border-electric/20">
          {post.category}
        </span>
        <span className="text-xs text-slate-500">
          {new Date(post.publishedDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
        <span className="text-xs text-slate-500">{readTime} min read</span>
      </div>

      {/* Title */}
      <h2 className="text-lg font-semibold text-white group-hover:text-electric transition-colors mb-2">
        {post.title}
      </h2>

      {/* Excerpt */}
      <p className="text-sm text-slate-400 leading-relaxed mb-4">
        {excerpt(post.content)}
      </p>

      {/* Read more */}
      <span className="text-sm font-medium text-electric group-hover:text-electric-hover transition-colors">
        Read More &rarr;
      </span>
    </Link>
  );
}
