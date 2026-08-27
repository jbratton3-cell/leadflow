import { db } from "@/db";
import { leads, callLogs, appointments, sales, jobs, estimates } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader, Card, Badge } from "@/components/ui";
import DispositionForm from "@/components/DispositionForm";
import { getSources, getProducts, getReps, getSalesReps, getCallReps, toMap } from "@/lib/queries";
import { requireAccess } from "@/lib/auth";
import {
  stageLabel,
  stageColor,
  dispositionLabel,
  apptStatusLabel,
  apptStatusColor,
  jobStatusLabel,
  jobStatusColor,
  money,
  fmtDate,
  fmtDateTime,
  APPT_RESULTS,
  FINANCE_TYPES,
  estimateStatusLabel,
  estimateStatusColor, personName } from "@/lib/constants";
import {
  createAppointment,
  updateAppointmentStatus,
  createSale,
} from "@/lib/actions";
import { createEstimate } from "@/lib/estimate-actions";
import { deleteLead } from "@/lib/delete-actions";
import DeleteButton from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400";
const label = "mb-1 block text-xs font-medium text-slate-600";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { orgId } = await requireAccess("leads");
  const { id } = await params;
  const leadId = Number(id);
  const [lead] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, leadId), eq(leads.orgId, orgId)))
    .limit(1);
  if (!lead) notFound();

  const [calls, appts, saleRows, jobRows, estRows, sources, prods, allReps, salesReps, callReps] =
    await Promise.all([
      db.select().from(callLogs).where(and(eq(callLogs.orgId, orgId), eq(callLogs.leadId, leadId))).orderBy(desc(callLogs.createdAt)),
      db.select().from(appointments).where(and(eq(appointments.orgId, orgId), eq(appointments.leadId, leadId))).orderBy(desc(appointments.scheduledAt)),
      db.select().from(sales).where(and(eq(sales.orgId, orgId), eq(sales.leadId, leadId))).orderBy(desc(sales.soldAt)),
      db.select().from(jobs).where(and(eq(jobs.orgId, orgId), eq(jobs.leadId, leadId))).orderBy(desc(jobs.createdAt)),
      db.select().from(estimates).where(and(eq(estimates.orgId, orgId), eq(estimates.leadId, leadId))).orderBy(desc(estimates.createdAt)),
      getSources(),
      getProducts(),
      getReps(),
      getSalesReps(),
      getCallReps(),
    ]);

  const repMap = toMap(allReps);
  const srcMap = toMap(sources);
  const prodMap = toMap(prods);
  const openAppt = appts.find((a) => a.status === "set" || a.status === "confirmed");

  return (
    <div>
      <PageHeader
        title={personName(lead.firstName, lead.lastName)}
        subtitle={
          lead.address
            ? `${lead.address}, ${lead.city ?? ""} ${lead.state ?? ""} ${lead.zip ?? ""}`
            : "No address on file"
        }
        action={
          <div className="flex items-center gap-2">
            <Badge className={stageColor(lead.stage)}>{stageLabel(lead.stage)}</Badge>
            {lead.doNotCall && <Badge className="bg-rose-100 text-rose-700">Do Not Call</Badge>}
            <Link
              href={`/leads/${lead.id}/edit`}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Edit
            </Link>
            <form action={deleteLead}>
              <input type="hidden" name="id" value={lead.id} />
              <DeleteButton
                label="Delete"
                confirmText={`Delete ${personName(lead.firstName, lead.lastName)} and EVERYTHING attached (estimates, sales, jobs, invoices)? This cannot be undone.`}
                className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
              />
            </form>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: contact + action panels */}
        <div className="space-y-6 lg:col-span-2">
          {/* Contact info */}
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Contact</h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <Info label="Phone" value={lead.phone} />
              <Info label="Alt Phone" value={lead.altPhone} />
              <Info label="Email" value={lead.email} />
              <Info label="Product" value={lead.productId ? prodMap.get(lead.productId)?.name : null} />
              <Info label="Source" value={lead.sourceId ? srcMap.get(lead.sourceId)?.name : null} />
              <Info label="Assigned Rep" value={lead.assignedRepId ? repMap.get(lead.assignedRepId)?.name : null} />
              <Info label="Est. Value" value={money(lead.estimatedValue)} />
              <Info label="Created" value={fmtDate(lead.createdAt)} />
            </dl>
            {lead.notes && (
              <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{lead.notes}</div>
            )}
          </Card>

          {/* Action: Log Call */}
          <Card className="p-5">
            <details open={lead.stage === "new" || lead.stage === "contacting"}>
              <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                📞 Log Call / Disposition
              </summary>
              <div className="mt-4">
                <DispositionForm
                  leadId={lead.id}
                  callReps={callReps}
                  salesReps={salesReps}
                  defaultRepId={lead.assignedRepId}
                  defaultSalesRepId={lead.assignedRepId}
                />
              </div>
            </details>
          </Card>

          {/* Action: Set Appointment */}
          <Card className="p-5">
            <details open={lead.stage === "contacting"}>
              <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                📅 Set Appointment
              </summary>
              <form action={createAppointment} className="mt-4 grid grid-cols-2 gap-3">
                <input type="hidden" name="leadId" value={lead.id} />
                <div>
                  <label className={label}>Date & Time *</label>
                  <input type="datetime-local" name="scheduledAt" required className={input} />
                </div>
                <div>
                  <label className={label}>Duration (min)</label>
                  <input type="number" name="durationMin" defaultValue={90} className={input} />
                </div>
                <div>
                  <label className={label}>Sales Rep</label>
                  <select name="salesRepId" className={input} defaultValue="">
                    <option value="">— Unassigned —</option>
                    {salesReps.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={label}>Set By</label>
                  <select name="setById" className={input} defaultValue={lead.assignedRepId ?? ""}>
                    <option value="">— None —</option>
                    {callReps.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={label}>Notes</label>
                  <textarea name="notes" rows={2} className={input} />
                </div>
                <div className="col-span-2">
                  <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                    Book Appointment
                  </button>
                </div>
              </form>
            </details>
          </Card>

          {/* Action: Record Sale (if sat/confirmed) */}
          {(lead.stage === "sat" || lead.stage === "confirmed" || lead.stage === "appt_set") && saleRows.length === 0 && (
            <Card className="p-5 ring-1 ring-emerald-200">
              <details open={lead.stage === "sat"}>
                <summary className="cursor-pointer text-sm font-semibold text-emerald-700">
                  💰 Record Sale / Contract
                </summary>
                <form action={createSale} className="mt-4 grid grid-cols-2 gap-3">
                  <input type="hidden" name="leadId" value={lead.id} />
                  {openAppt && <input type="hidden" name="appointmentId" value={openAppt.id} />}
                  <div>
                    <label className={label}>Contract Amount ($) *</label>
                    <input type="number" step="0.01" name="amount" required className={input} />
                  </div>
                  <div>
                    <label className={label}>Sold Date</label>
                    <input type="datetime-local" name="soldAt" className={input} />
                  </div>
                  <div>
                    <label className={label}>Sales Rep</label>
                    <select name="salesRepId" className={input} defaultValue={openAppt?.salesRepId ?? ""}>
                      <option value="">— Select —</option>
                      {salesReps.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={label}>Product</label>
                    <select name="productId" className={input} defaultValue={lead.productId ?? ""}>
                      <option value="">— Select —</option>
                      {prods.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={label}>Finance Type</label>
                    <select name="financeType" className={input} defaultValue="cash">
                      {FINANCE_TYPES.map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className={label}>Notes</label>
                    <textarea name="notes" rows={2} className={input} />
                  </div>
                  <div className="col-span-2">
                    <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                      Record Sale
                    </button>
                  </div>
                </form>
              </details>
            </Card>
          )}

          {/* Appointments list */}
          {appts.length > 0 && (
            <Card className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Appointments</h2>
              <div className="space-y-3">
                {appts.map((a) => (
                  <div key={a.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-slate-700">
                        {fmtDateTime(a.scheduledAt)}
                        {a.salesRepId && (
                          <span className="ml-2 text-xs text-slate-400">
                            w/ {repMap.get(a.salesRepId)?.name}
                          </span>
                        )}
                      </div>
                      <Badge className={apptStatusColor(a.status)}>{apptStatusLabel(a.status)}</Badge>
                    </div>
                    {(a.status === "set" || a.status === "confirmed") && (
                      <form action={updateAppointmentStatus} className="mt-2 flex flex-wrap items-end gap-2">
                        <input type="hidden" name="id" value={a.id} />
                        <input type="hidden" name="leadId" value={lead.id} />
                        <select name="status" className="rounded-lg border border-slate-300 px-2 py-1 text-xs" defaultValue={a.status}>
                          <option value="confirmed">Confirmed</option>
                          <option value="sat">Sat (Demo Run)</option>
                          <option value="no_show">No Show</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="rescheduled">Rescheduled</option>
                        </select>
                        <select name="result" className="rounded-lg border border-slate-300 px-2 py-1 text-xs" defaultValue="">
                          <option value="">Result…</option>
                          {APPT_RESULTS.map((r) => (
                            <option key={r.key} value={r.key}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                        <button className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700">
                          Update
                        </button>
                      </form>
                    )}
                    {a.result && (
                      <div className="mt-1 text-xs text-slate-500">Result: {a.result}</div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right: timeline + sale/job summary */}
        <div className="space-y-6">
          {/* Estimates */}
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Estimates</h2>
              <form action={createEstimate}>
                <input type="hidden" name="leadId" value={lead.id} />
                <input type="hidden" name="title" value="Project Estimate" />
                <button className="rounded-lg bg-orange-500 px-3 py-1 text-xs font-semibold text-white hover:bg-orange-600">
                  + New Estimate
                </button>
              </form>
            </div>
            {estRows.length === 0 ? (
              <p className="text-sm text-slate-400">
                No estimates yet. Create one, add line items, then send it to the customer.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {estRows.map((e) => (
                  <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                    <Link href={`/estimates/${e.id}`} className="font-medium text-slate-700 hover:text-orange-600">
                      {e.number}
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">{money(e.total)}</span>
                      <Badge className={estimateStatusColor(e.status)}>
                        {estimateStatusLabel(e.status)}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {saleRows.length > 0 && (
            <Card className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Sale</h2>
              {saleRows.map((s) => (
                <div key={s.id} className="text-sm">
                  <div className="text-2xl font-bold text-emerald-600">{money(s.amount)}</div>
                  <div className="mt-1 text-slate-500">
                    {s.productId ? prodMap.get(s.productId)?.name : "—"} · {s.financeType}
                  </div>
                  <div className="text-xs text-slate-400">Sold {fmtDate(s.soldAt)}</div>
                </div>
              ))}
            </Card>
          )}

          {jobRows.length > 0 && (
            <Card className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Production Job</h2>
              {jobRows.map((j) => (
                <div key={j.id} className="text-sm">
                  <Badge className={jobStatusColor(j.status)}>{jobStatusLabel(j.status)}</Badge>
                  {j.crew && <div className="mt-2 text-slate-600">Crew: {j.crew}</div>}
                  {j.startDate && <div className="text-xs text-slate-400">Start: {fmtDate(j.startDate)}</div>}
                  <Link href="/production" className="mt-2 inline-block text-xs font-medium text-orange-600 hover:underline">
                    Manage in Production →
                  </Link>
                </div>
              ))}
            </Card>
          )}

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Call History</h2>
            {calls.length === 0 ? (
              <p className="text-sm text-slate-400">No calls logged.</p>
            ) : (
              <ul className="space-y-3">
                {calls.map((c) => (
                  <li key={c.id} className="border-l-2 border-slate-200 pl-3 text-sm">
                    <div className="font-medium text-slate-700">{dispositionLabel(c.disposition)}</div>
                    {c.notes && <div className="text-slate-500">{c.notes}</div>}
                    {c.callbackAt && (
                      <div className="text-xs text-amber-600">Callback: {fmtDateTime(c.callbackAt)}</div>
                    )}
                    <div className="text-xs text-slate-400">
                      {fmtDateTime(c.createdAt)}
                      {c.repId && ` · ${repMap.get(c.repId)?.name ?? ""}`}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-700">{value || "—"}</dd>
    </div>
  );
}
