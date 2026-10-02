import Link from "next/link";
import {
  FOUNDING_CUSTOMER_LIMIT,
  FOUNDING_OFFER_HEADLINE,
  FOUNDING_OFFER_INCLUDES,
  FOUNDING_OFFER_RESERVATION,
  FOUNDING_SPOTS_REMAINING,
} from "@/lib/founding-offer";

export function FoundingOfferStrip() {
  return (
    <Link
      href="/pricing#founding-offer"
      className="block border-y border-orange-500/30 bg-orange-500/10 px-4 py-2.5 text-center text-xs font-semibold text-orange-100 hover:bg-orange-500/15 sm:text-sm"
    >
      <span className="font-bold text-orange-400">Founding customer offer:</span>{" "}
      {FOUNDING_OFFER_HEADLINE}{" "}
      <span className="text-slate-300">
        Only {FOUNDING_CUSTOMER_LIMIT} spots total.
      </span>
    </Link>
  );
}

export function FoundingOfferCard({
  compact = false,
  showCta = true,
  className = "",
}: {
  compact?: boolean;
  showCta?: boolean;
  className?: string;
}) {
  return (
    <section
      id="founding-offer"
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500/20 via-slate-900 to-slate-900 ring-1 ring-orange-500/50 ${
        compact ? "p-5" : "p-7 sm:p-9"
      } ${className}`}
    >
      <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-orange-500/15 blur-2xl" />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center rounded-full bg-orange-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            Founding customer offer
          </div>
          <div className="rounded-full bg-slate-950/70 px-3 py-1 text-xs font-bold text-orange-300 ring-1 ring-orange-500/40">
            {FOUNDING_SPOTS_REMAINING} of {FOUNDING_CUSTOMER_LIMIT} spots available
          </div>
        </div>

        <h2 className={`${compact ? "mt-4 text-2xl" : "mt-5 text-3xl sm:text-4xl"} font-bold text-white`}>
          {FOUNDING_OFFER_HEADLINE}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
          Only five companies will receive the founding setup waiver. Your monthly
          subscription still applies; the waived setup covers the agreed implementation work.
        </p>

        <div className={`mt-5 grid gap-2 ${compact ? "sm:grid-cols-3" : "sm:grid-cols-3"}`}>
          {FOUNDING_OFFER_INCLUDES.map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 rounded-xl bg-slate-950/50 px-3 py-2.5 text-sm font-semibold text-slate-200 ring-1 ring-slate-700/70"
            >
              <span className="text-orange-400">✓</span>
              {item}
            </div>
          ))}
        </div>

        <p className="mt-5 text-xs leading-relaxed text-slate-400">
          {FOUNDING_OFFER_RESERVATION} A demo or trial does not hold a spot.
        </p>

        {showCta && (
          <Link
            href="/contact"
            className="mt-6 inline-flex rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-950/20 hover:bg-orange-600"
          >
            Book a personalized demo
          </Link>
        )}
      </div>
    </section>
  );
}
