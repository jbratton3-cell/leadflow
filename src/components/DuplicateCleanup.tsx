"use client";

import { useActionState } from "react";
import { removeExactDuplicateLeads } from "@/lib/delete-actions";

type CleanupState = {
  deleted?: number;
  skipped?: number;
  error?: string;
};

export default function DuplicateCleanup() {
  const [state, action, pending] = useActionState<CleanupState, FormData>(
    async (_previous, formData) => removeExactDuplicateLeads(),
    {},
  );

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <h2 className="text-sm font-semibold text-amber-900">Duplicate lead cleanup</h2>
      <p className="mt-1 text-xs leading-5 text-amber-800">
        Keeps the oldest exact copy and removes only newer duplicates with no activity attached.
      </p>
      <form
        action={action}
        className="mt-3"
        onSubmit={(event) => {
          if (!window.confirm("Remove exact duplicate leads with no activity attached?")) {
            event.preventDefault();
          }
        }}
      >
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-60"
        >
          {pending ? "Checking duplicates…" : "Clean up exact duplicates"}
        </button>
      </form>
      {state.error && <p className="mt-2 text-xs font-medium text-rose-700">{state.error}</p>}
      {typeof state.deleted === "number" && (
        <p className="mt-2 text-xs font-medium text-emerald-700">
          Removed {state.deleted} duplicate{state.deleted === 1 ? "" : "s"}.
          {state.skipped ? ` Kept ${state.skipped} duplicate with activity attached.` : ""}
        </p>
      )}
    </div>
  );
}