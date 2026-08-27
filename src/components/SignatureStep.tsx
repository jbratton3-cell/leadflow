"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SignaturePad from "@/components/SignaturePad";
import { saveSignature } from "@/lib/estimate-actions";

// Shown on the public estimate page after the customer accepts: an optional
// signature step. Skipping it changes nothing — acceptance already happened.
export default function SignatureStep({
  token,
  customerName,
}: {
  token: string;
  customerName: string;
}) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleSaved(dataUrl: string) {
    setBusy(true);
    try {
      await saveSignature({ token, signature: dataUrl, name: customerName });
      setSaved(true);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (saved) {
    return (
      <div className="rounded-xl bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
        ✓ Signed and saved — thank you! A copy is on file with your accepted
        estimate.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-1 text-sm font-semibold text-slate-800">
        Optional: add your signature
      </div>
      <p className="mb-3 text-xs text-slate-500">
        A signature makes your accepted estimate official. Draw below or type
        your name — or skip this, your acceptance is already recorded.
      </p>
      {busy ? (
        <div className="py-8 text-center text-sm text-slate-400">Saving…</div>
      ) : (
        <SignaturePad onSaved={handleSaved} />
      )}
    </div>
  );
}
