import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav, MarketingFooter } from "@/components/MarketingChrome";

export const metadata: Metadata = {
  title: "Roofing estimates with photos | LeadFlow",
  description:
    "Put damage photos on the estimate so homeowners don't climb the roof. Built for insurance and hail jobs. LeadFlow by JMB Business Solutions.",
};

export default function EstimatePhotosPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <MarketingNav />
      <article className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange-400">Estimates</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight">If they have to get on the roof to believe you, you already lost</h1>
        <p className="mt-4 text-lg text-slate-300">
          Insurance jobs, hail, “I didn&apos;t know it was that bad.” A number without a picture is a debate. A picture on the quote is the close.
        </p>

        <h2 className="mt-12 text-2xl font-bold">How LeadFlow does it</h2>
        <p className="mt-3 text-slate-300">
          The rep shoots the damage on their phone — on the roof, from the ladder, in the attic. Optional caption (“north slope, hail”). It sits on that estimate, not in a random camera roll.
        </p>
        <p className="mt-3 text-slate-300">
          The homeowner sees it on the same page as the work and the price. The signed PDF keeps the photos. Nobody&apos;s climbing at 7 p.m. to “just look.”
        </p>

        <h2 className="mt-12 text-2xl font-bold">Built for how roofers actually sell</h2>
        <p className="mt-3 text-slate-300">
          LeadFlow is a contractor CRM from JMB Business Solutions — estimates, pricebook, cash vs finance, production. Photos aren&apos;t a file cabinet. They&apos;re part of the quote you present at the table.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/contact" className="rounded-lg bg-orange-500 px-6 py-3 font-semibold hover:bg-orange-600">
            Bring a real job — we&apos;ll quote it live
          </Link>
          <Link href="/cash-vs-finance-roofing-quote" className="rounded-lg border border-slate-700 px-6 py-3 font-semibold text-slate-200 hover:bg-slate-800">
            Cash vs finance on the same quote
          </Link>
        </div>
      </article>
      <MarketingFooter />
    </div>
  );
}
