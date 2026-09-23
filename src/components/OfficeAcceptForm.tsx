"use client";

import { useState } from "react";
import { markEstimateStatus } from "@/lib/estimate-actions";

type PaymentIntent = "cash" | "card" | "finance";

export default function OfficeAcceptForm({
  estimateId,
  listTotal,
  cashTotal,
  cashPct,
  cardPaymentsEnabled,
}: {
  estimateId: number;
  listTotal: string;
  cashTotal: string;
  cashPct: number;
  cardPaymentsEnabled: boolean;
}) {
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent>("cash");
  const financing = paymentIntent === "finance";

  return (
    <form
      action={markEstimateStatus}
      className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3"
    >
      <input type="hidden" name="id" value={estimateId} />
      <input type="hidden" name="status" value="accepted" />

      <label className="block text-xs font-medium text-slate-600">
        Customer&apos;s payment route
        <select
          name="paymentIntent"
          value={paymentIntent}
          onChange={(e) => setPaymentIntent(e.target.value as PaymentIntent)}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700"
        >
          <option value="cash">
            Cash / check {cashPct > 0 ? `(${cashTotal}, 50/50)` : `(${listTotal})`}
          </option>
          {cardPaymentsEnabled && (
            <option value="card">Card / PayPal ({listTotal}, 50/50)</option>
          )}
          <option value="finance">Financing ({listTotal})</option>
        </select>
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
              {paymentIntent === "card"
                ? "The invoice will include secure card and PayPal checkout"
                : "Leave unchecked if the cash/check deposit was already collected"}
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
