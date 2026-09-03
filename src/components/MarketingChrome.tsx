import Link from "next/link";
import { APP_NAME, BUSINESS_NAME, copyright } from "@/lib/constants";

export function MarketingNav({ cta = "Book a demo" }: { cta?: string }) {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <Link href="/" className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-orange-500 text-lg font-bold text-white">
          {APP_NAME.slice(0, 1)}
        </div>
        <span className="text-lg font-bold">{APP_NAME}</span>
      </Link>
      <nav className="flex flex-wrap items-center justify-end gap-3 text-sm">
        <Link href="/housecall-pro-alternative" className="hidden font-medium text-slate-300 hover:text-white sm:inline">
          For roofers
        </Link>
        <Link href="/tour" className="font-medium text-slate-300 hover:text-white">
          Guided tour
        </Link>
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
          {cta}
        </Link>
      </nav>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-800 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-sm text-slate-500 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="grid h-6 w-6 place-items-center rounded bg-orange-500 text-xs font-bold text-white">
            {APP_NAME.slice(0, 1)}
          </div>
          <span>{APP_NAME}</span>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/housecall-pro-alternative" className="hover:text-slate-300">
            Housecall Pro alternative
          </Link>
          <Link href="/roofing-estimate-photos" className="hover:text-slate-300">
            Estimate photos
          </Link>
          <Link href="/cash-vs-finance-roofing-quote" className="hover:text-slate-300">
            Cash vs finance
          </Link>
          <Link href="/tour" className="hover:text-slate-300">
            Guided tour
          </Link>
          <Link href="/pricing" className="hover:text-slate-300">
            Pricing
          </Link>
          <Link href="/contact" className="hover:text-slate-300">
            Book a demo
          </Link>
          <Link href="/login" className="hover:text-slate-300">
            Sign In
          </Link>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-slate-600">
        {copyright()} · A product of{" "}
        <a href="https://jmbcreative.org" className="text-slate-400 hover:text-slate-300 underline-offset-2 hover:underline">
          {BUSINESS_NAME}
        </a>
      </p>
    </footer>
  );
}
