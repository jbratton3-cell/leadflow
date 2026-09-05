"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createWorkspaceInvite } from "@/lib/auth-actions";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400";
const label = "mb-1 block text-xs font-medium text-slate-600";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
    >
      {pending ? "Creating…" : "Create Workspace Invite"}
    </button>
  );
}

function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
      <div className="mb-1 text-xs font-semibold text-emerald-800">Workspace invite link</div>
      <div className="flex items-center gap-2">
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
    </div>
  );
}

export default function WorkspaceInvitePanel() {
  const [state, formAction] = useActionState(createWorkspaceInvite, {});

  return (
    <div>
      <form action={formAction} className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label}>Company / Workspace Name</label>
          <input name="company" defaultValue="JMB Business Solutions" required className={input} />
        </div>
        <div>
          <label className={label}>Admin Name</label>
          <input name="name" defaultValue="Jon" required className={input} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Admin Email</label>
          <input name="email" type="email" defaultValue="jon@leadflowcrm.info" required className={input} />
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
      {state?.message && <div className="mt-3 text-sm text-slate-600">{state.message}</div>}
      {state?.link && <CopyLink link={state.link} />}
    </div>
  );
}