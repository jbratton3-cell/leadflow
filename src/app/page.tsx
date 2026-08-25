import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { APP_NAME, BUSINESS_NAME, copyright } from "@/lib/constants";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: "📞",
    title: "Smart Call Center",
    body: "Automated dial queues tell your reps exactly who to call next — plus a rehash pipeline so no lead is ever forgotten.",
  },
  {
    icon: "📅",
    title: "Appointment Setting",
    body: "Book, confirm, and track in-home demos with a clear calendar. Fewer no-shows, more demos sat.",
  },
  {
    icon: "📝",
    title: "Online Estimates",
    body: "Send professional estimates customers accept or decline with one click — and watch every status update live.",
  },
  {
    icon: "🏗️",
    title: "Production Tracking",
    body: "Follow every sold job from measure to materials to final install, with a TV job board for the whole crew.",
  },
  {
    icon: "📈",
    title: "Marketing ROI",
    body: "Know your true cost-per-lead and cost-per-sale for every ad source. Spend smarter, sell more.",
  },
  {
    icon: "🎯",
    title: "Real-Time Metrics",
    body: "Live dashboards on set rate, sit rate, close rate, revenue, and rep performance — updated as you work.",
  },
];

export default async function LandingPage() {
  // Logged-in users skip the marketing page and go straight to their dashboard.
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-orange-500 text-lg font-bold text-white">
            {APP_NAME.slice(0, 1)}
          </div>
          <span className="text-lg font-bold">{APP_NAME}</span>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/pricing" className="font-medium text-slate-300 hover:text-white">
            Pricing
          </Link>
          <Link href="/login" className="font-medium text-slate-300 hover:text-white">
            Sign In
          </Link>
          <Link
            href="/contact"
            className="rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-16 pt-16 text-center sm:pt-24">
        <div className="mb-4 inline-block rounded-full bg-slate-800 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-orange-400">
          Built for home improvement companies that sell in the home
        </div>
        <h1 className="text-4xl font-bold leading-tight sm:text-6xl">
          Stop losing leads.
          <br />
          <span className="text-orange-500">Start closing jobs.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
          {APP_NAME} is the all-in-one CRM for windows, roofing, siding, bath, and
          exterior remodelers — capture every lead, book more appointments, close
          more sales, and track every job to completion. No spreadsheets, no sticky notes.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/contact"
            className="rounded-lg bg-orange-500 px-7 py-3 text-base font-semibold text-white shadow-lg hover:bg-orange-600"
          >
            Get Started
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-slate-700 px-7 py-3 text-base font-semibold text-slate-200 hover:bg-slate-800"
          >
            View Plans
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Month-to-month · we set everything up for you.
        </p>
      </section>

      {/* Features */}
      <section className="border-t border-slate-800 bg-slate-900/50 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold">Everything your team needs to grow</h2>
          <p className="mt-2 text-center text-slate-400">
            One system for your whole sales-to-production pipeline.
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

      {/* Pipeline strip */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-2xl font-bold text-slate-200">
            From first call to final install — all in one place
          </h2>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm font-semibold">
            {["Lead", "Call Center", "Appointment", "Estimate", "Sale", "Production"].map(
              (step, i, arr) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="rounded-lg bg-slate-800 px-3 py-2 text-slate-200">{step}</span>
                  {i < arr.length - 1 && <span className="text-orange-500">→</span>}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-800 py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold">Ready to turn more leads into revenue?</h2>
          <p className="mt-3 text-slate-400">
            Get your team on {APP_NAME} today and see the difference a real sales-and-production
            CRM makes.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-block rounded-lg bg-orange-500 px-8 py-3 text-base font-semibold text-white shadow-lg hover:bg-orange-600"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-sm text-slate-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center rounded bg-orange-500 text-xs font-bold text-white">
              {APP_NAME.slice(0, 1)}
            </div>
            <span>{APP_NAME}</span>
          </div>
          <div className="flex gap-4">
            <Link href="/pricing" className="hover:text-slate-300">
              Pricing
            </Link>
            <Link href="/login" className="hover:text-slate-300">
              Sign In
            </Link>
            <Link href="/contact" className="hover:text-slate-300">
              Get Started
            </Link>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-slate-600">
          {copyright()} · A product of {BUSINESS_NAME}
        </p>
      </footer>
    </div>
  );
}
