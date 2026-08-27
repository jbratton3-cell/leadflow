"use client";

import { useState } from "react";
import { markEstimateStatus } from "@/lib/estimate-actions";

// Office-side "record a signed paper estimate" form. Checking financing hides
// the deposit-invoice option, since financed deals don't get deposit invoices.
export default function OfficeAcceptForm({ estimateId }: { estimateId: number }) {
  const [financing, setFinancing] = useState(false);

  return (
    <form
      action={markEstimateStatus}
      className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3"
    >
      <input type="hidden" name="id" value={estimateId} />
      <input type="hidden" name="status" value="accepted" />

      <label className="flex items-start gap-2 text-xs text-slate-600">
        <input
          type="checkbox"
          name="financing"
          checked={financing}
          onChange={(e) => setFinancing(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-amber-600"
        />
        <span>
          Customer chose financing
          <span className="block text-slate-400">
            The sale will be recorded as a financed deal
          </span>
        </span>
      </label>

      {!financing && (
        <label className="mt-2 flex items-start gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            name="sendDeposit"
            className="mt-0.5 h-4 w-4 accent-emerald-600"
          />
          <span>
            Also email the customer their 50% deposit invoice
            <span className="block text-slate-400">
              Leave unchecked if the deposit was already collected
            </span>
          </span>
        </label>
      )}

      <button className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
        Mark as Accepted
      </button>
    </form>
  );
}
