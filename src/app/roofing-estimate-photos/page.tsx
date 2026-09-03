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
        <h1 className="mt-3 text-4xl font-bold leading-tight">Keep every job photo with the work it documents</h1>
        <p className="mt-4 text-lg text-slate-300">
          Damage photos make the estimate clearer for the homeowner and keep the office, sales rep, and production team working from the same record.
        </p>

        <h2 className="mt-12 text-2xl font-bold">How LeadFlow does it</h2>
        <p className="mt-3 text-slate-300">
          The rep shoots the damage on their phone — on the roof, from the ladder, in the attic. Optional caption (“north slope, hail”). It sits on that estimate, not in a random camera roll.
        </p>
        <p className="mt-3 text-slate-300">
          The homeowner sees it on the same page as the work and the price. The signed PDF keeps the photos. Nobody&apos;s climbing at 7 p.m. to “just look.”
        </p>

        <h2 className="mt-12 text-2xl font-bold">Built for how roofing teams actually work</h2>
        <p className="mt-3 text-slate-300">
          LeadFlow connects estimates, pricebook items, payment options, signatures, and production. Photos stay attached to the job instead of disappearing into a camera roll, text thread, or separate folder.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/contact" className="rounded-lg bg-orange-500 px-6 py-3 font-semibold hover:bg-orange-600">
            Book a personalized demo
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
