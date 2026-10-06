import type { Metadata } from "next";
import Link from "next/link";
import { MarketingFooter, MarketingNav } from "@/components/MarketingChrome";
import { FoundingOfferCard } from "@/components/FoundingOffer";
import { APP_NAME } from "@/lib/constants";
import { PUBLIC_TOUR_STEPS } from "@/lib/public-tour";

export const metadata: Metadata = {
  title: "Interactive LeadFlow Product Tour — No Login Required",
  description:
    "Take a public, interactive tour of LeadFlow lead management, estimates, signatures, invoicing, production, material ordering, job costing, and reports.",
  alternates: { canonical: "https://www.leadflowcrm.info/tour" },
  openGraph: {
    title: "See LeadFlow in Action — Public Product Tour",
    description:
      "Explore the connected workflow from first inquiry through estimate, payment, production, and job profitability. No login required.",
    url: "https://www.leadflowcrm.info/tour",
    type: "website",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "LeadFlow",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "Workflow CRM for home improvement companies connecting leads, estimates, signatures, payments, materials, production, and job profitability.",
      url: "https://www.leadflowcrm.info",
      offers: {
        "@type": "AggregateOffer",
        lowPrice: "149",
        highPrice: "749",
        priceCurrency: "USD",
        offerCount: "3",
      },
    },
    {
      "@type": "ItemList",
      name: "LeadFlow public product tour",
      itemListElement: PUBLIC_TOUR_STEPS.map((step, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: step.shortTitle,
        url: `https://www.leadflowcrm.info/tour/${step.slug}`,
      })),
    },
  ],
};

export default function TourPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <MarketingNav cta="Book a personalized demo" />

      <main>
        <section className="mx-auto max-w-5xl px-6 pb-14 pt-14 text-center sm:pt-20">
          <div className="inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-orange-300">
            Public interactive product tour
          </div>
          <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-bold leading-tight sm:text-6xl">
            See how {APP_NAME} carries a job
            <span className="text-orange-500"> from first call to final profit.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-slate-300">
            Explore the features with safe sample data. No account, login, credit card, or customer information is required.
            Click through the workflow, then book a personalized demo when you want to see it configured for your company.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={`/tour/${PUBLIC_TOUR_STEPS[0].slug}`}
              className="rounded-xl bg-orange-500 px-7 py-3 text-base font-bold text-white shadow-lg shadow-orange-950/30 hover:bg-orange-600"
            >
              Start the public tour →
            </Link>
            <Link
              href="/contact"
              className="rounded-xl border border-slate-700 px-7 py-3 text-base font-bold text-slate-200 hover:bg-slate-900"
            >
              Book a personalized demo
            </Link>
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-500">
            LeadFlow does everything but the installation.
          </p>
        </section>

        <section className="border-y border-slate-800 bg-slate-900/45 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-400">Five connected stops</p>
              <h2 className="mt-2 text-3xl font-bold">Choose a feature or follow the complete workflow</h2>
              <p className="mt-3 text-slate-400">
                Each tour page explains what the feature does, why it matters, and how it connects to the next stage of the job.
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {PUBLIC_TOUR_STEPS.map((step, index) => (
                <Link
                  key={step.slug}
                  href={`/tour/${step.slug}`}
                  className="group rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:-translate-y-0.5 hover:border-orange-500/60 hover:bg-slate-900/80"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{step.icon}</span>
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-800 text-xs font-bold text-slate-400 group-hover:bg-orange-500 group-hover:text-white">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-white">{step.shortTitle}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.description}</p>
                  <span className="mt-5 inline-flex text-sm font-bold text-orange-400">Open interactive tour →</span>
                </Link>
              ))}
              <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/15 to-slate-900 p-6">
                <span className="text-3xl">🧭</span>
                <h3 className="mt-4 text-xl font-bold">Your workflow is the destination</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  These examples show the connected foundation. Your implementation follows your stages, approvals, responsibilities, and payment milestones.
                </p>
                <Link href="/contact" className="mt-5 inline-flex text-sm font-bold text-orange-300 hover:text-orange-200">
                  Talk through your process →
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-16">
          <div className="grid gap-8 rounded-3xl border border-slate-800 bg-slate-900 p-7 sm:p-10 lg:grid-cols-[1fr_.9fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-400">What is LeadFlow?</p>
              <h2 className="mt-2 text-3xl font-bold">A connected workflow CRM for home improvement companies</h2>
              <p className="mt-4 leading-relaxed text-slate-300">
                LeadFlow connects customer acquisition, sales, documents, money, materials, production, and reporting around the same job record.
                It reduces duplicate entry and makes the next responsibility visible to the office, sales team, and production staff.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {["No real customer data", "No login required", "Interactive sample controls", "Built for search and human buyers"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl bg-slate-950/70 px-4 py-3 text-sm font-semibold text-slate-200">
                  <span className="text-emerald-400">✓</span>{item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-16">
          <FoundingOfferCard />
        </section>

        <section className="border-t border-slate-800 py-16 text-center">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-3xl font-bold">Want to see your workflow inside LeadFlow?</h2>
            <p className="mt-3 text-slate-400">
              Book a personalized walkthrough, or create a trial workspace after you finish the public tour.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/contact" className="rounded-xl bg-orange-500 px-7 py-3 font-bold text-white hover:bg-orange-600">
                Book a personalized demo
              </Link>
              <Link href="/signup" className="rounded-xl border border-slate-700 px-7 py-3 font-bold text-slate-200 hover:bg-slate-900">
                Start a trial workspace
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
