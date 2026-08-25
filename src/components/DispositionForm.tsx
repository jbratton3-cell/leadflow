"use client";

import { useState } from "react";
import { DISPOSITIONS } from "@/lib/constants";
import { logCall } from "@/lib/actions";

type RepOption = { id: number; name: string };

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400";
const label = "mb-1 block text-xs font-medium text-slate-600";

export default function DispositionForm({
  leadId,
  callReps,
  salesReps,
  defaultRepId,
  defaultSalesRepId,
  submitLabel = "Save Disposition",
}: {
  leadId: number;
  callReps: RepOption[];
  salesReps: RepOption[];
  defaultRepId?: number | null;
  defaultSalesRepId?: number | null;
  submitLabel?: string;
}) {
  const [disposition, setDisposition] = useState("");
  const showCallback = disposition === "callback";
  const showAppt = disposition === "appt_set";

  return (
    <form action={logCall} className="grid grid-cols-2 gap-3">
      <input type="hidden" name="leadId" value={leadId} />
      <div>
        <label className={label}>Disposition *</label>
        <select
          name="disposition"
          required
          className={input}
          value={disposition}
          onChange={(e) => setDisposition(e.target.value)}
        >
          <option value="">— Select —</option>
          {DISPOSITIONS.map((d) => (
            <option key={d.key} value={d.key}>
              {d.key === "appt_set" ? "Appointment" : d.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={label}>Rep</label>
        <select name="repId" className={input} defaultValue={defaultRepId ?? ""}>
          <option value="">— None —</option>
          {callReps.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* Callback scheduler — revealed for the Callback disposition */}
      {showCallback && (
        <div className="col-span-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <label className={label}>📞 Schedule Callback *</label>
          <input
            type="datetime-local"
            name="callbackAt"
            required
            className={input}
          />
          <p className="mt-1 text-xs text-amber-700">
            This lead will surface in the dial queue at the scheduled time.
          </p>
        </div>
      )}

      {/* Appointment scheduler — revealed for the Appointment disposition */}
      {showAppt && (
        <div className="col-span-2 grid grid-cols-2 gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="col-span-2 text-xs font-semibold text-blue-800">
            📅 Schedule Appointment
          </div>
          <div>
            <label className={label}>Date & Time *</label>
            <input
              type="datetime-local"
              name="scheduledAt"
              required
              className={input}
            />
          </div>
          <div>
            <label className={label}>Duration (min)</label>
            <input
              type="number"
              name="durationMin"
              defaultValue={90}
              className={input}
            />
          </div>
          <div className="col-span-2">
            <label className={label}>Sales Rep</label>
            <select
              name="salesRepId"
              className={input}
              defaultValue={defaultSalesRepId ?? ""}
            >
              <option value="">— Unassigned —</option>
              {salesReps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <p className="col-span-2 text-xs text-blue-700">
            Booking here moves the lead to “Appointment Set” and adds it to the
            sales calendar.
          </p>
        </div>
      )}

      <div className="col-span-2">
        <label className={label}>Notes</label>
        <textarea name="notes" rows={2} className={input} />
      </div>
      <div className="col-span-2">
        <button
          className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
            showAppt
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-slate-800 hover:bg-slate-700"
          }`}
        >
          {showAppt ? "Book Appointment" : submitLabel}
        </button>
      </div>
    </form>
  );
}
