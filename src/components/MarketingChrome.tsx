import Link from "next/link";
import { APP_NAME, BUSINESS_NAME, copyright } from "@/lib/constants";
import { FoundingOfferStrip } from "@/components/FoundingOffer";

const NAV_LINKS = [
  ["/tour", "Product tour"],
  ["/case-studies", "Case studies"],
  ["/blog", "Blog"],
  ["/about", "About"],
  ["/pricing", "Pricing"],
] as const;

export function MarketingNav({ cta = "Book a demo" }: { cta?: string }) {
  return (
    <>
      <header className="relative z-30 mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-orange-500 text-lg font-bold text-white">
            {APP_NAME.slice(0, 1)}
          </div>
          <span className="text-lg font-bold">{APP_NAME}</span>
        </Link>

        <nav className="hidden items-center justify-end gap-4 text-sm lg:flex" aria-label="Main navigation">
          {NAV_LINKS.map(([href, label]) => (
            <Link key={href} href={href} className="font-medium text-slate-300 hover:text-white">
              {label}
            </Link>
          ))}
          <Link href="/login" className="font-medium text-slate-300 hover:text-white">
            Sign In
          </Link>
          <Link href="/contact" className="rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600">
            {cta}
          </Link>
        </nav>

        <details className="group relative lg:hidden">
          <summary className="cursor-pointer list-none rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900 [&::-webkit-details-marker]:hidden">
            Menu <span className="ml-1 inline-block transition group-open:rotate-180">▾</span>
          </summary>
          <nav className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-slate-700 bg-slate-900 p-3 shadow-2xl" aria-label="Mobile navigation">
            {NAV_LINKS.map(([href, label]) => (
              <Link key={href} href={href} className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800">
                {label}
              </Link>
            ))}
            <Link href="/contact" className="mt-1 block rounded-lg bg-orange-500 px-3 py-2 text-center text-sm font-bold text-white hover:bg-orange-600">
              {cta}
            </Link>
            <Link href="/login" className="mt-1 block rounded-lg px-3 py-2 text-center text-sm font-semibold text-slate-300 hover:bg-slate-800">
              Sign In
            </Link>
          </nav>
        </details>
      </header>
      <FoundingOfferStrip />
    </>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-800 py-10">
      <div className="mx-auto grid max-w-6xl gap-9 px-6 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-orange-500 text-sm font-bold text-white">
              {APP_NAME.slice(0, 1)}
            </div>
            <span className="font-bold text-slate-200">{APP_NAME}</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-500">
            A connected workflow CRM for home improvement companies—from first inquiry through final profit.
          </p>
        </div>
        <FooterColumn
          title="Product"
          links={[
            ["/tour", "Interactive tour"],
            ["/pricing", "Pricing"],
            ["/signup", "Trial workspace"],
            ["/login", "Sign In"],
          ]}
        />
        <FooterColumn
          title="Resources"
          links={[
            ["/case-studies", "Case studies"],
            ["/blog", "Blog"],
            ["/roofing-estimate-photos", "Estimate photos"],
            ["/cash-vs-finance-roofing-quote", "Cash vs finance"],
          ]}
        />
        <FooterColumn
          title="Company & legal"
          links={[
            ["/about", "About"],
            ["/contact", "Contact"],
            ["/terms", "Terms of Service"],
            ["/privacy", "Privacy Policy"],
            ["/cookies", "Cookie Policy"],
          ]}
        />
      </div>
      <p className="mx-auto mt-9 max-w-6xl border-t border-slate-800 px-6 pt-6 text-center text-xs text-slate-600">
        {copyright()} · A product of{" "}
        <a href="https://www.jmbcreative.org" className="text-slate-400 underline-offset-2 hover:text-slate-300 hover:underline">
          {BUSINESS_NAME}
        </a>
      </p>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: readonly (readonly [string, string])[] }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{title}</p>
      <div className="mt-3 space-y-2 text-sm">
        {links.map(([href, label]) => (
          <Link key={href} href={href} className="block text-slate-400 hover:text-slate-200">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
