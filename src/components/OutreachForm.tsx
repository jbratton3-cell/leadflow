"use client";

import { useState } from "react";
import { OUTREACH_CHANNELS, OUTREACH_OUTCOMES } from "@/lib/constants";
import { logOutreach } from "@/lib/actions";

type RepOption = { id: number; name: string };

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400";
const label = "mb-1 block text-xs font-medium text-slate-600";

export default function OutreachForm({
  leadId,
  reps,
  defaultRepId,
}: {
  leadId: number;
  reps: RepOption[];
  defaultRepId?: number | null;
}) {
  const [outcome, setOutcome] = useState("");
  const showFollowUp = outcome === "follow_up";

  return (
    <form action={logOutreach} className="grid grid-cols-2 gap-3">
      <input type="hidden" name="leadId" value={leadId} />
      <div>
        <label className={label}>Channel *</label>
        <select name="channel" required className={input} defaultValue="email">
          {OUTREACH_CHANNELS.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={label}>Outcome *</label>
        <select
          name="outcome"
          required
          className={input}
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
        >
          <option value="">— Select —</option>
          {OUTREACH_OUTCOMES.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-2">
        <label className={label}>Rep</label>
        <select name="repId" className={input} defaultValue={defaultRepId ?? ""}>
          <option value="">— None —</option>
          {reps.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      {showFollowUp && (
        <div className="col-span-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <label className={label}>Follow up *</label>
          <input type="datetime-local" name="followUpAt" required className={input} />
        </div>
      )}
      <div className="col-span-2">
        <label className={label}>Notes</label>
        <textarea name="notes" rows={2} className={input} />
      </div>
      <div className="col-span-2">
        <button className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
          Save email / message
        </button>
      </div>
    </form>
  );
}
