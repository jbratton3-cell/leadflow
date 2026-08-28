"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { loadSampleData, clearSampleData } from "@/lib/trial-actions";

// The guide that follows you: a docked card showing the CURRENT step with its
// instructions on every CRM page. Advances automatically as steps complete.
export default function FloatingTrialGuide({
  hasLead,
  hasSent,
  hasAccepted,
  hasInvoice,
}: {
  hasLead: boolean;
  hasSent: boolean;
  hasAccepted: boolean;
  hasInvoice: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  // Keep progress fresh: re-run server components (which re-query the DB) on
  // navigation and on a slow background pulse, so steps completed elsewhere
  // (e.g. accepting the estimate from email on a phone) advance the guide.
  useEffect(() => {
    router.refresh();
  }, [pathname, router]);

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 20000);
    return () => clearInterval(id);
  }, [router]);

  const steps = [
    {
      title: "Load the sample data",
      done: hasLead,
      cta: null as string | null,
      body: (
        <div className="space-y-2.5">
          <p className="text-xs leading-relaxed text-slate-600">
            One click creates a demo prospect — <strong>Danny Demo</strong> — with a
            ready-to-send estimate. His email is set to <strong>yours</strong>, so every
            step happens in your real inbox.
          </p>
          <div className="flex flex-wrap gap-2">
            <form action={loadSampleData}>
              <button className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600">
                Load sample data
              </button>
            </form>
            <form action={clearSampleData}>
              <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50">
                Clear it
              </button>
            </form>
          </div>
        </div>
      ),
    },
    {
      title: "Send the sample estimate",
      done: hasSent,
      cta: "/leads",
      body: (
        <ol className="space-y-1.5 text-xs leading-relaxed text-slate-600">
          <li className="flex gap-2"><span className="font-semibold text-slate-400">1.</span><span>Open <strong>Prospects</strong> and click <strong>Danny Demo</strong></span></li>
          <li className="flex gap-2"><span className="font-semibold text-slate-400">2.</span><span>Find <strong>Estimates</strong> in the right panel — click the estimate</span></li>
          <li className="flex gap-2"><span className="font-semibold text-slate-400">3.</span><span>Click <strong>Send to Customer</strong> — it goes to your own email</span></li>
          <li className="mt-1 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-500">
            ✓ Then check your inbox — that branded email is what your customers receive.
          </li>
        </ol>
      ),
    },
    {
      title: "Play the customer: accept & sign",
      done: hasAccepted,
      cta: null,
      body: (
        <ol className="space-y-1.5 text-xs leading-relaxed text-slate-600">
          <li className="flex gap-2"><span className="font-semibold text-slate-400">1.</span><span>Open the estimate email — ideally <strong>on your phone</strong></span></li>
          <li className="flex gap-2"><span className="font-semibold text-slate-400">2.</span><span>Review the line items — that&apos;s the customer view</span></li>
          <li className="flex gap-2"><span className="font-semibold text-slate-400">3.</span><span>Choose <strong>Pay directly</strong> — the 50% down option. <span className="font-medium text-orange-600">This triggers the invoicing engine.</span></span></li>
          <li className="flex gap-2"><span className="font-semibold text-slate-400">4.</span><span>Click <strong>Accept Estimate</strong>, then sign with your finger</span></li>
          <li className="mt-1 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-500">
            ✓ Seconds later: their signed PDF + a 50% deposit invoice arrive. Nobody touched anything.
          </li>
        </ol>
      ),
    },
    {
      title: "Watch the paperwork do itself",
      done: hasInvoice,
      cta: "/production",
      body: (
        <ol className="space-y-1.5 text-xs leading-relaxed text-slate-600">
          <li className="flex gap-2"><span className="font-semibold text-slate-400">1.</span><span><strong>Prospects:</strong> Danny flipped to <strong>Sold</strong> by himself</span></li>
          <li className="flex gap-2"><span className="font-semibold text-slate-400">2.</span><span><strong>Production:</strong> his job appeared — status <strong>Pending</strong></span></li>
          <li className="flex gap-2"><span className="font-semibold text-slate-400">3.</span><span><strong>Invoices:</strong> the deposit is listed — try <strong>Mark Paid</strong></span></li>
          <li className="flex gap-2"><span className="font-semibold text-slate-400">4.</span><span>Bonus: mark the job <strong>Completed</strong> → the <strong>final invoice emails itself</strong></span></li>
        </ol>
      ),
    },
    {
      title: "Ready for the real thing?",
      done: false,
      cta: null,
      body: (
        <div className="space-y-2.5">
          <p className="text-xs leading-relaxed text-slate-600">
            We migrate your data, set everything up, and train your team — you log in to a
            finished CRM on day one.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/contact" className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600">
              Book your setup call
            </Link>
            <Link href="/pricing" className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
              See plans
            </Link>
          </div>
          <p className="text-[10px] text-slate-400">
            Founding-customer offer: setup fee waived for the first five companies.
          </p>
        </div>
      ),
    },
  ];

  // current step = first not-done (excluding the final CTA when all else done)
  const currentIndex = steps.findIndex((s, i) => !s.done && i < 4);
  const allDone = currentIndex === -1;
  const step = allDone ? steps[4] : steps[currentIndex];
  const doneCount = steps.filter((s) => s.done).length;

  // auto-open when a NEW step becomes current (unless user dismissed it)
  useEffect(() => {
    setDismissed(false);
    setOpen(true);
  }, [currentIndex]);

  if (dismissed) {
    return (
      <button
        onClick={() => { setDismissed(false); setOpen(true); }}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg hover:bg-orange-600"
      >
        ✓ {Math.min(doneCount, 4)}/4 · {dismissed ? "Tour" : step.title} ▲
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between gap-2 bg-orange-50/70 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
            {allDone ? "★" : currentIndex + 1}
          </span>
          <span className="truncate text-xs font-bold text-slate-800">{step.title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-slate-400">{Math.min(doneCount, 4)}/4</span>
          <button
            onClick={() => setOpen(!open)}
            className="grid h-5 w-5 place-items-center rounded text-slate-400 hover:bg-white hover:text-slate-600"
            aria-label={open ? "Collapse" : "Expand"}
          >
            {open ? "▼" : "▲"}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="grid h-5 w-5 place-items-center rounded text-slate-400 hover:bg-white hover:text-slate-600"
            aria-label="Hide tour"
          >
            ✕
          </button>
        </div>
      </div>
      {open && (
        <div className="max-h-[45vh] overflow-y-auto px-4 py-3">
          {step.body}
          {step.cta && (
            <Link
              href={step.cta}
              onClick={() => setOpen(true)}
              className="mt-3 block rounded-lg bg-slate-900 px-3 py-1.5 text-center text-xs font-semibold text-white hover:bg-slate-800"
            >
              Take me there →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
