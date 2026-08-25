import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LeadFlow CRM",
    short_name: "LeadFlow",
    description:
      "Full-lifecycle CRM for home improvement companies: leads, call center, appointments, sales, production, and marketing ROI.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#f97316",
    orientation: "portrait-primary",
        icons: [
      {
        src: "/icons/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/512?maskable=1",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
