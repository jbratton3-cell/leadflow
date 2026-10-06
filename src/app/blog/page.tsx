import type { Metadata } from "next";
import Link from "next/link";
import { MarketingFooter, MarketingNav } from "@/components/MarketingChrome";
import { BLOG_POSTS } from "@/lib/blog-posts";

export const metadata: Metadata = {
  title: "LeadFlow Blog — Home Improvement CRM and Workflow Guides",
  description:
    "Practical guides about connected CRM workflows, estimates, payments, service locations, production, receipts, job costing, and profitability.",
  alternates: { canonical: "https://www.leadflowcrm.info/blog" },
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <MarketingNav />
      <main>
        <section className="mx-auto max-w-5xl px-6 py-16 text-center sm:py-24">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-400">LeadFlow field notes</p>
          <h1 className="mt-3 text-4xl font-bold sm:text-6xl">Practical answers about connected home improvement workflows</h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-slate-300">
            Clear guides for owners and operators working through CRM structure, estimates, payments, service locations, production, job costs, and reporting.
          </p>
        </section>

        <section className="border-y border-slate-800 bg-slate-900/45 py-16">
          <div className="mx-auto grid max-w-6xl gap-6 px-6 lg:grid-cols-3">
            {BLOG_POSTS.map((post) => (
              <article key={post.slug} className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-orange-500/50">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-4xl">{post.icon}</span>
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-300">{post.category}</span>
                </div>
                <h2 className="mt-5 text-2xl font-bold leading-snug">
                  <Link href={`/blog/${post.slug}`} className="hover:text-orange-300">{post.title}</Link>
                </h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-400">{post.excerpt}</p>
                <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-500">
                  <span>{post.displayDate}</span><span>{post.readTime}</span>
                </div>
                <Link href={`/blog/${post.slug}`} className="mt-5 text-sm font-bold text-orange-400 hover:underline">
                  Read the guide →
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="text-3xl font-bold">See these workflows in action.</h2>
          <p className="mt-3 text-slate-400">The interactive public tour uses synthetic data and requires no account.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/tour" className="rounded-xl bg-orange-500 px-7 py-3 font-bold text-white hover:bg-orange-600">Explore the public tour</Link>
            <Link href="/contact" className="rounded-xl border border-slate-700 px-7 py-3 font-bold text-slate-200 hover:bg-slate-900">Book a personalized demo</Link>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
