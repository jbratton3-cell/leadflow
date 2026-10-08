import { createPublicMetadata } from "@/lib/public-metadata";
import Link from "next/link";
import { MarketingNav, MarketingFooter } from "@/components/MarketingChrome";

export const metadata = createPublicMetadata({
  title: "Cash vs. Finance on a Roofing Quote | LeadFlow",
  description: "Show cash and financed pricing choices on one roofing estimate and carry the customer’s selection into the signed sale and job record.",
  path: "/cash-vs-finance-roofing-quote",
  type: "website",
});

export default function CashVsFinancePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <MarketingNav />
      <article className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange-400">How you get paid</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight">Show both options. Carry one choice through the job.</h1>
        <p className="mt-4 text-lg text-slate-300">
          A lot of shops bake financing fees into the price, then only show one total. Homeowners can&apos;t choose what they can&apos;t see.
        </p>
        <p className="mt-3 text-slate-300">
          LeadFlow can be configured to present a <strong className="text-white">standard card or financing price</strong> alongside a <strong className="text-white">cash or check price</strong>. The choices, discounts, and payment milestones follow the company&apos;s approved workflow instead of forcing every contractor into one payment structure.
        </p>

        <h2 className="mt-12 text-2xl font-bold">How it reduces duplicate work</h2>
        <ul className="mt-4 space-y-3 text-slate-300">
          <li>The pricebook builds the standard total consistently from approved products and services.</li>
          <li>The company can configure its cash or check option, permitted discount, and required payment milestones.</li>
          <li>The customer reviews the available choices and selects one before signing the estimate.</li>
          <li>The selected contract amount and payment structure carry into the sale, invoices, job, and production record.</li>
        </ul>

        <h2 className="mt-12 text-2xl font-bold">One decision, one connected record</h2>
        <p className="mt-3 text-slate-300">
          Once the customer chooses and signs, LeadFlow carries the selected amount and configured payment milestones into the sale, invoices, job, and production workflow. The owner and rep do not have to re-enter or reconcile the decision later.
        </p>
        <p className="mt-3 text-slate-400">
          LeadFlow is built by JMB Business Solutions in Albany.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/contact" className="rounded-lg bg-orange-500 px-6 py-3 font-semibold hover:bg-orange-600">
            Book a personalized demo
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
