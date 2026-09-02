import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { APP_NAME } from "@/lib/constants";
import { MarketingNav, MarketingFooter } from "@/components/MarketingChrome";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: "📸",
    title: "Photos on the estimate",
    body: "Shoot the damage on the roof. The homeowner sees it from the kitchen. Nobody climbs a ladder at 7 p.m. to “just look.”",
  },
  {
    icon: "💰",
    title: "Cash vs finance, same quote",
    body: "List price if they finance. Cash price if they put 50% down. Show what they save — that's the close.",
  },
  {
    icon: "📋",
    title: "Pricebook in the driveway",
    body: "Pick the work. Description and price fill in. Stop typing a novel on the hood of the truck.",
  },
  {
    icon: "✍️",
    title: "Sign at the table",
    body: "They accept and sign on the phone in the house. Email the link only if the spouse isn't home.",
  },
  {
    icon: "📞",
    title: "Call center & appointments",
    body: "Who to call next, book the demo, track no-shows. The office and the closer stay on the same job.",
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
          For roofers & exterior companies that sell in the home
        </div>
        <h1 className="text-4xl font-bold leading-tight sm:text-6xl">
          Stop emailing estimates
          <br />
          <span className="text-orange-500">into the void.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
          {APP_NAME} is the CRM for the kitchen-table close — photos of the damage, cash vs finance, sign on the phone.
          Built in Albany by JMB Business Solutions — for contractors who still sell in the home.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/contact"
            className="rounded-lg bg-orange-500 px-7 py-3 text-base font-semibold text-white shadow-lg hover:bg-orange-600"
          >
            Bring a real job — we&apos;ll quote it live
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-slate-700 px-7 py-3 text-base font-semibold text-slate-200 hover:bg-slate-800"
          >
            Pricing — less than one missed roof
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          20 minutes. You share a job. We build it in LeadFlow while you watch. Month-to-month after that.
        </p>
      </section>

      <section className="border-t border-slate-800 bg-slate-900/50 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold">Built around the close — not the calendar</h2>
          <p className="mt-2 text-center text-slate-400">
            Software doesn&apos;t one-call close. The rep does. This gets out of the way in the house.
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
            {["Lead", "Appointment", "Estimate + photos", "Cash or finance", "Signed", "Production"].map(
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
          <h2 className="text-3xl font-bold">Bring a messy job. We&apos;ll quote it live.</h2>
          <p className="mt-3 text-slate-400">
            No slide deck. If it isn&apos;t faster than what you do now, you wasted 20 minutes and we both know.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-block rounded-lg bg-orange-500 px-8 py-3 text-base font-semibold text-white shadow-lg hover:bg-orange-600"
          >
            Book the 20 minutes
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
