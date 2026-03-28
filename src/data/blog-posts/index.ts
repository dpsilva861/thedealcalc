export interface BlogPost {
  slug: string;
  title: string;
  metaDescription: string;
  category: "LOI Basics" | "Negotiation Strategy" | "AI & Technology" | "Property Types";
  publishedDate: string;
  content: string;
  faqs: { question: string; answer: string }[];
  relatedSlugs: string[];
}

import { post as whatIsLoiRedlining } from "./what-is-loi-redlining";
import { post as loiChecklistProvisions } from "./loi-checklist-provisions";
import { post as aiCommercialLeaseNegotiation } from "./ai-commercial-lease-negotiation";
import { post as loiVsLeaseDifferences } from "./loi-vs-lease-differences";
import { post as loiMistakesLandlords } from "./loi-mistakes-landlords";
import { post as securityDepositNegotiation } from "./security-deposit-negotiation";
import { post as camClausesLoi } from "./cam-clauses-loi";
import { post as restaurantLoiRedlining } from "./restaurant-loi-redlining";
import { post as nationalCreditVsLocalTenant } from "./national-credit-vs-local-tenant";
import { post as manualVsAiLoiReview } from "./manual-vs-ai-loi-review";

export const blogPosts: BlogPost[] = [
  whatIsLoiRedlining,
  loiChecklistProvisions,
  aiCommercialLeaseNegotiation,
  loiVsLeaseDifferences,
  loiMistakesLandlords,
  securityDepositNegotiation,
  camClausesLoi,
  restaurantLoiRedlining,
  nationalCreditVsLocalTenant,
  manualVsAiLoiReview,
];
