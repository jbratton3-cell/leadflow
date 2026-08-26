import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "LeadFlow — Home Improvement Sales & Production CRM",
  description:
    "Full-lifecycle CRM for home improvement companies: leads, call center, appointments, sales, production, and marketing ROI.",
  manifest: "/manifest.webmanifest",
  applicationName: "LeadFlow",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "LeadFlow",
  },
  icons: {
    icon: "/icons/192",
    apple: "/icons/192",
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const hdrs = await headers();
  const pathname = hdrs.get("x-pathname") ?? "";
  const isPublic =
    pathname === "/" ||
    pathname === "/pricing" ||
    pathname.startsWith("/pricing/") ||
    pathname === "/contact" ||
    pathname.startsWith("/contact/") ||
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/signup" ||
    pathname.startsWith("/signup/") ||
    pathname === "/invite" ||
    pathname.startsWith("/invite/") ||
    pathname === "/estimate" ||
    pathname.startsWith("/estimate/");

  // Public marketing/auth routes render bare (no sidebar, no auth gate).
  if (isPublic) {
    return (
      <html lang="en">
        <body className="bg-slate-950 text-slate-900 antialiased">{children}</body>
      </html>
    );
  }

  // Every other route requires a valid session.
  const user = await getSessionUser();
  if (!user) redirect("/login");

  // The TV job board renders full-screen (no sidebar) for casting to a display.
  const isBoard = pathname === "/board" || pathname.startsWith("/board/");
  if (isBoard) {
    return (
      <html lang="en">
        <body className="bg-slate-950 text-slate-900 antialiased">{children}</body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <ServiceWorkerRegister />
        <Sidebar userName={user.name} userRole={user.role} />
        <div className="min-h-screen pt-16 md:ml-60 md:pt-0">
          <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
