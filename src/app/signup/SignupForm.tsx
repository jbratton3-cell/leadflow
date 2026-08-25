"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signup } from "@/lib/auth-actions";

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
      {pending ? "Creating account…" : "Create Account"}
    </button>
  );
}

export default function SignupForm() {
  const [state, formAction] = useActionState(signup, {});

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </div>
      )}
      <div>
        <label className={label} htmlFor="company">
          Company Name
        </label>
        <input id="company" name="company" required className={input} placeholder="Acme Remodeling" />
      </div>
      <div>
        <label className={label} htmlFor="name">
          Your Name
        </label>
        <input id="name" name="name" required className={input} placeholder="Jane Smith" />
      </div>
      <div>
        <label className={label} htmlFor="email">
          Work Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className={input} />
      </div>
      <div>
        <label className={label} htmlFor="password">
          Password
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
      <SubmitButton />
    </form>
  );
}
