import { createPublicMetadata } from "@/lib/public-metadata";
import Link from "next/link";
import { MarketingFooter, MarketingNav } from "@/components/MarketingChrome";

export const metadata = createPublicMetadata({
  title: "LeadFlow Case Studies — Founder Story and Implementation",
  description: "Read how operational friction led Jon Bratton to build LeadFlow and implement a connected CRM workflow for a growing home improvement company.",
  path: "/case-studies",
  type: "website",
});

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <MarketingNav />
      <main>
        <section className="mx-auto max-w-5xl px-6 py-16 text-center sm:py-24">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-400">Founder-led case studies</p>
          <h1 className="mt-3 text-4xl font-bold sm:text-6xl">Why LeadFlow was built—and what changed when it met a real workflow</h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-slate-300">
            These stories focus on the operational problem, the implementation decisions, and the connected workflow—not anonymous hype or invented testimonials.
          </p>
        </section>

        <section className="border-y border-slate-800 bg-slate-900/45 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <article className="overflow-hidden rounded-3xl border border-orange-500/30 bg-slate-900">
              <div className="grid lg:grid-cols-[.8fr_1.2fr]">
                <div className="flex min-h-80 flex-col justify-between bg-gradient-to-br from-orange-500/25 via-slate-900 to-slate-950 p-8">
                  <div>
                    <span className="inline-flex rounded-full bg-orange-500 px-3 py-1 text-xs font-bold uppercase tracking-wide">Founding implementation</span>
                    <div className="mt-8 text-7xl">🔄</div>
                  </div>
                  <p className="text-sm text-slate-400">Home improvement workflow · Anonymized customer</p>
                </div>
                <div className="p-7 sm:p-10">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-400">Founder story + implementation case study</p>
                  <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                    From operational friction to LeadFlow
                  </h2>
                  <p className="mt-4 leading-relaxed text-slate-300">
                    Jon Bratton saw a growing home improvement company moving the same job through disconnected records, estimates, payment steps, material orders, and production updates. He did not start with a generic feature list. He started with the handoffs that kept breaking.
                  </p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {[
                      ["Challenge", "Duplicate entry and fragmented handoffs"],
                      ["Approach", "One configurable job workflow"],
                      ["Result", "Sales, money, production, and costs connected"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-slate-950/70 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
                        <p className="mt-2 text-sm font-semibold text-slate-200">{value}</p>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/case-studies/from-operational-friction-to-leadflow"
                    className="mt-7 inline-flex rounded-xl bg-orange-500 px-6 py-3 font-bold text-white hover:bg-orange-600"
                  >
                    Read the case study →
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="text-3xl font-bold">Why no testimonial quotes?</h2>
          <p className="mt-4 leading-relaxed text-slate-400">
            A quote should come from a real customer who approved the exact words and public attribution. Until then, we would rather show the verified workflow and implementation than manufacture social proof.
          </p>
          <Link href="/tour" className="mt-7 inline-flex rounded-xl border border-slate-700 px-6 py-3 font-bold text-slate-200 hover:bg-slate-900">
            See the workflow in the public tour
          </Link>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
