"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { acceptInvite } from "@/lib/auth-actions";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400";
const label = "mb-1 block text-xs font-medium text-slate-600";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
    >
      {pending ? "Activating…" : "Set Password & Continue"}
    </button>
  );
}

export default function AcceptForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(acceptInvite, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {state?.error && (
        <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </div>
      )}
      <div>
        <label className={label} htmlFor="password">
          New Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={input}
        />
        <p className="mt-1 text-xs text-slate-400">At least 8 characters.</p>
      </div>
      <div>
        <label className={label} htmlFor="confirm">
          Confirm Password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={input}
        />
      </div>
      <label className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
        <input
          name="legalAccepted"
          type="checkbox"
          required
          className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-orange-500"
        />
        <span>
          I agree to the{" "}
          <Link href="/terms" target="_blank" className="font-semibold text-orange-600 hover:underline">
            Terms of Service
          </Link>{" "}
          and acknowledge the{" "}
          <Link href="/privacy" target="_blank" className="font-semibold text-orange-600 hover:underline">
            Privacy Policy
          </Link>
          .
        </span>
      </label>
      <SubmitButton />
    </form>
  );
}
