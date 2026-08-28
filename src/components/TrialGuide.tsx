"use client";

import { useState } from "react";
import Link from "next/link";
import { loadSampleData, clearSampleData } from "@/lib/trial-actions";

// The guided trial: five steps that teach the lead-to-cash flow by doing it.
// Progress comes from the server (real data), steps expand into full lessons.
export default function TrialGuide({
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
  const [open, setOpen] = useState<number | null>(0);

  const steps = [
    {
      title: "Load the sample data",
      done: hasLead,
      body: (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            One click creates a demo prospect — <strong>Danny Demo</strong> — plus a sample
            product, lead source, and a ready-to-send estimate. Everything is tagged and
            removable later.
          </p>
          <p className="text-sm text-slate-600">
            We set Danny&apos;s email to <strong>yours</strong>, so every step below happens
            in your real inbox — exactly what your customers will experience.
          </p>
          <div className="flex flex-wrap gap-2">
            <form action={loadSampleData}>
              <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
                Load sample data
              </button>
            </form>
            <form action={clearSampleData}>
              <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Clear sample data
              </button>
            </form>
          </div>
          <After done={hasLead} text="Danny Demo now appears under Prospects, and his estimate is under Estimates." />
        </div>
      ),
    },
    {
      title: "Send the sample estimate",
      done: hasSent,
      body: (
        <div className="space-y-3">
          <Steps
            items={[
              <>Open <B>Prospects</B> and click <B>Danny Demo</B>.</>,
              <>In the right panel, find <B>Estimates</B> and click the estimate title.</>,
              <>Click <B>Send to Customer</B> — it goes to your own email.</>,
            ]}
          />
          <After done={hasSent} text="Check your inbox: a branded estimate email is waiting. That's what your customers receive." />
        </div>
      ),
    },
    {
      title: "Play the customer: accept & sign",
      done: hasAccepted,
      body: (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Now you&apos;ll see the sales process from the customer&apos;s chair — the moment
            where LeadFlow earns its keep.
          </p>
          <Steps
            items={[
              <>Open the estimate email <strong>on your phone</strong> (or click the link on your computer).</>,
              <>Review the line items and total — this is the customer view.</>,
              <>Under &quot;How would you like to pay?&quot; choose <B>Pay directly</B> — the 50% down / balance at completion option. <span className="font-medium text-orange-600">This choice triggers the invoicing engine.</span></>,
              <>Click <B>Accept Estimate</B>, then sign with your finger (or type your name).</>,
            ]}
          />
          <After
            done={hasAccepted}
            text="Seconds later, TWO emails arrive: their signed estimate as a PDF attachment, and a 50% deposit invoice. Nobody on your team touched anything."
          />
        </div>
      ),
    },
    {
      title: "Watch the paperwork do itself",
      done: hasInvoice,
      body: (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Come back to the CRM and see what already happened while you were playing
            customer:
          </p>
          <Steps
            items={[
              <><B>Prospects:</B> Danny Demo&apos;s stage changed to <B>Sold</B> automatically.</>,
              <><B>Production:</B> a job for Danny appeared, status <B>Pending</B> — ready to schedule.</>,
              <><B>Sales:</B> the $8,450 sale was recorded.</>,
              <><B>Invoices:</B> the deposit invoice is listed — mark it <B>Paid</B> to see the money tracking work (try the dropdown: card, cash, check…).</>,
              <>Bonus: mark the job <B>Completed</B> in Production and the <strong>final invoice emails itself</strong> — that&apos;s the second half of the money flow.</>,
            ]}
          />
          <After done={hasInvoice} text="Lead → estimate → signature → deposit → job → final invoice. Every step automatic. That's the whole product in one lap." />
        </div>
      ),
    },
    {
      title: "Ready for the real thing?",
      done: false,
      body: (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            When you&apos;re ready to run your company on LeadFlow, we do the heavy lifting:
            <strong> full data migration, system setup, and live training for your whole team</strong> —
            you log in to a finished CRM on day one.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/contact"
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Book your setup call
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              See plans
            </Link>
          </div>
          <p className="text-xs text-slate-400">
            Founding-customer offer: setup fee waived for the first five companies.
          </p>
        </div>
      ),
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-sm">
      <div className="border-b border-orange-100 bg-orange-50/60 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-orange-600">
              Guided tour
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              See LeadFlow work — in about 5 minutes
            </h2>
          </div>
          <div className="text-sm font-medium text-slate-500">
            {doneCount}/4 complete
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-orange-100">
          <div
            className="h-full rounded-full bg-orange-500 transition-all"
            style={{ width: `${Math.min(doneCount, 4) * 25}%` }}
          />
        </div>
      </div>
      <ol className="divide-y divide-slate-100">
        {steps.map((s, i) => (
          <li key={s.title}>
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-slate-50"
            >
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  s.done
                    ? "bg-emerald-500 text-white"
                    : open === i
                      ? "bg-orange-500 text-white"
                      : "bg-slate-200 text-slate-600"
                }`}
              >
                {s.done ? "✓" : i + 1}
              </span>
              <span className={`flex-1 text-sm font-semibold ${s.done ? "text-slate-400 line-through" : "text-slate-800"}`}>
                {s.title}
              </span>
              <span className="text-xs text-slate-400">{open === i ? "▲" : "▼"}</span>
            </button>
            {open === i && (
              <div className="px-5 pb-5 pt-1">
                {s.body}
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function B({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-slate-800">{children}</strong>;
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3 text-sm text-slate-600">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
            {i + 1}
          </span>
          <span>{it}</span>
        </li>
      ))}
    </ol>
  );
}

function After({ done, text }: { done: boolean; text: string }) {
  if (!done) return null;
  return (
    <div className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
      <span className="font-semibold">✓ Done —</span> {text}
    </div>
  );
}
