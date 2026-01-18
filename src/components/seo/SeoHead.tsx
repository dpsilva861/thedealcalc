import { Helmet } from "react-helmet-async";
import { ReactNode } from "react";

const BASE_URL = "https://thedealcalc.com";
const DEFAULT_OG_IMAGE = "/og/og-default.png";

interface SeoHeadProps {
  /** Page title (≤60 chars recommended) */
  title: string;
  /** Meta description (≤155 chars recommended) */
  description: string;
  /** Canonical path (e.g., "/npv-calculator") */
  canonicalPath: string;
  /** OG image path relative to public (e.g., "/og/og-npv.png") */
  ogImagePath?: string;
  /** Twitter image path (defaults to ogImagePath) */
  twitterImagePath?: string;
  /** OG title override (defaults to title) */
  ogTitle?: string;
  /** OG description override (defaults to description) */
  ogDescription?: string;
  /** OG type (defaults to "website") */
  ogType?: "website" | "article";
  /** Whether the page should be indexed (defaults to true) */
  indexable?: boolean;
  /** JSON-LD structured data */
  schemaJson?: object | object[];
  /** Additional head elements */
  children?: ReactNode;
}

/**
 * Centralized SEO component for consistent meta tags across all pages.
 * Ensures every page has proper title, description, canonical, OG, and Twitter tags.
 */
export function SeoHead({
  title,
  description,
  canonicalPath,
  ogImagePath = DEFAULT_OG_IMAGE,
  twitterImagePath,
  ogTitle,
  ogDescription,
  ogType = "website",
  indexable = true,
  schemaJson,
  children,
}: SeoHeadProps) {
  const canonicalUrl = `${BASE_URL}${canonicalPath}`;
  const fullOgImage = `${BASE_URL}${ogImagePath}`;
  const fullTwitterImage = `${BASE_URL}${twitterImagePath || ogImagePath}`;
  
  const finalOgTitle = ogTitle || title;
  const finalOgDescription = ogDescription || description;
  const robotsContent = indexable ? "index, follow" : "noindex, follow";

  return (
    <Helmet>
      {/* Primary Meta */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={finalOgTitle} />
      <meta property="og:description" content={finalOgDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:site_name" content="TheDealCalc" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalOgTitle} />
      <meta name="twitter:description" content={finalOgDescription} />
      <meta name="twitter:image" content={fullTwitterImage} />

      {/* Structured Data */}
      {schemaJson && (
        <script type="application/ld+json">
          {JSON.stringify(schemaJson)}
        </script>
      )}

      {children}
    </Helmet>
  );
}

export default SeoHead;
