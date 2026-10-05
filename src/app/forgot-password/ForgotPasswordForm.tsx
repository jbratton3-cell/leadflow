"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestPasswordReset } from "@/lib/auth-actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
    >
      {pending ? "Sending…" : "Send Reset Link"}
    </button>
  );
}

export default function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordReset, {});

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </div>
      )}
      {state?.message && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm leading-5 text-emerald-700">
          {state.message}
        </div>
      )}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="email">
          Account email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400"
        />
      </div>
      <SubmitButton />
    </form>
  );
}
