import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { APP_NAME } from "@/lib/constants";
import { MarketingNav, MarketingFooter } from "@/components/MarketingChrome";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: "🧱",
    title: "Material orders, sent automatically",
    body: "Choose the job, supplier, and materials. LeadFlow emails the order automatically and keeps it connected to the job.",
  },
  {
    icon: "📊",
    title: "Reporting across the operation",
    body: "Track leads, appointments, estimates, team activity, production, and marketing performance without rebuilding reports by hand.",
  },
  {
    icon: "🔄",
    title: "Automatic production handoff",
    body: "When a sale is recorded, the production job is created automatically. Nobody has to re-enter the same customer and job details.",
  },
  {
    icon: "📺",
    title: "Milestones & TV job board",
    body: "Track job status and completed milestones at a glance, then share the production board on a screen so the whole team stays aligned.",
  },
  {
    icon: "📞",
    title: "Call center & appointments",
    body: "See who to call next, book appointments, and track no-shows. The owner, office, and reps stay aligned without duplicate updates.",
  },
  {
    icon: "🏗️",
    title: "Production after the sale",
    body: "Measure, materials, install. Same system — the quote they signed is the job you run.",
  },
];

export default async function LandingPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <MarketingNav />

      <section className="mx-auto max-w-4xl px-6 pb-16 pt-16 text-center sm:pt-24">
        <div className="mb-4 inline-block rounded-full bg-slate-800 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-orange-400">
          For home improvement teams from first call to final install
        </div>
        <h1 className="text-4xl font-bold leading-tight sm:text-6xl">
          Keep every job moving
          <br />
          <span className="text-orange-500">without chasing the paperwork.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
          {APP_NAME} brings leads, appointments, estimates, signatures, payments, materials, and production into one connected workflow.
          Less administrative work for owners and sales reps, with everyone working from the same job.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/contact"
            className="rounded-lg bg-orange-500 px-7 py-3 text-base font-semibold text-white shadow-lg hover:bg-orange-600"
          >
            Book a personalized demo
          </Link>
          <Link
            href="/tour"
            className="rounded-lg border border-slate-700 px-7 py-3 text-base font-semibold text-slate-200 hover:bg-slate-800"
          >
            Take the guided tour
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          A focused walkthrough of how LeadFlow keeps your team aligned from the first call through the final payment.
        </p>
      </section>

      <section className="border-t border-slate-800 bg-slate-900/50 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold">One workflow. Less busywork.</h2>
          <p className="mt-2 text-center text-slate-400">
            LeadFlow keeps the office, sales team, and production crew aligned from the first call through the completed job.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl bg-slate-900 p-6 ring-1 ring-slate-800">
                <div className="text-3xl">{f.icon}</div>
                <h3 className="mt-3 text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-2xl font-bold text-slate-200">From first call to final install</h2>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm font-semibold">
            {["Lead", "Appointment", "Estimate + photos", "Signed", "Deposit", "Materials", "Install", "Final payment"].map(
              (step, i, arr) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="rounded-lg bg-slate-800 px-3 py-2 text-slate-200">{step}</span>
                  {i < arr.length - 1 && <span className="text-orange-500">→</span>}
                </div>
              )
            )}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/housecall-pro-alternative" className="text-orange-400 hover:underline">
              Housecall Pro alternative for roofers
            </Link>
            <Link href="/roofing-estimate-photos" className="text-orange-400 hover:underline">
              Estimates with photos
            </Link>
            <Link href="/cash-vs-finance-roofing-quote" className="text-orange-400 hover:underline">
              Cash vs finance quotes
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800 py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold">See how LeadFlow fits your workflow.</h2>
          <p className="mt-3 text-slate-400">
            We&apos;ll show how your team can manage leads, estimates, payments, materials, and production without duplicate work.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-block rounded-lg bg-orange-500 px-8 py-3 text-base font-semibold text-white shadow-lg hover:bg-orange-600"
          >
            Book a workflow demo
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
