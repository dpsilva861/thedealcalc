/**
 * Schema.org JSON-LD Builders
 * 
 * Utility functions for generating structured data schemas
 * compliant with Google Rich Results requirements.
 */

import { FAQ, buildFAQPageSchema } from './faqs';

const BASE_URL = "https://thedealcalc.com";
const SITE_NAME = "TheDealCalc";
const LOGO_URL = `${BASE_URL}/og-image.png`;

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
// GLOBAL SCHEMAS (inject once site-wide)
// ============================================

/**
 * Organization schema - identifies TheDealCalc as a legal entity
 * Should be injected once at app root level
 */
export function buildOrganizationSchema() {
  return {
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    "name": SITE_NAME,
    "url": BASE_URL,
    "logo": {
      "@type": "ImageObject",
      "url": LOGO_URL,
      "width": 1200,
      "height": 630
    },
    "sameAs": []
  };
}

/**
 * WebSite schema with SearchAction for sitelinks search box
 * Should be injected once at app root level
 */
export function buildWebSiteSchema() {
  return {
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    "url": BASE_URL,
    "name": SITE_NAME,
    "description": "Free real estate investment calculators for analyzing rental properties, BRRRR deals, syndications, and NPV.",
    "publisher": {
      "@id": `${BASE_URL}/#organization`
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${BASE_URL}/blog?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
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
  const canonicalUrl = `${BASE_URL}${metadata.canonicalPath}`;
  
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
      "@id": `${BASE_URL}/#organization`
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
  const canonicalUrl = `${BASE_URL}${metadata.canonicalPath}`;
  
  const schema: Record<string, unknown> = {
    "@type": "Article",
    "headline": metadata.headline,
    "url": canonicalUrl,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    },
    "author": {
      "@id": `${BASE_URL}/#organization`
    },
    "publisher": {
      "@id": `${BASE_URL}/#organization`
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
  const canonicalUrl = `${BASE_URL}${canonicalPath}`;
  
  return {
    "@type": "WebPage",
    "@id": canonicalUrl,
    "url": canonicalUrl,
    "name": name,
    "description": description,
    "isPartOf": {
      "@id": `${BASE_URL}/#website`
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
        "Free real estate investment calculators for analyzing rental properties, BRRRR deals, syndications, and NPV."
      ),
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": `${BASE_URL}/`
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
    buildOrganizationSchema(),
    buildWebSiteSchema(),
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
        "item": `${BASE_URL}${item.path}`
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
      buildOrganizationSchema(),
      buildWebSiteSchema(),
      buildWebPageSchema(pageName, canonicalPath, description),
      {
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbItems.map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": item.name,
          "item": `${BASE_URL}${item.path}`
        }))
      }
    ]
  };
}
