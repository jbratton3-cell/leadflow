import { createPublicMetadata } from "@/lib/public-metadata";
import Link from "next/link";
import { MarketingFooter, MarketingNav } from "@/components/MarketingChrome";
import { APP_NAME, BUSINESS_NAME } from "@/lib/constants";

export const metadata = createPublicMetadata({
  title: "About LeadFlow and Founder Jon Bratton",
  description: "Learn why Jon Bratton and JMB Business Solutions built LeadFlow as a connected workflow CRM for home improvement companies.",
  path: "/about",
  type: "website",
});

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "LeadFlow",
      url: "https://www.leadflowcrm.info",
      founder: { "@type": "Person", name: "Jon Bratton" },
      parentOrganization: {
        "@type": "Organization",
        name: "JMB Business Solutions",
        url: "https://www.jmbcreative.org",
      },
    },
    {
      "@type": "Person",
      name: "Jon Bratton",
      jobTitle: "Founder of LeadFlow and owner of JMB Business Solutions",
      url: "https://www.leadflowcrm.info/about",
    },
  ],
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <MarketingNav />
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1fr_.8fr] lg:py-24">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-400">About {APP_NAME}</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-6xl">
              Built from the work between the sale and the installation.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-300">
              {APP_NAME} was founded by Jon Bratton and developed by {BUSINESS_NAME} after hands-on work exposed a recurring problem: home improvement companies were asking people to move the same job through disconnected systems, spreadsheets, inboxes, and paper.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/case-studies/from-operational-friction-to-leadflow" className="rounded-xl bg-orange-500 px-6 py-3 font-bold text-white hover:bg-orange-600">
                Read the founder case study
              </Link>
              <Link href="/contact" className="rounded-xl border border-slate-700 px-6 py-3 font-bold text-slate-200 hover:bg-slate-900">
                Book a personalized demo
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-orange-500/30 bg-gradient-to-br from-orange-500/15 via-slate-900 to-slate-900 p-7 sm:p-9">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-orange-500 text-2xl font-black">JB</div>
            <h2 className="mt-5 text-2xl font-bold">Jon Bratton</h2>
            <p className="mt-1 text-sm font-semibold text-orange-300">Founder, LeadFlow · Owner, JMB Business Solutions</p>
            <p className="mt-4 leading-relaxed text-slate-300">
              Jon’s role is not limited to selling software. He works directly with businesses to understand their stages, responsibilities, documents, payment milestones, and operational handoffs—then configures LeadFlow around the workflow people actually use.
            </p>
          </div>
        </section>

        <section className="border-y border-slate-800 bg-slate-900/45 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-400">Why it exists</p>
              <h2 className="mt-2 text-3xl font-bold">A connected system instead of another isolated tool</h2>
              <p className="mt-4 leading-relaxed text-slate-400">
                LeadFlow followed months of planning, building, testing, and correcting real operational edge cases. The goal was not to add one more login. The goal was to keep the same customer and job connected from first inquiry through final payment and profitability.
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                {
                  title: "Workflow before feature count",
                  body: "A feature matters only when it supports the people, approvals, and next actions that move a real job forward.",
                },
                {
                  title: "Configuration before compromise",
                  body: "LeadFlow is implemented around each company’s process rather than forcing every company into one rigid sequence.",
                },
                {
                  title: "Ownership without abandonment",
                  body: "Customers own their business data. JMB handles migration, setup, and training so the team does not receive an empty system and a manual.",
                },
              ].map((item) => (
                <article key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-16">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-400">What LeadFlow connects</p>
              <h2 className="mt-2 text-3xl font-bold">The job is the center of the system</h2>
              <p className="mt-4 leading-relaxed text-slate-300">
                Prospects, appointments, estimates, signatures, invoices, payments, service locations, material orders, production stages, receipts, and reporting stay connected to the work they describe.
              </p>
            </div>
            <div className="space-y-3">
              {["First call → scheduled opportunity", "Estimate → accepted contract", "Sale → production handoff", "Receipt → site-specific expense", "Completed work → final balance and reporting"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200">
                  <span className="text-orange-400">→</span>{item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-slate-800 py-16 text-center">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-3xl font-bold">See the workflow before scheduling a call.</h2>
            <p className="mt-3 text-slate-400">The public tour uses safe sample data and requires no account.</p>
            <Link href="/tour" className="mt-7 inline-flex rounded-xl bg-orange-500 px-7 py-3 font-bold text-white hover:bg-orange-600">
              Explore the interactive tour
            </Link>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
