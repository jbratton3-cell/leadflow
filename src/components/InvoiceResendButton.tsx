"use client";

import { useFormStatus } from "react-dom";

export default function InvoiceResendButton() {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={pending}
      className="w-full rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Sending…" : "Resend Email"}
    </button>
  );
}
