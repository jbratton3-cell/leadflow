"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitDemoRequest } from "@/lib/contact-actions";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-400";
const label = "mb-1 block text-xs font-medium text-slate-600";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
    >
      {pending ? "Sending…" : "Book a live quote"}
    </button>
  );
}

export default function ContactForm() {
  const [state, formAction] = useActionState(submitDemoRequest, {});

  if (state?.success) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="text-4xl">✅</div>
        <h2 className="mt-3 text-xl font-bold text-slate-900">Thanks — we got it!</h2>
        <p className="mt-2 text-sm text-slate-500">
          We&apos;ll reply to set up a short screen share and quote one of your real jobs live. No deck.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-2xl bg-white p-6 shadow-xl">
      {state?.error && (
        <div className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Your Name *</label>
          <input name="name" required className={input} />
        </div>
        <div>
          <label className={label}>Company</label>
          <input name="company" className={input} />
        </div>
        <div>
          <label className={label}>Email *</label>
          <input name="email" type="email" required className={input} />
        </div>
        <div>
          <label className={label}>Phone</label>
          <input name="phone" className={input} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Your Trade</label>
          <select name="trade" defaultValue="" className={input}>
            <option value="">Select…</option>
            <option>Windows &amp; Doors</option>
            <option>Roofing</option>
            <option>Siding / Exterior</option>
            <option>Bath / Kitchen Remodel</option>
            <option>Solar</option>
            <option>HVAC</option>
            <option>Other Home Improvement</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Anything you&apos;d like us to know?</label>
          <textarea name="message" rows={3} className={input} />
        </div>
      </div>
      <div className="mt-5">
        <SubmitButton />
      </div>
      <p className="mt-3 text-center text-xs text-slate-400">
        We&apos;ll never share your information.
      </p>
    </form>
  );
}
