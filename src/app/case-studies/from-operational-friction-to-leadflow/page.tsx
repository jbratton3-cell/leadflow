import { createPublicMetadata } from "@/lib/public-metadata";
import Link from "next/link";
import { MarketingFooter, MarketingNav } from "@/components/MarketingChrome";

export const metadata = createPublicMetadata({
  title: "From Operational Friction to LeadFlow — Founder Case Study",
  description: "How founder Jon Bratton turned real home improvement workflow problems into a connected CRM spanning leads, estimates, payments, production, materials, and job costs.",
  path: "/case-studies/from-operational-friction-to-leadflow",
  type: "article",
});

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "From Operational Friction to LeadFlow",
  description:
    "A founder-led case study about building and implementing a connected workflow CRM for a home improvement company.",
  author: { "@type": "Person", name: "Jon Bratton" },
  publisher: { "@type": "Organization", name: "LeadFlow" },
  datePublished: "2026-10-05",
  dateModified: "2026-10-05",
  mainEntityOfPage:
    "https://www.leadflowcrm.info/case-studies/from-operational-friction-to-leadflow",
};

export default function FounderCaseStudyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <MarketingNav />
      <main>
        <article>
          <header className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
            <Link href="/case-studies" className="text-sm font-semibold text-orange-400 hover:underline">
              ← All case studies
            </Link>
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-orange-400">
              Founder story · Founding implementation · Anonymized customer
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-6xl">
              From operational friction to LeadFlow
            </h1>
            <p className="mt-6 max-w-4xl text-xl leading-relaxed text-slate-300">
              Jon Bratton did not set out to add another CRM to an already crowded software stack. He set out to stop one home improvement job from becoming six disconnected versions of the truth.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full border border-slate-800 bg-slate-900 px-4 py-2">Home improvement operations</span>
              <span className="rounded-full border border-slate-800 bg-slate-900 px-4 py-2">Connected workflow CRM</span>
              <span className="rounded-full border border-slate-800 bg-slate-900 px-4 py-2">Founder-led implementation</span>
            </div>
          </header>

          <section className="border-y border-slate-800 bg-slate-900/45">
            <div className="mx-auto grid max-w-6xl gap-5 px-6 py-12 md:grid-cols-3">
              {[
                ["The problem", "Customer, contract, payment, material, and production information lived in separate places."],
                ["The build", "Months of planning, implementation, testing, correction, and real-workflow edge cases."],
                ["The result", "One connected record follows the job from first inquiry through production and profitability."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <h2 className="text-xl font-bold text-orange-300">{title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{body}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="mx-auto max-w-4xl space-y-16 px-6 py-16">
            <Section eyebrow="The founder’s view" title="The hardest problems were in the handoffs">
              <p>
                Working closely with a growing home improvement operation made the pattern impossible to ignore. A lead entered one place. Appointment details moved somewhere else. The estimate became a document, the accepted document became a sale, the sale became a production conversation, and the production conversation created new spreadsheets, texts, and paper.
              </p>
              <p>
                Every handoff invited duplicate entry and small factual differences: the wrong service address, a missing payment status, a material order separated from the job, or a receipt that could not be tied back to profitability.
              </p>
              <blockquote className="border-l-4 border-orange-500 bg-orange-500/10 px-5 py-4 text-lg font-semibold text-slate-200">
                The goal was not “more software.” The goal was one workflow that people could actually follow.
              </blockquote>
            </Section>

            <Section eyebrow="The decision" title="Build around the job, not around isolated departments">
              <p>
                LeadFlow was designed so the customer and job do not restart at every department boundary. The prospect record carries into the estimate. Acceptance can create the sale, production job, and required payment step. The service location follows the work. Material orders and receipts stay connected to the job they support.
              </p>
              <p>
                That architecture also had to respect how different companies operate. One business may collect 50% at acceptance and the balance at completion. Another may use progress payments, financing approvals, or different production milestones. The platform needed a connected foundation without pretending every workflow was identical.
              </p>
            </Section>

            <Section eyebrow="The implementation" title="A real company supplied the edge cases">
              <p>
                The first implementation remained deliberately close to day-to-day operations. Instead of creating polished mockups detached from real use, the build worked through imported customer history, active estimates, multiple service addresses, payment choices, supplier orders, production stages, invoices, and receipt expenses.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Lead to estimate", "Calls, appointments, customer details, service locations, estimate items, photos, and customer-facing review."],
                  ["Acceptance to money", "Signed acceptance, payment choice, sale creation, deposit tracking, receipts, and final-balance logic."],
                  ["Sale to production", "Job creation, stages, milestones, crew context, material ordering, and a shared production board."],
                  ["Expense to profit", "Original receipts tied to the exact site job so contract value, costs, profit, and margin remain traceable."],
                ].map(([title, body]) => (
                  <div key={title} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                    <h3 className="font-bold text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section eyebrow="What changed" title="The outcome was connection, not a vanity metric">
              <p>
                This case study does not claim an invented percentage improvement or quote an unnamed customer. The verified outcome is operational: records that previously required a new handoff can now remain connected.
              </p>
              <ul className="space-y-3">
                {[
                  "An accepted estimate can become the exact sale and production job instead of a retyped copy.",
                  "A parent billing account can hold multiple service locations without mixing job balances or expenses.",
                  "Customer-facing invoices can remain in LeadFlow while completed payment records move to accounting.",
                  "Material orders and original receipt PDFs can stay attached to the job site they affect.",
                  "Owners can trace profitability from the contract back to its recorded expenses.",
                ].map((item) => (
                  <li key={item} className="flex gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm leading-relaxed text-slate-300">
                    <span className="text-emerald-400">✓</span>{item}
                  </li>
                ))}
              </ul>
            </Section>

            <Section eyebrow="The founder lesson" title="Implementation is part of the product">
              <p>
                Jon’s conclusion was straightforward: a configurable CRM is only valuable when someone takes responsibility for translating the company’s real process into the system. That is why LeadFlow’s selling point is not an empty login with a feature list.
              </p>
              <p>
                JMB handles agreed migration, workflow setup, and team training. The business receives a configured operating system and a clear path for using it—not another project placed on the owner’s desk.
              </p>
            </Section>
          </div>
        </article>

        <section className="border-t border-slate-800 bg-slate-900/45 py-16 text-center">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-3xl font-bold">See the connected workflow for yourself.</h2>
            <p className="mt-3 text-slate-400">The public tour uses synthetic sample data and requires no login.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/tour" className="rounded-xl bg-orange-500 px-7 py-3 font-bold text-white hover:bg-orange-600">Explore the interactive tour</Link>
              <Link href="/contact" className="rounded-xl border border-slate-700 px-7 py-3 font-bold text-slate-200 hover:bg-slate-900">Book a personalized demo</Link>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-400">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold text-white">{title}</h2>
      <div className="mt-5 space-y-4 text-base leading-8 text-slate-300">{children}</div>
    </section>
  );
}
