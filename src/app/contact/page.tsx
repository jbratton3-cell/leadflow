import ContactForm from "./ContactForm";
import { MarketingNav, MarketingFooter } from "@/components/MarketingChrome";

export const dynamic = "force-dynamic";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <MarketingNav />

      <section className="mx-auto grid max-w-5xl gap-10 px-6 py-12 lg:grid-cols-2 lg:py-20">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Bring a real job. We&apos;ll quote it live.</h1>
          <p className="mt-4 text-slate-300">
            A few minutes on a screen share. You show one recent estimate (even a PDF).
            We build it in LeadFlow — photos, pricebook, cash vs finance — while you watch.
            Your job, not a slide deck. That&apos;s usually all it takes.
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

      <MarketingFooter />
    </div>
  );
}
