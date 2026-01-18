/**
 * Schema.org JSON-LD Builders
 * 
 * Utility functions for generating structured data schemas
 * compliant with Google Rich Results requirements.
 * 
 * ARCHITECTURE:
 * - Global schemas (Organization, WebSite) are emitted ONCE at Layout level
 * - Page-specific schemas (SoftwareApplication, FAQPage, BreadcrumbList) are emitted per-page
 * - This prevents duplicate JSON-LD across the site
 */

import { FAQ, buildFAQPageSchema } from './faqs';
import {
  BRAND_NAME,
  BRAND_URL,
  BRAND_LOGO_URL,
  BRAND_DESCRIPTION,
  BRAND_SAME_AS,
  BRAND_LOGO_WIDTH,
  BRAND_LOGO_HEIGHT,
} from './brand';

// Re-export brand constants for convenience
export { BRAND_URL, BRAND_NAME };

// ============================================
// TYPES
// ============================================

// Re-export FAQ type for convenience
export type { FAQ };
export type FAQItem = FAQ; // Backward compatibility alias

export interface ArticleMetadata {
  headline: string;
  description?: string;
  canonicalPath: string;
  datePublished?: string;
  dateModified?: string;
}

export interface SoftwareApplicationMetadata {
  name: string;
  description: string;
  canonicalPath: string;
}

// ============================================
// GLOBAL SCHEMAS (inject ONCE at Layout level)
// ============================================

/**
 * Organization schema - identifies TheDealCalc as a legal entity
 * Should be injected ONCE at Layout level, NOT on individual pages
 */
export function buildOrganizationSchema() {
  const schema: Record<string, unknown> = {
    "@type": "Organization",
    "@id": `${BRAND_URL}/#organization`,
    "name": BRAND_NAME,
    "url": BRAND_URL,
  };

  // Only include logo if we have a valid URL
  if (BRAND_LOGO_URL) {
    schema.logo = {
      "@type": "ImageObject",
      "url": BRAND_LOGO_URL,
      "width": BRAND_LOGO_WIDTH,
      "height": BRAND_LOGO_HEIGHT,
    };
  }

  // Only include description if provided
  if (BRAND_DESCRIPTION) {
    schema.description = BRAND_DESCRIPTION;
  }

  // Only include sameAs if there are actual social profiles
  if (BRAND_SAME_AS && BRAND_SAME_AS.length > 0) {
    schema.sameAs = BRAND_SAME_AS;
  }

  return schema;
}

/**
 * WebSite schema with SearchAction for blog search
 * Should be injected ONCE at Layout level, NOT on individual pages
 * 
 * Note: SearchAction points to /blog?search= since that's the only
 * site-wide search feature available (verified in codebase)
 */
export function buildWebSiteSchema() {
  return {
    "@type": "WebSite",
    "@id": `${BRAND_URL}/#website`,
    "url": BRAND_URL,
    "name": BRAND_NAME,
    "description": BRAND_DESCRIPTION,
    "publisher": {
      "@id": `${BRAND_URL}/#organization`
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${BRAND_URL}/blog?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

/**
 * Build the global JSON-LD graph for Organization + WebSite
 * This should be rendered ONCE in the Layout component
 */
export function buildGlobalSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganizationSchema(),
      buildWebSiteSchema(),
    ]
  };
}

// ============================================
// PAGE-LEVEL SCHEMAS
// ============================================

/**
 * SoftwareApplication schema for calculator pages
 * Classifies the page as a free financial tool
 */
export function buildSoftwareApplicationSchema(metadata: SoftwareApplicationMetadata) {
  const canonicalUrl = `${BRAND_URL}${metadata.canonicalPath}`;
  
  return {
    "@type": "SoftwareApplication",
    "name": metadata.name,
    "description": metadata.description,
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web",
    "url": canonicalUrl,
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "provider": {
      "@id": `${BRAND_URL}/#organization`
    }
  };
}

/**
 * FAQPage schema for pages with FAQ sections
 * Only generate if FAQs actually exist on the page
 * 
 * @deprecated Use buildFAQPageSchema from './faqs' instead
 */
export function buildFAQSchema(faqItems: FAQ[]) {
  return buildFAQPageSchema(faqItems);
}

/**
 * Article schema for educational content pages
 * Used for calculator landing pages with substantial content
 */
export function buildArticleSchema(metadata: ArticleMetadata) {
  const canonicalUrl = `${BRAND_URL}${metadata.canonicalPath}`;
  
  const schema: Record<string, unknown> = {
    "@type": "Article",
    "headline": metadata.headline,
    "url": canonicalUrl,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    },
    "author": {
      "@id": `${BRAND_URL}/#organization`
    },
    "publisher": {
      "@id": `${BRAND_URL}/#organization`
    }
  };

  if (metadata.description) {
    schema.description = metadata.description;
  }

  if (metadata.datePublished) {
    schema.datePublished = metadata.datePublished;
  }

  if (metadata.dateModified) {
    schema.dateModified = metadata.dateModified;
  }

  return schema;
}

/**
 * WebPage schema for generic pages
 */
export function buildWebPageSchema(name: string, canonicalPath: string, description?: string) {
  const canonicalUrl = `${BRAND_URL}${canonicalPath}`;
  
  return {
    "@type": "WebPage",
    "@id": canonicalUrl,
    "url": canonicalUrl,
    "name": name,
    "description": description,
    "isPartOf": {
      "@id": `${BRAND_URL}/#website`
    }
  };
}

// ============================================
// COMBINED GRAPH BUILDERS
// ============================================

/**
 * Build complete JSON-LD graph for homepage
 * Includes: Organization, WebSite, WebPage, BreadcrumbList
 */
export function buildHomePageSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganizationSchema(),
      buildWebSiteSchema(),
      buildWebPageSchema(
        "TheDealCalc - Real Estate Investment Calculators",
        "/",
        BRAND_DESCRIPTION
      ),
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": `${BRAND_URL}/`
          }
        ]
      }
    ]
  };
}

/**
 * Build complete JSON-LD graph for calculator pages
 * Includes: Organization, WebSite, SoftwareApplication, Article, FAQPage (if FAQs exist), BreadcrumbList
 */
export function buildCalculatorPageSchema(
  metadata: SoftwareApplicationMetadata,
  breadcrumbItems: Array<{ name: string; path: string }>,
  faqItems?: FAQItem[]
) {
  const graph: object[] = [
    buildSoftwareApplicationSchema(metadata),
    buildArticleSchema({
      headline: metadata.name,
      description: metadata.description,
      canonicalPath: metadata.canonicalPath
    }),
    {
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbItems.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": `${BRAND_URL}${item.path}`
      }))
    }
  ];

  const faqSchema = buildFAQSchema(faqItems || []);
  if (faqSchema) {
    graph.push(faqSchema);
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph
  };
}

/**
 * Build complete JSON-LD graph for generic content pages
 * Includes: Organization, WebSite, WebPage, BreadcrumbList
 */
export function buildContentPageSchema(
  pageName: string,
  canonicalPath: string,
  description: string,
  breadcrumbItems: Array<{ name: string; path: string }>
) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildWebPageSchema(pageName, canonicalPath, description),
      {
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbItems.map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": item.name,
          "item": `${BRAND_URL}${item.path}`
        }))
      }
    ]
  };
}
