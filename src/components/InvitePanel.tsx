"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createInvite } from "@/lib/auth-actions";
import { ROLES } from "@/lib/permissions";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400";
const label = "mb-1 block text-xs font-medium text-slate-600";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
    >
      {pending ? "Sending…" : "Send Invite"}
    </button>
  );
}

function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-emerald-800">
        Invite link
      </div>
      <div className="flex items-center gap-2">
        <input readOnly value={link} className="w-full rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-xs text-slate-700" />
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
    </div>
  );
}

export default function InvitePanel() {
  const [state, formAction] = useActionState(createInvite, {});

  return (
    <div>
      <form action={formAction} className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label}>Full Name</label>
          <input name="name" required className={input} />
        </div>
        <div>
          <label className={label}>Email</label>
          <input name="email" type="email" required className={input} />
        </div>
        <div>
          <label className={label}>Mobile (optional, for text invite)</label>
          <input name="phone" placeholder="+15551234567" className={input} />
        </div>
        <div>
          <label className={label}>Role</label>
          <select name="role" defaultValue="agent" className={input}>
            {ROLES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <SubmitButton />
        </div>
      </form>

      {state?.error && (
        <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </div>
      )}
      {state?.message && (
        <div className="mt-3 text-sm text-slate-600">{state.message}</div>
      )}
      {state?.link && <CopyLink link={state.link} />}
    </div>
  );
}
