import { MetadataRoute } from "next";
import { states, TOP_STATES } from "@/data/states";
import { propertyTypes } from "@/data/property-types";
import { dealTypes } from "@/data/deal-types";
import { competitors } from "@/data/competitors";

const BASE_URL = "https://redlineiq.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  const entries: MetadataRoute.Sitemap = [];

  // Core pages
  entries.push({ url: `${BASE_URL}`, lastModified: now, changeFrequency: "weekly", priority: 1.0 });
  entries.push({ url: `${BASE_URL}/redline`, lastModified: now, changeFrequency: "monthly", priority: 0.9 });
  entries.push({ url: `${BASE_URL}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 });
  entries.push({ url: `${BASE_URL}/glossary`, lastModified: now, changeFrequency: "monthly", priority: 0.7 });
  entries.push({ url: `${BASE_URL}/dashboard`, lastModified: now, changeFrequency: "weekly", priority: 0.3 });

  // State pages
  for (const s of states) {
    entries.push({ url: `${BASE_URL}/loi-redline/${s.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.7 });
  }

  // Property type pages
  for (const p of propertyTypes) {
    entries.push({ url: `${BASE_URL}/loi-redline/${p.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.7 });
  }

  // Deal type pages
  for (const d of dealTypes) {
    entries.push({ url: `${BASE_URL}/loi-redline/${d.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.7 });
  }

  // Cross pages (top states x property types)
  for (const stateSlug of TOP_STATES) {
    for (const p of propertyTypes) {
      entries.push({ url: `${BASE_URL}/loi-redline/${p.slug}-${stateSlug}`, lastModified: now, changeFrequency: "monthly", priority: 0.6 });
    }
  }

  // Comparison pages
  for (const c of competitors) {
    entries.push({ url: `${BASE_URL}/compare/${c.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.6 });
  }

  return entries;
}
