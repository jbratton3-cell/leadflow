import { createPublicMetadata } from "@/lib/public-metadata";
import ContactForm from "./ContactForm";
import { MarketingNav, MarketingFooter } from "@/components/MarketingChrome";
import { FoundingOfferCard } from "@/components/FoundingOffer";

export const metadata = createPublicMetadata({
  title: "Contact LeadFlow — Book a Personalized CRM Demo",
  description: "Tell us how your home improvement company works and book a personalized LeadFlow workflow CRM demonstration.",
  path: "/contact",
  type: "website",
});

export const dynamic = "force-dynamic";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <MarketingNav />

      <section className="mx-auto grid max-w-5xl gap-10 px-6 py-12 lg:grid-cols-2 lg:py-20">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">See how LeadFlow fits your workflow.</h1>
          <p className="mt-4 text-slate-300">
            Tell us how your team handles a job today. We&apos;ll show how LeadFlow connects the work from the first call through the estimate,
            payment, materials, production, and completion.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-300">
            {[
              "Personalized setup for your complete workflow",
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
          <FoundingOfferCard compact showCta={false} className="mt-8" />
        </div>

        <div>
          {/* Anti-spam timing value must be generated for this server-rendered request. */}
          {/* eslint-disable-next-line react-hooks/purity */}
          <ContactForm formStartedAt={Date.now()} />
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
