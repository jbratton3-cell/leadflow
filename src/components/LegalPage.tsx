import type { ReactNode } from "react";
import Link from "next/link";
import { MarketingFooter, MarketingNav } from "@/components/MarketingChrome";
import { LEGAL_CONTACT_EMAIL, LEGAL_EFFECTIVE_DATE } from "@/lib/legal";

export function LegalPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <MarketingNav />
      <main>
        <section className="border-b border-slate-800 bg-slate-900/40">
          <div className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-400">LeadFlow legal</p>
            <h1 className="mt-3 text-4xl font-bold sm:text-5xl">{title}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-300">{description}</p>
            <p className="mt-5 text-sm text-slate-500">Effective and last updated: {LEGAL_EFFECTIVE_DATE}</p>
          </div>
        </section>
        <section className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_260px]">
          <article className="min-w-0 space-y-9 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-9">
            {children}
          </article>
          <aside className="min-w-0 space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="font-bold">Questions?</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Contact us about these policies or your LeadFlow account.
              </p>
              <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="mt-3 block break-all text-sm font-semibold text-orange-400 hover:underline">
                {LEGAL_CONTACT_EMAIL}
              </a>
            </div>
            <nav aria-label="Legal pages" className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-sm">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Legal documents</p>
              <div className="space-y-2">
                <Link href="/terms" className="block text-slate-300 hover:text-orange-400">Terms of Service</Link>
                <Link href="/privacy" className="block text-slate-300 hover:text-orange-400">Privacy Policy</Link>
                <Link href="/cookies" className="block text-slate-300 hover:text-orange-400">Cookie Policy</Link>
              </div>
            </nav>
          </aside>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}

export function LegalSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-bold text-white">
        <span className="mr-2 text-orange-400">{number}.</span>{title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-slate-300">{children}</div>
    </section>
  );
}
