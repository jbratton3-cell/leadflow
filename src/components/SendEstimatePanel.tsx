"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { sendEstimate } from "@/lib/estimate-actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
    >
      {pending ? "Sending…" : label}
    </button>
  );
}

function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3 flex items-center gap-2">
      <input
        readOnly
        value={link}
        className="w-full rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-xs text-slate-700"
      />
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(link);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

export default function SendEstimatePanel({
  estimateId,
  hasItems,
  alreadySent,
  customerEmail,
}: {
  estimateId: number;
  hasItems: boolean;
  alreadySent: boolean;
  customerEmail: string | null;
}) {
  const [state, formAction] = useActionState(sendEstimate, {});

  return (
    <div>
      <form action={formAction} className="flex items-center gap-3">
        <input type="hidden" name="id" value={estimateId} />
        <SubmitButton label={alreadySent ? "Resend Estimate" : "Send Estimate"} />
        <span className="text-xs text-slate-400">
          {customerEmail ? `Will email ${customerEmail}` : "No customer email on file"}
        </span>
      </form>

      {!hasItems && (
        <p className="mt-2 text-xs text-amber-600">
          Add at least one line item before sending.
        </p>
      )}
      {state?.error && (
        <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </div>
      )}
      {state?.message && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <div className="text-sm text-emerald-800">{state.message}</div>
          {state.link && <CopyLink link={state.link} />}
        </div>
      )}
    </div>
  );
}
