import Link from "next/link";
import ContactForm from "./ContactForm";
import { APP_NAME, BUSINESS_NAME, copyright } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default function ContactPage() {
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
          <Link href="/pricing" className="font-medium text-slate-300 hover:text-white">
            Plans
          </Link>
          <Link href="/login" className="font-medium text-slate-300 hover:text-white">
            Sign In
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-5xl gap-10 px-6 py-12 lg:grid-cols-2 lg:py-20">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Let&apos;s get your team set up</h1>
          <p className="mt-4 text-slate-300">
            Tell us a bit about your business and we&apos;ll follow up with pricing and get
            you started. Every new customer is fully configured by our team — you&apos;ll log
            in to a finished, ready-to-sell account.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-300">
            {[
              "Personalized setup for your sales process",
              "We migrate your existing leads & jobs",
              "Your team trained and ready to go",
              "Month-to-month — no long-term contract",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-0.5 text-orange-500">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <ContactForm />
        </div>
      </section>

      <footer className="border-t border-slate-800 py-8">
        <p className="text-center text-xs text-slate-600">
          {copyright()} · A product of {BUSINESS_NAME}
        </p>
      </footer>
    </div>
  );
}
