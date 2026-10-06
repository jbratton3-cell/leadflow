import type { MetadataRoute } from "next";
import { PUBLIC_TOUR_STEPS } from "@/lib/public-tour";

const BASE_URL = "https://www.leadflowcrm.info";
const LAST_MODIFIED = new Date("2026-10-05T00:00:00-04:00");

export default function sitemap(): MetadataRoute.Sitemap {
  const core: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: LAST_MODIFIED, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/tour`, lastModified: LAST_MODIFIED, changeFrequency: "weekly", priority: 0.95 },
    { url: `${BASE_URL}/pricing`, lastModified: LAST_MODIFIED, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/contact`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/roofing-estimate-photos`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/cash-vs-finance-roofing-quote`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/housecall-pro-alternative`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.7 },
  ];

  const tourPages: MetadataRoute.Sitemap = PUBLIC_TOUR_STEPS.map((step) => ({
    url: `${BASE_URL}/tour/${step.slug}`,
    lastModified: LAST_MODIFIED,
    changeFrequency: "monthly",
    priority: 0.85,
  }));

  return [...core, ...tourPages];
}
