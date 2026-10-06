import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingFooter, MarketingNav } from "@/components/MarketingChrome";
import { BLOG_POSTS, getBlogPost } from "@/lib/blog-posts";

export const dynamicParams = false;

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  const url = `https://www.leadflowcrm.info/blog/${post.slug}`;
  return {
    title: post.seoTitle,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      title: post.seoTitle,
      description: post.description,
      url,
      type: "article",
      publishedTime: post.publishedAt,
      authors: ["Jon Bratton"],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();
  const related = BLOG_POSTS.filter((item) => item.slug !== post.slug).slice(0, 2);
  const url = `https://www.leadflowcrm.info/blog/${post.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: post.title,
        description: post.description,
        datePublished: post.publishedAt,
        dateModified: post.publishedAt,
        mainEntityOfPage: url,
        author: { "@type": "Person", name: "Jon Bratton", url: "https://www.leadflowcrm.info/about" },
        publisher: { "@type": "Organization", name: "LeadFlow", url: "https://www.leadflowcrm.info" },
      },
      {
        "@type": "FAQPage",
        mainEntity: post.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <MarketingNav />
      <main>
        <article>
          <header className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
            <Link href="/blog" className="text-sm font-semibold text-orange-400 hover:underline">← Back to the blog</Link>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-xs">
              <span className="rounded-full bg-orange-500/15 px-3 py-1 font-bold uppercase tracking-wide text-orange-300">{post.category}</span>
              <span className="text-slate-500">{post.displayDate}</span>
              <span className="text-slate-700">•</span>
              <span className="text-slate-500">{post.readTime}</span>
            </div>
            <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-6xl">{post.title}</h1>
            <p className="mt-6 text-xl leading-relaxed text-slate-300">{post.excerpt}</p>
            <div className="mt-7 flex items-center gap-3 border-t border-slate-800 pt-6">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-orange-500 font-black">JB</div>
              <div>
                <Link href="/about" className="font-bold hover:text-orange-300">Jon Bratton</Link>
                <p className="text-xs text-slate-500">Founder of LeadFlow · Owner of JMB Business Solutions</p>
              </div>
            </div>
          </header>

          <section className="border-y border-slate-800 bg-slate-900/35">
            <div className="mx-auto max-w-4xl space-y-12 px-6 py-14">
              {post.sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="text-3xl font-bold text-white">{section.heading}</h2>
                  <div className="mt-5 space-y-4 text-base leading-8 text-slate-300">
                    {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    {section.bullets && (
                      <ul className="space-y-3 pt-1">
                        {section.bullets.map((item) => (
                          <li key={item} className="flex gap-3 rounded-xl bg-slate-950/70 px-4 py-3 text-sm leading-relaxed">
                            <span className="text-emerald-400">✓</span><span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-4xl px-6 py-14">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-400">Frequently asked questions</p>
            <h2 className="mt-2 text-3xl font-bold">Quick answers</h2>
            <div className="mt-7 space-y-4">
              {post.faq.map((item) => (
                <div key={item.question} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <h3 className="text-lg font-bold">{item.question}</h3>
                  <p className="mt-2 leading-relaxed text-slate-400">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </article>

        <section className="border-y border-slate-800 bg-slate-900/45 py-14">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-2xl font-bold">Continue reading</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {related.map((item) => (
                <Link key={item.slug} href={`/blog/${item.slug}`} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 hover:border-orange-500/50">
                  <span className="text-2xl">{item.icon}</span>
                  <h3 className="mt-3 text-xl font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.excerpt}</p>
                  <span className="mt-4 inline-flex text-sm font-bold text-orange-400">Read guide →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 text-center">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-3xl font-bold">See the workflow instead of imagining it.</h2>
            <p className="mt-3 text-slate-400">Explore LeadFlow with interactive synthetic data—no login required.</p>
            <Link href="/tour" className="mt-7 inline-flex rounded-xl bg-orange-500 px-7 py-3 font-bold text-white hover:bg-orange-600">Open the public tour</Link>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
