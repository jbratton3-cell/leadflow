import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicTourDemo from "@/components/PublicTourDemo";
import { MarketingFooter, MarketingNav } from "@/components/MarketingChrome";
import { getPublicTourStep, PUBLIC_TOUR_STEPS } from "@/lib/public-tour";

export const dynamicParams = false;

export function generateStaticParams() {
  return PUBLIC_TOUR_STEPS.map((step) => ({ slug: step.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const step = getPublicTourStep(slug);
  if (!step) return {};
  const url = `https://www.leadflowcrm.info/tour/${step.slug}`;
  return {
    title: step.seoTitle,
    description: step.description,
    alternates: { canonical: url },
    openGraph: {
      title: step.seoTitle,
      description: step.description,
      url,
      type: "website",
    },
  };
}

export default async function PublicTourStepPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const step = getPublicTourStep(slug);
  if (!step) notFound();
  const index = PUBLIC_TOUR_STEPS.findIndex((item) => item.slug === slug);
  const previous = index > 0 ? PUBLIC_TOUR_STEPS[index - 1] : null;
  const next = index < PUBLIC_TOUR_STEPS.length - 1 ? PUBLIC_TOUR_STEPS[index + 1] : null;
  const pageUrl = `https://www.leadflowcrm.info/tour/${step.slug}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: step.seoTitle,
        description: step.description,
        url: pageUrl,
        isPartOf: {
          "@type": "WebSite",
          name: "LeadFlow",
          url: "https://www.leadflowcrm.info",
        },
      },
      {
        "@type": "HowTo",
        name: step.title,
        description: step.answer,
        step: step.workflow.map((text, position) => ({
          "@type": "HowToStep",
          position: position + 1,
          text,
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: step.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <MarketingNav cta="Book a personalized demo" />

      <main>
        <section className="mx-auto max-w-6xl px-6 pb-10 pt-10 sm:pt-14">
          <nav aria-label="Product tour progress" className="overflow-x-auto pb-2">
            <ol className="flex min-w-max items-center gap-2">
              {PUBLIC_TOUR_STEPS.map((item, itemIndex) => (
                <li key={item.slug} className="flex items-center gap-2">
                  <Link
                    href={`/tour/${item.slug}`}
                    aria-current={item.slug === step.slug ? "step" : undefined}
                    className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold transition ${
                      item.slug === step.slug
                        ? "bg-orange-500 text-white"
                        : "border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    <span>{itemIndex + 1}</span>
                    <span>{item.shortTitle}</span>
                  </Link>
                  {itemIndex < PUBLIC_TOUR_STEPS.length - 1 && <span className="text-slate-700">→</span>}
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-10 grid items-start gap-10 lg:grid-cols-[.9fr_1.1fr]">
            <div>
              <Link href="/tour" className="text-sm font-semibold text-orange-400 hover:underline">
                ← Public tour overview
              </Link>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-300">
                <span>{step.icon}</span> Step {index + 1} of {PUBLIC_TOUR_STEPS.length}
              </div>
              <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">{step.title}</h1>
              <p className="mt-5 text-lg leading-relaxed text-slate-300">{step.description}</p>
              <div className="mt-6 rounded-2xl border border-orange-500/25 bg-orange-500/10 p-5">
                <h2 className="text-sm font-bold uppercase tracking-wide text-orange-300">
                  What does this LeadFlow feature do?
                </h2>
                <p className="mt-2 leading-relaxed text-slate-200">{step.answer}</p>
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/contact" className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white hover:bg-orange-600">
                  Book a personalized demo
                </Link>
                <Link href="/signup" className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-bold text-slate-200 hover:bg-slate-900">
                  Start a trial
                </Link>
              </div>
            </div>
            <PublicTourDemo slug={step.slug} />
          </div>
        </section>

        <section className="border-y border-slate-800 bg-slate-900/45 py-16">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-400">What you can accomplish</p>
              <h2 className="mt-2 text-3xl font-bold">Built around the same connected job record</h2>
              <ul className="mt-6 space-y-3">
                {step.outcomes.map((item) => (
                  <li key={item} className="flex gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm leading-relaxed text-slate-300">
                    <span className="mt-0.5 text-emerald-400">✓</span><span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-400">How it works</p>
              <h2 className="mt-2 text-3xl font-bold">A clear path from action to outcome</h2>
              <ol className="mt-6 space-y-3">
                {step.workflow.map((item, workflowIndex) => (
                  <li key={item} className="flex gap-4 rounded-xl bg-slate-950/70 px-4 py-3 text-sm leading-relaxed text-slate-300">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-orange-500 text-xs font-bold text-white">
                      {workflowIndex + 1}
                    </span>
                    <span className="pt-1">{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-16">
          <p className="text-center text-xs font-bold uppercase tracking-[0.16em] text-orange-400">Common questions</p>
          <h2 className="mt-2 text-center text-3xl font-bold">Answers about {step.shortTitle.toLowerCase()}</h2>
          <div className="mt-8 space-y-4">
            {step.faq.map((item) => (
              <article key={item.question} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <h3 className="text-lg font-bold text-white">{item.question}</h3>
                <p className="mt-2 leading-relaxed text-slate-400">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-800 py-12">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">Continue the connected workflow</p>
              <h2 className="text-xl font-bold">{next ? next.shortTitle : "Ready for your own workflow?"}</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {previous && (
                <Link href={`/tour/${previous.slug}`} className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-900">
                  ← {previous.shortTitle}
                </Link>
              )}
              {next ? (
                <Link href={`/tour/${next.slug}`} className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600">
                  {next.shortTitle} →
                </Link>
              ) : (
                <Link href="/contact" className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600">
                  Book your personalized demo
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
