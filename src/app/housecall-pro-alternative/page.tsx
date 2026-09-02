import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav, MarketingFooter } from "@/components/MarketingChrome";

export const metadata: Metadata = {
  title: "Housecall Pro alternative for roofers | LeadFlow",
  description:
    "LeadFlow is a CRM built for roofing and exterior contractors who sell in the home — estimates with photos, cash vs finance, sign on the phone. A Housecall Pro alternative from JMB Business Solutions.",
};

export default function HousecallAlternativePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <MarketingNav />
      <article className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange-400">For roofers & exterior crews</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight">A Housecall Pro alternative built around the close — not the calendar</h1>
        <p className="mt-4 text-lg text-slate-300">
          Housecall Pro is fine if the job is dispatch and invoicing. If you sell roofs in the kitchen, you need the estimate to happen
          before you leave the driveway. LeadFlow is that tool.
        </p>
        <p className="mt-3 text-slate-400">
          Built in Albany by JMB Business Solutions while consulting for a roofing company. JMB owns and sells LeadFlow. The contractor runs jobs — they don&apos;t sell the software.
        </p>

        <h2 className="mt-12 text-2xl font-bold">What&apos;s different</h2>
        <ul className="mt-4 space-y-3 text-slate-300">
          <li><span className="font-semibold text-white">Pricebook on the phone.</span> Pick the work. Description and price fill in. No typing a novel on the hood of the truck.</li>
          <li><span className="font-semibold text-white">Photos on the estimate.</span> Hail, soft deck, missing shingles — the homeowner sees it without climbing.</li>
          <li><span className="font-semibold text-white">Cash vs finance on the same quote.</span> List price and cash price, plus what they save with 50/50. The fork is the close.</li>
          <li><span className="font-semibold text-white">Sign at the table.</span> Or email the link if the spouse isn&apos;t home. Same estimate.</li>
        </ul>

        <h2 className="mt-12 text-2xl font-bold">Who it&apos;s for</h2>
        <p className="mt-3 text-slate-300">
          Roofing, siding, windows, exterior remodel — shops that still run in-home appointments. If your “CRM” is a calendar plus a PDF, you already know the leak.
        </p>

        <h2 className="mt-12 text-2xl font-bold">Switching doesn&apos;t have to be a six-month project</h2>
        <p className="mt-3 text-slate-300">
          We load your pricebook, migrate leads, set up the team. You log in to a finished account. Month-to-month — less than one missed roof job for most shops.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/contact" className="rounded-lg bg-orange-500 px-6 py-3 font-semibold hover:bg-orange-600">
            Bring a real job — we&apos;ll quote it live
          </Link>
          <Link href="/pricing" className="rounded-lg border border-slate-700 px-6 py-3 font-semibold text-slate-200 hover:bg-slate-800">
            See pricing
          </Link>
        </div>
      </article>
      <MarketingFooter />
    </div>
  );
}
