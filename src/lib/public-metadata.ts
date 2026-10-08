import type { Metadata } from "next";

const SITE_ORIGIN = "https://www.leadflowcrm.info";
const SOCIAL_IMAGE = `${SITE_ORIGIN}/leadflow-social-card.png`;

export function createPublicMetadata({
  title,
  description,
  path,
  type = "website",
}: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
}): Metadata {
  const url = new URL(path, `${SITE_ORIGIN}/`).toString();

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "LeadFlow",
      type,
      images: [
        {
          url: SOCIAL_IMAGE,
          width: 1200,
          height: 630,
          alt: "LeadFlow workflow CRM for home improvement companies",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SOCIAL_IMAGE],
    },
  };
}
