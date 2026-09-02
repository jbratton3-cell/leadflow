import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav, MarketingFooter } from "@/components/MarketingChrome";

export const metadata: Metadata = {
  title: "Cash vs finance on a roofing quote | LeadFlow",
  description:
    "Show list/financed price and cash price (50/50) on the same estimate — including what they save. LeadFlow by JMB Business Solutions.",
};

export default function CashVsFinancePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <MarketingNav />
      <article className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange-400">How you get paid</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight">Show both numbers. The savings is the close.</h1>
        <p className="mt-4 text-lg text-slate-300">
          A lot of shops bake financing fees into the price, then only show one total. Homeowners can&apos;t choose what they can&apos;t see.
        </p>
        <p className="mt-3 text-slate-300">
          LeadFlow puts <strong className="text-white">list / financed</strong> and <strong className="text-white">cash</strong> on every estimate — with the dollars they save if they put 50% down and 50% at completion.
        </p>

        <h2 className="mt-12 text-2xl font-bold">How reps use it</h2>
        <ul className="mt-4 space-y-3 text-slate-300">
          <li>Pricebook builds the financed (list) total — the honest contract if they finance.</li>
          <li>Rep types the cash price in dollars (or you set a company %). Cash can&apos;t go above list.</li>
          <li>Customer sees both, plus “save $X by putting 50% down.” They pick on the same page. Sign on the phone.</li>
          <li>Sale, job, and deposit follow the number they actually chose.</li>
        </ul>

        <h2 className="mt-12 text-2xl font-bold">Not a gimmick — it&apos;s how the table works</h2>
        <p className="mt-3 text-slate-300">
          Software doesn&apos;t one-call close. The rep does. Hiding the cash break is how you accidentally train them to email a PDF and hope.
        </p>
        <p className="mt-3 text-slate-400">
          LeadFlow is built by JMB Business Solutions in Albany.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/contact" className="rounded-lg bg-orange-500 px-6 py-3 font-semibold hover:bg-orange-600">
            Bring a real job — we&apos;ll quote it live
          </Link>
          <Link href="/roofing-estimate-photos" className="rounded-lg border border-slate-700 px-6 py-3 font-semibold text-slate-200 hover:bg-slate-800">
            Photos on the estimate
          </Link>
        </div>
      </article>
      <MarketingFooter />
    </div>
  );
}
