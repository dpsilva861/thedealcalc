type SchemaType =
  | "SoftwareApplication"
  | "FAQPage"
  | "HowTo"
  | "Article"
  | "WebPage";

interface FAQItem {
  question: string;
  answer: string;
}

interface HowToStep {
  name: string;
  text: string;
}

interface SchemaMarkupProps {
  type: SchemaType;
  data?: {
    // SoftwareApplication
    name?: string;
    description?: string;
    price?: string;
    priceCurrency?: string;
    operatingSystem?: string;
    applicationCategory?: string;
    url?: string;
    // FAQPage
    faqs?: FAQItem[];
    // HowTo
    howToName?: string;
    howToDescription?: string;
    steps?: HowToStep[];
    // Article
    headline?: string;
    datePublished?: string;
    dateModified?: string;
    author?: string;
    image?: string;
    // WebPage
    pageTitle?: string;
    pageDescription?: string;
  };
}

function buildSchema(type: SchemaType, data: SchemaMarkupProps["data"] = {}) {
  switch (type) {
    case "SoftwareApplication":
      return {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: data.name || "CREagentic",
        description:
          data.description ||
          "AI-powered LOI redlining for commercial real estate. Upload any LOI and get institutional-grade redlines in 60 seconds.",
        url: data.url || "https://creagentic.ai",
        applicationCategory: data.applicationCategory || "BusinessApplication",
        operatingSystem: data.operatingSystem || "Web",
        offers: {
          "@type": "Offer",
          price: data.price || "2.00",
          priceCurrency: data.priceCurrency || "USD",
        },
      };

    case "FAQPage":
      return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: (data.faqs || []).map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      };

    case "HowTo":
      return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: data.howToName || "How to Redline a CRE LOI with CREagentic",
        description:
          data.howToDescription ||
          "Upload your LOI, let AI analyze every provision, and download professional redlines.",
        step: (data.steps || []).map((step, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: step.name,
          text: step.text,
        })),
      };

    case "Article":
      return {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: data.headline,
        datePublished: data.datePublished,
        dateModified: data.dateModified || data.datePublished,
        author: {
          "@type": "Organization",
          name: data.author || "CREagentic",
        },
        image: data.image,
        publisher: {
          "@type": "Organization",
          name: "CREagentic",
        },
      };

    case "WebPage":
      return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: data.pageTitle,
        description: data.pageDescription,
        publisher: {
          "@type": "Organization",
          name: "CREagentic",
        },
      };
  }
}

export function SchemaMarkup({ type, data }: SchemaMarkupProps) {
  const schema = buildSchema(type, data);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
