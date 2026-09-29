import { db } from "@/db";
import { documents } from "@/db/schema";
import { leads, callLogs, outreachLogs, appointments, sales, jobs, estimates, invoices, organizations, properties } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader, Card, Badge } from "@/components/ui";
import DispositionForm from "@/components/DispositionForm";
import OutreachForm from "@/components/OutreachForm";
import { getSources, getProducts, getReps, getSalesReps, getCallReps, toMap } from "@/lib/queries";
import { requireAccess } from "@/lib/auth";
import {
  stageLabel,
  stageColor,
  dispositionLabel,
  outreachChannelLabel,
  outreachOutcomeLabel,
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
  estimateStatusColor, personName, accountDisplayName, accountTypeLabel, orgHasEmailOutreach,
  serviceLocationAddress, serviceLocationLabel } from "@/lib/constants";
import {
  createAppointment,
  updateAppointmentStatus,
  createSale,
  createProperty,
  updateProperty,
  archiveProperty,
  createAccountJob,
  ensureOutreachTable,
} from "@/lib/actions";
import { createEstimate } from "@/lib/estimate-actions";
import { createManualFinalInvoice } from "@/lib/invoice-actions";
import { deleteLead } from "@/lib/delete-actions";
import DeleteButton from "@/components/DeleteButton";
import UploadDocument from "@/components/UploadDocument";
import { deleteDocument } from "@/lib/document-actions";

export const dynamic = "force-dynamic";

