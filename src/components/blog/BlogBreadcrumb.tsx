import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export interface BreadcrumbItemData {
  label: string;
  href?: string;
}

interface BlogBreadcrumbProps {
  items: BreadcrumbItemData[];
  /**
   * Whether to include JSON-LD structured data
   * @default true
   */
  includeJsonLd?: boolean;
}

/**
 * BlogBreadcrumb - Renders breadcrumb navigation for blog pages
 * with optional JSON-LD structured data for SEO.
 * 
 * The first item should always be "Home" linking to "/".
 * The last item is rendered as the current page (non-clickable).
 */
export function BlogBreadcrumb({ items, includeJsonLd = true }: BlogBreadcrumbProps) {
  if (items.length === 0) return null;

  const baseUrl = "https://thedealcalc.com";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": item.href ? `${baseUrl}${item.href}` : undefined,
    })),
  };

  return (
    <>
      {includeJsonLd && (
        <Helmet>
          <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        </Helmet>
      )}
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            
            return (
              <BreadcrumbItem key={item.label + index}>
                {isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <>
                    <BreadcrumbLink asChild>
                      <Link to={item.href || "/"}>{item.label}</Link>
                    </BreadcrumbLink>
                    <BreadcrumbSeparator />
                  </>
                )}
              </BreadcrumbItem>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </>
  );
}

// Pre-defined breadcrumb paths for reuse
export const BLOG_BREADCRUMBS = {
  home: { label: "Home", href: "/" },
  blog: { label: "Blog", href: "/blog" },
  tags: { label: "Tags", href: "/blog/tags" },
  categories: { label: "Categories", href: "/blog" },
  series: { label: "Series", href: "/blog" },
} as const;
