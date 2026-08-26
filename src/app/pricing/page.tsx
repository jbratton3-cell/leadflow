import Link from "next/link";
import { APP_NAME, BUSINESS_NAME, copyright } from "@/lib/constants";

export const dynamic = "force-dynamic";

const TIERS = [
  {
    name: "Starter",
    tagline: "For solo operators & small crews",
    price: 149,
    highlight: false,
    features: [
      "Up to 3 users",
      "Lead & prospect management",
      "Appointment scheduling",
      "Online estimates",
      "Production tracking + TV job board",
      "Email support",
    ],
  },
  {
    name: "Pro",
    tagline: "For growing sales teams",
    price: 399,
    highlight: true,
    features: [
      "Up to 10 users",
      "Everything in Starter, plus:",
      "Call center dial queues & rehash",
      "Marketing ROI & cost-per-sale",
      "Metrics command center",
      "CSV data import / migration",
      "Roles & permissions",
      "Priority support",
    ],
  },
  {
    name: "Business",
    tagline: "For established companies",
    price: 749,
    highlight: false,
    features: [
      "Up to 25 users",
      "Everything in Pro, plus:",
      "Unlimited leads & jobs",
      "Advanced reporting",
      "Onboarding & data migration",
      "Dedicated account support",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-orange-500 text-lg font-bold text-white">
            {APP_NAME.slice(0, 1)}
          </div>
          <span className="text-lg font-bold">{APP_NAME}</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
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

      {/* Heading */}
      <section className="mx-auto max-w-3xl px-6 pb-8 pt-12 text-center sm:pt-16">
        <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-4 py-1.5 text-sm font-semibold text-orange-400 ring-1 ring-orange-500/30">
          Month-to-month · No contracts · Cancel anytime
        </div>
        <h1 className="mt-5 text-4xl font-bold sm:text-5xl">Plans for every size team</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
          Pick the plan that fits your business — then we do the rest. Every plan
          includes done-for-you setup and live team training.
        </p>
      </section>

      {/* Tiers */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mx-auto mb-8 max-w-2xl rounded-2xl bg-orange-500/10 px-6 py-4 text-center ring-1 ring-orange-500/40">
          <span className="font-bold text-orange-300">Founding Customer Offer:</span>{" "}
          <span className="text-slate-200">
            setup fee waived for our first five customers — a value of up to $4,000.
          </span>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl p-7 ${
                tier.highlight
                  ? "bg-slate-900 ring-2 ring-orange-500"
                  : "bg-slate-900 ring-1 ring-slate-800"
              }`}
            >
              {tier.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Most Popular
                </span>
              )}
              <h2 className="text-xl font-bold">{tier.name}</h2>
              <p className="mt-1 text-sm text-slate-400">{tier.tagline}</p>
              <div className="mt-4">
                <span className="text-4xl font-bold">${tier.price}</span>
                <span className="text-sm text-slate-400"> /month</span>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  + one-time setup fee — covers full data migration, account setup &amp;
                  live training for your whole team
                </p>
              </div>
              <Link
                href="/contact"
                className={`mt-6 rounded-lg px-4 py-2.5 text-center text-sm font-semibold ${
                  tier.highlight
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "border border-slate-700 text-slate-200 hover:bg-slate-800"
                }`}
              >
                Book a Setup Call
              </Link>
              <ul className="mt-6 space-y-2.5 text-sm">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-0.5 text-orange-500">✓</span>
                    <span
                      className={
                        f.endsWith("plus:") ? "font-semibold text-slate-300" : "text-slate-400"
                      }
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-slate-400">
          Comparable in-home sales systems run $900–$1,200+/month — and lock you into
          annual contracts. We don&apos;t.
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-slate-400">
          Need more than 25 users or multiple locations?{" "}
          <span className="font-semibold text-slate-200">Enterprise plans available</span> —
          contact us for custom pricing, onboarding, and integrations.
        </p>
      </section>

      {/* Onboarding & Setup */}
      <section className="border-t border-slate-800 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-2xl bg-slate-900 p-8 ring-1 ring-slate-800">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="inline-block rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-400">
                  Done-For-You Onboarding
                </div>
                <h2 className="mt-3 text-2xl font-bold">
                  We&apos;ll get you up and running — tailored to your business
                </h2>
                <p className="mt-2 max-w-xl text-sm text-slate-400">
                  Skip the setup work. Our team configures {APP_NAME} around your exact
                  sales process, migrates your data, and trains your team so you&apos;re
                  ready to sell from day one.
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">One-time fee</div>
                <div className="text-xs text-slate-400">sized to your team — far less than hiring staff to do it</div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "Personalized account & workspace setup",
                "Your sales pipeline & call-center queues configured",
                "Lead sources & products loaded for your business",
                "Full migration of your existing leads & jobs",
                "User accounts & roles set up for your team",
                "Live team training session",
                "Custom estimate templates & terms",
                "Priority launch support",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 text-orange-500">✓</span>
                  <span className="text-slate-300">{item}</span>
                </div>
              ))}
            </div>

            <p className="mt-6 text-sm text-slate-400">
              Every new customer is fully set up by our team — you log in to a finished,
              configured account, ready to sell from day one — no setup work on your end.
            </p>
          </div>
        </div>
      </section>

      {/* How to get started */}
      <section className="border-t border-slate-800 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-2xl font-bold">How to get started</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              {
                n: "1",
                t: "Reach out",
                d: "Tell us about your business and we'll recommend the right plan and pricing.",
              },
              {
                n: "2",
                t: "We set you up",
                d: "Our team configures LeadFlow for your sales process and migrates your data.",
              },
              {
                n: "3",
                t: "Start selling",
                d: "Log in to a ready-to-go account, your team trained and good to go.",
              },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl bg-slate-900 p-6 ring-1 ring-slate-800">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-orange-500 text-sm font-bold text-white">
                  {s.n}
                </div>
                <h3 className="mt-3 font-bold">{s.t}</h3>
                <p className="mt-1 text-sm text-slate-400">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-800 py-14">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-2xl font-bold">Frequently asked questions</h2>
          <div className="mt-8 space-y-6">
            {[
              {
                q: "How much does LeadFlow cost?",
                a: "Pricing depends on your plan and team size. Reach out and we'll walk you through current pricing and get you set up with the right fit for your business.",
              },
              {
                q: "What's included in setup?",
                a: "Our team configures LeadFlow around your sales process, loads your lead sources and products, migrates your existing leads and jobs, sets up your users, and trains your team — so you start on a finished, ready-to-use account.",
              },
              {
                q: "What's your cancellation policy?",
                a: "Subscriptions are month-to-month — no long-term contract. You can cancel anytime.",
              },
              {
                q: "Can I move my existing leads and jobs over?",
                a: "Yes. As part of onboarding, our team migrates your existing leads and jobs from your spreadsheets or previous CRM so nothing is lost.",
              },
              {
                q: "What if my team grows?",
                a: "Upgrade anytime as you add users. You only move up a tier when you're ready.",
              },
              {
                q: "Is my data secure and private?",
                a: "Every company gets its own isolated, private workspace. Your data is never shared with other businesses.",
              },
            ].map((item) => (
              <div key={item.q}>
                <h3 className="font-semibold text-slate-200">{item.q}</h3>
                <p className="mt-1 text-sm text-slate-400">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <p className="text-center text-xs text-slate-600">
          {copyright()} · A product of {BUSINESS_NAME}
        </p>
      </footer>
    </div>
  );
}