function fmtBytes(n: number | null | undefined): string {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400";
const label = "mb-1 block text-xs font-medium text-slate-600";

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ invoice?: string; location?: string }>;
}) {
  const { orgId } = await requireAccess("leads");

  const { id } = await params;
  const q = await searchParams;
  const leadId = Number(id);
  const [lead] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, leadId), eq(leads.orgId, orgId)))
    .limit(1);
  if (!lead) notFound();

  const [orgRow] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  const showOutreach = orgHasEmailOutreach(orgRow?.name, orgId);

  if (showOutreach) await ensureOutreachTable();

  const docs = await db
    .select()
    .from(documents)
    .where(and(eq(documents.orgId, orgId), eq(documents.leadId, leadId)))
    .orderBy(desc(documents.createdAt));

  const [calls, outreach, appts, saleRows, jobRows, estRows, invoiceRows, locationRows, sources, prods, allReps, salesReps, callReps] =
    await Promise.all([
      db.select().from(callLogs).where(and(eq(callLogs.orgId, orgId), eq(callLogs.leadId, leadId))).orderBy(desc(callLogs.createdAt)),
      showOutreach
        ? db.select().from(outreachLogs).where(and(eq(outreachLogs.orgId, orgId), eq(outreachLogs.leadId, leadId))).orderBy(desc(outreachLogs.createdAt))
        : Promise.resolve([]),
      db.select().from(appointments).where(and(eq(appointments.orgId, orgId), eq(appointments.leadId, leadId))).orderBy(desc(appointments.scheduledAt)),
      db.select().from(sales).where(and(eq(sales.orgId, orgId), eq(sales.leadId, leadId))).orderBy(desc(sales.soldAt)),
      db.select().from(jobs).where(and(eq(jobs.orgId, orgId), eq(jobs.leadId, leadId))).orderBy(desc(jobs.createdAt)),
      db.select().from(estimates).where(and(eq(estimates.orgId, orgId), eq(estimates.leadId, leadId))).orderBy(desc(estimates.createdAt)),
      db.select().from(invoices).where(and(eq(invoices.orgId, orgId), eq(invoices.leadId, leadId))).orderBy(desc(invoices.createdAt)),
      db.select().from(properties).where(and(eq(properties.orgId, orgId), eq(properties.leadId, leadId))).orderBy(desc(properties.active), properties.name),
      getSources(),
      getProducts(),
      getReps(),
      getSalesReps(),
      getCallReps(),
    ]);

  const repMap = toMap(allReps);
  const srcMap = toMap(sources);
  const prodMap = toMap(prods);
  const locationMap = new Map(locationRows.map((location) => [location.id, location]));
  const activeLocations = locationRows.filter((location) => location.active);
  const billingName = accountDisplayName(
    lead.firstName,
    lead.lastName,
    lead.company,
    lead.accountType,
  );
  const billingContact = personName(lead.firstName, lead.lastName, "");
  const isPropertyAccount = lead.accountType === "property_management";
  const openAppt = appts.find((a) => a.status === "set" || a.status === "confirmed");
  const activeFinalInvoice = invoiceRows.find(
    (invoice) => invoice.kind === "final" && invoice.status !== "void",
  );
  const depositTotal = invoiceRows
    .filter((invoice) => invoice.kind === "deposit" && invoice.status !== "void")
    .reduce((sum, invoice) => sum + Number(invoice.amount), 0);
  const recordedDepositContract = invoiceRows.find(
    (invoice) =>
      invoice.kind === "deposit" &&
      invoice.status !== "void" &&
      Number(invoice.contractTotal) > 0,
  )?.contractTotal;
  const suggestedContractTotal = Number(
    recordedDepositContract ?? saleRows[0]?.amount ?? estRows[0]?.total ?? 0,
  );
  const suggestedFinalAmount = Math.max(suggestedContractTotal - depositTotal, 0);
  const jobsWithoutFinal = jobRows.filter(
    (job) =>
      !invoiceRows.some(
        (invoice) =>
          invoice.kind === "final" &&
          invoice.status !== "void" &&
          invoice.jobId === job.id,
      ),
  );
  const amountRemainingForJob = (job: (typeof jobRows)[number]) => {
    const relatedInvoices = invoiceRows.filter(
      (invoice) =>
        invoice.status !== "void" &&
        (invoice.jobId === job.id ||
          (job.saleId != null && invoice.saleId === job.saleId)),
    );
    const contractTotal = Number(
      relatedInvoices.find((invoice) => Number(invoice.contractTotal) > 0)?.contractTotal ??
        job.contractAmount ??
        0,
    );
    const alreadyInvoiced = relatedInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.amount),
      0,
    );
    return {
      contractTotal,
      remaining: Math.max(contractTotal - alreadyInvoiced, 0),
    };
  };

  return (
    <div>
      <PageHeader
        title={billingName}
        subtitle={
          lead.address
            ? `${lead.address}, ${lead.city ?? ""} ${lead.state ?? ""} ${lead.zip ?? ""}`
            : "No address on file"
        }
        action={
          <div className="flex items-center gap-2">
            <Badge className={stageColor(lead.stage)}>{stageLabel(lead.stage)}</Badge>
            <Badge className="bg-slate-100 text-slate-700">{accountTypeLabel(lead.accountType)}</Badge>
            {lead.standingContract && (
              <Badge className="bg-cyan-100 text-cyan-700">Standing Contract</Badge>
            )}
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
                confirmText={`Delete ${billingName} and EVERYTHING attached (service locations, estimates, sales, jobs, invoices)? This cannot be undone.`}
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
              <Info label={isPropertyAccount ? "Billing Company" : "Company"} value={lead.company} />
              {isPropertyAccount && <Info label="Primary Contact" value={billingContact} />}
              <Info label="Phone" value={lead.phone} />
              <Info label="Alt Phone" value={lead.altPhone} />
              <Info label="Email" value={lead.email} />
              <Info label="Product" value={lead.productId ? prodMap.get(lead.productId)?.name : null} />
              <Info label="Source" value={lead.sourceId ? srcMap.get(lead.sourceId)?.name : null} />
              <Info label="Assigned Rep" value={lead.assignedRepId ? repMap.get(lead.assignedRepId)?.name : null} />
              <Info label="Account Type" value={accountTypeLabel(lead.accountType)} />
              <Info label="Contract Pattern" value={lead.standingContract ? "Standing / recurring" : "Project / one-time"} />
              <Info label="Est. Value" value={money(lead.estimatedValue)} />
              <Info label="Created" value={fmtDate(lead.createdAt)} />
            </dl>
            {lead.notes && (
              <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{lead.notes}</div>
            )}
          </Card>

          {isPropertyAccount && (
            <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">Service Locations</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Estimates and invoices are billed to {billingName}. Residents and site
                    contacts identify where the work is performed and do not become separate prospects.
                  </p>
                </div>
                <Badge className="bg-cyan-100 text-cyan-800">
                  {activeLocations.length} active
                </Badge>
              </div>

              {q.location === "required" && (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Choose a service location before creating this account&apos;s estimate.
                </p>
              )}
              {q.location === "invalid" && (
                <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  That service location is no longer available. Choose an active location below.
                </p>
              )}

              <div className="mt-4 space-y-3">
                {activeLocations.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                    Add the first address, resident, or community below. Once saved, you can
                    create either an estimate or an immediate work order from the same location.
                  </div>
                )}
                {activeLocations.map((location) => {
                  const locationLabel = serviceLocationLabel(location);
                  const locationAddress = serviceLocationAddress(location);
                  return (
                    <div key={location.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-800">{locationLabel}</div>
                          <div className="mt-0.5 text-sm text-slate-600">{locationAddress}</div>
                          {location.propertyName && location.contactName && (
                            <div className="mt-1 text-xs text-slate-500">
                              Resident / site contact: {location.contactName}
                            </div>
                          )}
                          {(location.contactPhone || location.contactEmail) && (
                            <div className="text-xs text-slate-500">
                              {[location.contactPhone, location.contactEmail].filter(Boolean).join(" · ")}
                            </div>
                          )}
                          {location.notes && (
                            <div className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-slate-600">
                              Access: {location.notes}
                            </div>
                          )}
                        </div>
                        <form action={createEstimate}>
                          <input type="hidden" name="leadId" value={lead.id} />
                          <input type="hidden" name="propertyId" value={location.id} />
                          <input type="hidden" name="unitNumber" value={location.unitNumber ?? ""} />
                          <input type="hidden" name="title" value="Project Estimate" />
                          <button className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600">
                            + Estimate
                          </button>
                        </form>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-200 pt-3">
                        <details className="min-w-[250px] flex-1 rounded-lg border border-slate-200 bg-white">
                          <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-cyan-700">
                            + Immediate Work Order
                          </summary>
                          <form action={createAccountJob} className="grid gap-3 border-t border-slate-100 p-3 sm:grid-cols-2">
                            <input type="hidden" name="leadId" value={lead.id} />
                            <input type="hidden" name="propertyId" value={location.id} />
                            <div>
                              <label className={label}>Service / Product</label>
                              <input
                                name="productName"
                                defaultValue={lead.productId ? prodMap.get(lead.productId)?.name ?? "" : ""}
                                className={input}
                              />
                            </div>
                            <div>
                              <label className={label}>Unit</label>
                              <input name="unitNumber" defaultValue={location.unitNumber ?? ""} className={input} />
                            </div>
                            <div>
                              <label className={label}>Work Order Amount ($)</label>
                              <input name="contractAmount" type="number" min="0" step="0.01" className={input} />
                              <p className="mt-1 text-[11px] text-slate-400">Optional now; it can be added in Production before completion.</p>
                            </div>
                            <div className="sm:col-span-2">
                              <label className={label}>Work Requested / Notes</label>
                              <textarea name="notes" rows={2} required className={input} />
                            </div>
                            <div className="sm:col-span-2">
                              <button className="rounded-lg bg-cyan-700 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-800">
                                Create Work Order
                              </button>
                            </div>
                          </form>
                        </details>

                        <details className="min-w-[250px] flex-1 rounded-lg border border-slate-200 bg-white">
                          <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-slate-600">
                            Edit Location
                          </summary>
                          <form action={updateProperty} className="grid gap-3 border-t border-slate-100 p-3 sm:grid-cols-2">
                            <input type="hidden" name="id" value={location.id} />
                            <input type="hidden" name="leadId" value={lead.id} />
                            <div>
                              <label className={label}>Property / Community (optional)</label>
                              <input name="propertyName" defaultValue={location.propertyName ?? ""} className={input} />
                            </div>
                            <div>
                              <label className={label}>Resident / Site Contact (optional)</label>
                              <input name="contactName" defaultValue={location.contactName ?? ""} className={input} />
                            </div>
                            <div className="sm:col-span-2">
                              <label className={label}>Street Address *</label>
                              <input name="address" required defaultValue={location.address ?? ""} className={input} />
                            </div>
                            <div>
                              <label className={label}>City</label>
                              <input name="city" defaultValue={location.city ?? ""} className={input} />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className={label}>State</label>
                                <input name="state" defaultValue={location.state ?? ""} className={input} />
                              </div>
                              <div>
                                <label className={label}>ZIP</label>
                                <input name="zip" defaultValue={location.zip ?? ""} className={input} />
                              </div>
                              <div>
                                <label className={label}>Unit</label>
                                <input name="unitNumber" defaultValue={location.unitNumber ?? ""} className={input} />
                              </div>
                            </div>
                            <div>
                              <label className={label}>Site Phone</label>
                              <input name="contactPhone" defaultValue={location.contactPhone ?? ""} className={input} />
                            </div>
                            <div>
                              <label className={label}>Site Email</label>
                              <input name="contactEmail" type="email" defaultValue={location.contactEmail ?? ""} className={input} />
                            </div>
                            <div className="sm:col-span-2">
                              <label className={label}>Access Instructions / Notes</label>
                              <textarea name="notes" rows={2} defaultValue={location.notes ?? ""} className={input} />
                            </div>
                            <div className="flex flex-wrap gap-2 sm:col-span-2">
                              <button className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700">
                                Save Location
                              </button>
                            </div>
                          </form>
                          <form action={archiveProperty} className="border-t border-slate-100 p-3">
                            <input type="hidden" name="id" value={location.id} />
                            <input type="hidden" name="leadId" value={lead.id} />
                            <button className="text-xs font-medium text-rose-600 hover:underline">
                              Archive this location
                            </button>
                          </form>
                        </details>
                      </div>
                    </div>
                  );
                })}
              </div>

              <details className="mt-4 rounded-xl border border-dashed border-cyan-300 bg-cyan-50/40">
                <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-cyan-800">
                  + Add Service Location
                </summary>
                <form action={createProperty} className="grid gap-3 border-t border-cyan-100 p-4 sm:grid-cols-2">
                  <input type="hidden" name="leadId" value={lead.id} />
                  <div>
                    <label className={label}>Property / Community Name (optional)</label>
                    <input name="propertyName" placeholder="Dutch Village" className={input} />
                  </div>
                  <div>
                    <label className={label}>Resident / Site Contact (optional)</label>
                    <input name="contactName" placeholder="Jane Resident" className={input} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={label}>Street Address *</label>
                    <input name="address" required placeholder="123 Main Street" className={input} />
                    <p className="mt-1 text-[11px] text-slate-500">
                      If there is no property name, LeadFlow will label this location by the resident/site contact or address.
                    </p>
                  </div>
                  <div>
                    <label className={label}>City</label>
                    <input name="city" className={input} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className={label}>State</label>
                      <input name="state" defaultValue="NY" className={input} />
                    </div>
                    <div>
                      <label className={label}>ZIP</label>
                      <input name="zip" className={input} />
                    </div>
                    <div>
                      <label className={label}>Unit</label>
                      <input name="unitNumber" className={input} />
                    </div>
                  </div>
                  <div>
                    <label className={label}>Site Phone</label>
                    <input name="contactPhone" className={input} />
                  </div>
                  <div>
                    <label className={label}>Site Email</label>
                    <input name="contactEmail" type="email" className={input} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={label}>Access Instructions / Notes</label>
                    <textarea name="notes" rows={2} className={input} />
                  </div>
                  <div className="sm:col-span-2">
                    <button className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800">
                      Save Service Location
                    </button>
                  </div>
                </form>
              </details>

              {locationRows.some((location) => !location.active) && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-medium text-slate-500">
                    View archived locations ({locationRows.filter((location) => !location.active).length})
                  </summary>
                  <ul className="mt-2 space-y-1 text-xs text-slate-500">
                    {locationRows.filter((location) => !location.active).map((location) => (
                      <li key={location.id}>
                        {serviceLocationLabel(location)} · {serviceLocationAddress(location)}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </Card>
          )}

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

          {showOutreach && (
          <Card className="p-5">
            <details open={lead.stage === "new" || lead.stage === "contacting"}>
              <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                ✉️ Log Email / Message
              </summary>
              <div className="mt-4">
                <OutreachForm
                  leadId={lead.id}
                  reps={[...callReps, ...salesReps.filter((s) => !callReps.some((c) => c.id === s.id))]}
                  defaultRepId={lead.assignedRepId}
                />
              </div>
            </details>
          </Card>
          )}

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
                  {isPropertyAccount && (
                    <div className="col-span-2">
                      <label className={label}>Service Location *</label>
                      <select name="propertyId" required defaultValue="" className={input}>
                        <option value="" disabled>Choose a service location</option>
                        {activeLocations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {serviceLocationLabel(location)} — {serviceLocationAddress(location)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
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
          {/* Documents & scans */}
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Documents &amp; Scans</h2>
            <UploadDocument leadId={lead.id} />
            <div className="mt-3 space-y-2">
              {docs.length === 0 && (
                <p className="text-xs text-slate-400">
                  No documents yet. Scan the paper estimate with your phone and upload
                  the PDF here.
                </p>
              )}
              {docs.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2"
                >
                  <a
                    href={d.url}
                    target="_blank"
                    className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700 hover:text-orange-600"
                    title={d.fileName}
                  >
                    📄 {d.fileName}
                    <span className="ml-1 font-normal text-slate-400">
                      {fmtBytes(d.sizeBytes)}
                    </span>
                  </a>
                  <form action={deleteDocument}>
                    <input type="hidden" name="id" value={d.id} />
                    <input type="hidden" name="leadId" value={lead.id} />
                    <button className="text-xs font-medium text-rose-500 hover:underline">
                      Remove
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </Card>
          {/* Estimates */}
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Estimates</h2>
              {isPropertyAccount ? (
                activeLocations.length > 0 && (
                  <form action={createEstimate} className="flex items-center gap-2">
                    <input type="hidden" name="leadId" value={lead.id} />
                    <input type="hidden" name="title" value="Project Estimate" />
                    <select name="propertyId" required defaultValue="" className="max-w-44 rounded-lg border border-slate-300 px-2 py-1 text-xs">
                      <option value="" disabled>Choose location…</option>
                      {activeLocations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {serviceLocationLabel(location)}
                        </option>
                      ))}
                    </select>
                    <button className="rounded-lg bg-orange-500 px-3 py-1 text-xs font-semibold text-white hover:bg-orange-600">
                      + Estimate
                    </button>
                  </form>
                )
              ) : (
                <form action={createEstimate}>
                  <input type="hidden" name="leadId" value={lead.id} />
                  <input type="hidden" name="title" value="Project Estimate" />
                  <button className="rounded-lg bg-orange-500 px-3 py-1 text-xs font-semibold text-white hover:bg-orange-600">
                    + New Estimate
                  </button>
                </form>
              )}
            </div>
            {estRows.length === 0 ? (
              <p className="text-sm text-slate-400">
                No estimates yet. Create one, add line items, then send it to the customer.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {estRows.map((e) => (
                  <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <Link href={`/estimates/${e.id}`} className="font-medium text-slate-700 hover:text-orange-600">
                        {e.number}
                      </Link>
                      {e.propertyId && locationMap.get(e.propertyId) && (
                        <div className="text-xs text-slate-400">
                          {serviceLocationLabel(locationMap.get(e.propertyId))}
                        </div>
                      )}
                    </div>
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

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Invoices</h2>
              <Link href="/invoices" className="text-xs font-medium text-orange-600 hover:underline">
                View all
              </Link>
            </div>
            {invoiceRows.length === 0 ? (
              <p className="text-sm text-slate-400">No invoices for this customer yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {invoiceRows.map((invoice) => (
                  <li key={invoice.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <div>
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="font-medium text-slate-700 hover:text-orange-600"
                      >
                        {invoice.number}
                      </Link>
                      {invoice.propertyId && locationMap.get(invoice.propertyId) && (
                        <div className="text-xs text-slate-400">
                          {serviceLocationLabel(locationMap.get(invoice.propertyId))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">{money(invoice.amount)}</span>
                      <Badge
                        className={
                          invoice.status === "paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : invoice.status === "void"
                              ? "bg-rose-100 text-rose-600"
                              : invoice.status === "financed"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-600"
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {q.invoice === "invalid" && (
              <p className="mt-3 text-sm text-rose-600">
                Enter a valid final payment amount and project total.
              </p>
            )}
            {q.invoice === "job-required" && (
              <p className="mt-3 text-sm text-rose-600">
                Choose the specific work order before creating a final invoice.
              </p>
            )}
            {isPropertyAccount ? (
              jobsWithoutFinal.length > 0 && (
                <details className="mt-4 rounded-lg border border-slate-200">
                  <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-slate-700">
                    + Create Final Invoice for a Work Order
                  </summary>
                  <div className="space-y-3 border-t border-slate-100 p-3">
                    {jobsWithoutFinal.map((job) => {
                      const location = job.propertyId ? locationMap.get(job.propertyId) : null;
                      const totals = amountRemainingForJob(job);
                      return (
                        <details key={job.id} className="rounded-lg border border-slate-200 bg-slate-50">
                          <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-slate-700">
                            {location ? serviceLocationLabel(location) : `Work order #${job.id}`}
                            {job.unitNumber ? ` · Unit ${job.unitNumber}` : ""}
                          </summary>
                          <form action={createManualFinalInvoice} className="grid gap-3 border-t border-slate-200 bg-white p-3">
                            <input type="hidden" name="leadId" value={lead.id} />
                            <input type="hidden" name="jobId" value={job.id} />
                            <div>
                              <label className={label}>Final Payment Amount ($) *</label>
                              <input
                                type="number"
                                name="amount"
                                min="0.01"
                                step="0.01"
                                required
                                defaultValue={totals.remaining > 0 ? totals.remaining.toFixed(2) : ""}
                                className={input}
                              />
                            </div>
                            <div>
                              <label className={label}>Project Total ($) *</label>
                              <input
                                type="number"
                                name="contractTotal"
                                min="0.01"
                                step="0.01"
                                required
                                defaultValue={totals.contractTotal > 0 ? totals.contractTotal.toFixed(2) : ""}
                                className={input}
                              />
                            </div>
                            <button className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600">
                              Create Draft Final Invoice
                            </button>
                          </form>
                        </details>
                      );
                    })}
                  </div>
                </details>
              )
            ) : (
              !activeFinalInvoice && (
                <details className="mt-4 rounded-lg border border-slate-200">
                  <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-slate-700">
                    + Create Final Invoice
                  </summary>
                  <form action={createManualFinalInvoice} className="grid gap-3 border-t border-slate-100 p-3">
                    <input type="hidden" name="leadId" value={lead.id} />
                    <div>
                      <label className={label}>Final Payment Amount ($) *</label>
                      <input
                        type="number"
                        name="amount"
                        min="0.01"
                        step="0.01"
                        required
                        defaultValue={suggestedFinalAmount > 0 ? suggestedFinalAmount.toFixed(2) : ""}
                        className={input}
                      />
                    </div>
                    <div>
                      <label className={label}>Updated Project Total ($) *</label>
                      <input
                        type="number"
                        name="contractTotal"
                        min="0.01"
                        step="0.01"
                        required
                        defaultValue={suggestedContractTotal > 0 ? suggestedContractTotal.toFixed(2) : ""}
                        className={input}
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      This creates a draft final invoice. Review and send it from the invoice page.
                    </p>
                    <button className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600">
                      Create Draft Final Invoice
                    </button>
                  </form>
                </details>
              )
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
              <div className="space-y-3">
                {jobRows.map((j) => {
                  const location = j.propertyId ? locationMap.get(j.propertyId) : null;
                  return (
                    <div key={j.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={jobStatusColor(j.status)}>{jobStatusLabel(j.status)}</Badge>
                        {location && (
                          <span className="font-medium text-slate-700">
                            {serviceLocationLabel(location)}{j.unitNumber ? ` · Unit ${j.unitNumber}` : ""}
                          </span>
                        )}
                      </div>
                      {location && (
                        <div className="mt-1 text-xs text-slate-500">
                          {serviceLocationAddress(location, j.unitNumber)}
                        </div>
                      )}
                      {j.crew && <div className="mt-2 text-slate-600">Crew: {j.crew}</div>}
                      {j.startDate && <div className="text-xs text-slate-400">Start: {fmtDate(j.startDate)}</div>}
                      <Link href="/production" className="mt-2 inline-block text-xs font-medium text-orange-600 hover:underline">
                        Manage in Production →
                      </Link>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              {showOutreach ? "Contact History" : "Call History"}
            </h2>
            {calls.length === 0 && outreach.length === 0 ? (
              <p className="text-sm text-slate-400">
                {showOutreach ? "No calls or messages logged." : "No calls logged."}
              </p>
            ) : (
              <ul className="space-y-3">
                {[
                  ...calls.map((c) => ({
                    kind: "call" as const,
                    at: c.createdAt,
                    id: `c${c.id}`,
                    title: `Call · ${dispositionLabel(c.disposition)}`,
                    notes: c.notes,
                    extra: c.callbackAt ? `Callback: ${fmtDateTime(c.callbackAt)}` : null,
                    repId: c.repId,
                  })),
                  ...outreach.map((o) => ({
                    kind: "msg" as const,
                    at: o.createdAt,
                    id: `o${o.id}`,
                    title: `${outreachChannelLabel(o.channel)} · ${outreachOutcomeLabel(o.outcome)}`,
                    notes: o.notes,
                    extra: o.followUpAt ? `Follow up: ${fmtDateTime(o.followUpAt)}` : null,
                    repId: o.repId,
                  })),
                ]
                  .sort((a, b) => +new Date(b.at) - +new Date(a.at))
                  .map((row) => (
                    <li
                      key={row.id}
                      className={`border-l-2 pl-3 text-sm ${row.kind === "call" ? "border-slate-200" : "border-orange-200"}`}
                    >
                      <div className="font-medium text-slate-700">{row.title}</div>
                      {row.notes && <div className="text-slate-500">{row.notes}</div>}
                      {row.extra && <div className="text-xs text-amber-600">{row.extra}</div>}
                      <div className="text-xs text-slate-400">
                        {fmtDateTime(row.at)}
                        {row.repId && ` · ${repMap.get(row.repId)?.name ?? ""}`}
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
