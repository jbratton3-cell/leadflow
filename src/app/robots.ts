import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/account",
        "/appointments",
        "/board",
        "/call-center",
        "/dashboard",
        "/estimate/",
        "/estimates",
        "/expenses",
        "/import",
        "/invite/",
        "/invoice/",
        "/invoices",
        "/leads",
        "/login",
        "/materials",
        "/metrics",
        "/production",
        "/receipts",
        "/reports",
        "/reset-password/",
        "/sales",
        "/settings",
        "/signup",
      ],
    },
    sitemap: "https://www.leadflowcrm.info/sitemap.xml",
    host: "https://www.leadflowcrm.info",
  };
}
