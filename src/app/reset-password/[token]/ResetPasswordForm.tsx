"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { resetPassword } from "@/lib/auth-actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
    >
      {pending ? "Updating…" : "Update Password"}
    </button>
  );
}

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPassword, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {state?.error && (
        <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </div>
      )}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="password">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="confirm">
          Confirm new password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400"
        />
      </div>
      <p className="text-xs text-slate-400">Use at least 8 characters.</p>
      <SubmitButton />
    </form>
  );
}
