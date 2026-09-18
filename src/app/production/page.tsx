import { db } from "@/db";
import { hcpPayments, jobs, leads, properties, sales } from "@/db/schema";
import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import Link from "next/link";
import { PageHeader, Card, Badge, EmptyState, StatCard } from "@/components/ui";
import { deleteJob } from "@/lib/delete-actions";
import DeleteButton from "@/components/DeleteButton";
import { requireAccess } from "@/lib/auth";
import { organizations } from "@/db/schema";
import {
  updateJob,
  createJob,
  createProperty,
  markJobCompleted,
  recordFinancingSettlement,
} from "@/lib/actions";
import {
  JOB_STATUSES,
  JOB_MILESTONES,
  JOB_REQUIREMENTS,
  jobStatusLabel,
  jobStatusColor,
  money,
  fmtDate, fmtDateOnly } from "@/lib/constants";
import { withinContractAmount } from "@/lib/revenue";

export const dynamic = "force-dynamic";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400";
const label = "mb-1 block text-xs font-medium text-slate-600";

function toDateInput(d: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

function financingStatusFor(
  financeType: string | null | undefined,
  jobStatus: string,
  settlement: { amount: string; receivedAt: Date | null } | undefined,
) {
  if (financeType !== "financed") return "not_financed";
  if (settlement) return "settled";
  return jobStatus === "completed" ? "awaiting_settlement" : "awaiting_completion";
}

function financingStatusLabel(status: string) {
  if (status === "awaiting_completion") return "Financed";
  if (status === "awaiting_settlement") return "Awaiting Wisetack";
  if (status === "settled") return "Wisetack Settled";
  return status;
}

export default async function ProductionPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { orgId } = await requireAccess("production");
  const { q: rawQuery } = await searchParams;
  const query = rawQuery?.trim() ?? "";
  const jobConditions: SQL[] = [eq(jobs.orgId, orgId)];
  if (query) {
    const like = `%${query}%`;
    jobConditions.push(
      or(
        ilike(leads.firstName, like),
        ilike(leads.lastName, like),
        ilike(leads.address, like),
        ilike(leads.city, like),
        ilike(leads.zip, like),
        ilike(leads.phone, like),
        ilike(jobs.customerName, like),
        ilike(jobs.customerAddress, like),
        ilike(jobs.customerCity, like),
        ilike(jobs.customerPhone, like),
        ilike(jobs.productName, like),
        ilike(jobs.crew, like),
        ilike(jobs.unitNumber, like),
        ilike(jobs.status, like),
        ilike(jobs.notes, like),
        ilike(properties.name, like),
      )!,
    );
  }
  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
  const isTrial = org?.plan === "trial";

  const [rows, propertyRows, propertyAccounts, settlementRows] = await Promise.all([
    db
      .select({
        job: jobs,
        firstName: leads.firstName,
        lastName: leads.lastName,
        city: leads.city,
        address: leads.address,
        amount: sales.amount,
        financeType: sales.financeType,
        propertyName: properties.name,
      })
      .from(jobs)
      .leftJoin(leads, eq(jobs.leadId, leads.id))
      .leftJoin(properties, eq(jobs.propertyId, properties.id))
      .leftJoin(sales, eq(jobs.saleId, sales.id))
      .where(and(...jobConditions))
      .orderBy(desc(jobs.createdAt))
      .limit(200),
    db
      .select({
        property: properties,
        accountFirstName: leads.firstName,
        accountLastName: leads.lastName,
      })
      .from(properties)
      .leftJoin(leads, eq(properties.leadId, leads.id))
      .where(and(eq(properties.orgId, orgId), eq(properties.active, true)))
      .orderBy(properties.name),
    db
      .select({ id: leads.id, firstName: leads.firstName, lastName: leads.lastName })
      .from(leads)
      .where(and(eq(leads.orgId, orgId), eq(leads.accountType, "property_management")))
      .orderBy(leads.lastName, leads.firstName),
    db
      .select({
        jobId: hcpPayments.jobId,
        amount: hcpPayments.amount,
        receivedAt: hcpPayments.receivedAt,
      })
      .from(hcpPayments)
      .where(
        and(
          eq(hcpPayments.orgId, orgId),
          eq(hcpPayments.paymentType, "Wisetack settlement"),
        ),
      ),
  ]);

  const settlementMap = new Map(
    settlementRows
      .filter((row) => row.jobId !== null)
      .map((row) => [row.jobId as number, row]),
  );

  // Resolve display fields from the linked lead/sale, or the manual job fields.
  const view = rows.map((r) => {
    const name = r.firstName
      ? `${r.firstName} ${r.lastName ?? ""}`.trim()
      : r.job.customerName ?? "(unnamed job)";
    const address = r.address ?? r.job.customerAddress ?? null;
    const city = r.city ?? r.job.customerCity ?? null;
    const amount = r.amount ?? r.job.contractAmount ?? 0;
    return {
      ...r,
      displayName: name,
      displayAddress: address,
      displayCity: city,
      displayAmount: amount,
      financeType: r.financeType,
      wisetackSettlement: settlementMap.get(r.job.id),
      financeStatus: financingStatusFor(
        r.financeType,
        r.job.status,
        settlementMap.get(r.job.id),
      ),
    };
  });

  const active = view.filter((r) => !["completed"].includes(r.job.status));
  const completed = view.filter((r) => r.job.status === "completed");
  const backlog = active.reduce((s, r) => s + Number(r.displayAmount ?? 0), 0);
  const financedView = view.filter((r) => r.financeType === "financed");
  const awaitingSettlement = financedView.filter(
    (r) => r.financeStatus === "awaiting_settlement",
  );
  const settledFinanced = financedView.filter((r) => r.financeStatus === "settled");
  const receivable = awaitingSettlement.reduce(
    (sum, r) => sum + Number(r.displayAmount ?? 0),
    0,
  );
  const settledAmount = settledFinanced.reduce(
    (sum, r) =>
      sum +
      withinContractAmount(
        Number(r.wisetackSettlement?.amount ?? 0),
        Number(r.displayAmount ?? 0),
      ),
    0,
  );

  return (
    <div>
      <PageHeader
        title="Production"
        subtitle="Track every job from contract to completion."
        action={
          !isTrial ? (
            <Link
              href="/board"
              target="_blank"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              📺 Open TV Job Board
            </Link>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <form className="flex gap-2" action="/production">
          <label className="sr-only" htmlFor="production-search">
            Search production jobs
          </label>
          <input
            id="production-search"
            name="q"
            defaultValue={query}
            placeholder="Search customer, address, product, crew…"
            className="w-72 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-orange-400"
          />
          <button className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
            Search
          </button>
          {query && (
            <Link
              href="/production"
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Clear
            </Link>
          )}
        </form>
        <span className="text-xs text-slate-500">
          {query ? `Showing jobs matching “${query}”` : "Search all production jobs"}
        </span>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Active Jobs" value={active.length} accent="text-cyan-600" />
        <StatCard label="Completed" value={completed.length} accent="text-green-600" />
        <StatCard label="Backlog Value" value={money(backlog)} accent="text-orange-600" />
        <StatCard label="Total Jobs" value={view.length} />
      </div>

      {financedView.length > 0 && (
        <Card className="mb-6 border-amber-200 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Wisetack settlements
              </h2>
              <p className="mt-1 max-w-2xl text-xs text-slate-500">
                Completed financed jobs become receivables from Wisetack. Record the
                settlement when the funds arrive; do not mark the customer as paying again.
              </p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>
                Awaiting:{" "}
                <strong className="text-amber-700">{money(receivable)}</strong>
              </div>
              <div>
                Settled:{" "}
                <strong className="text-emerald-700">{money(settledAmount)}</strong>
              </div>
            </div>
          </div>

          {awaitingSettlement.length === 0 ? (
            <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              No completed financed jobs are waiting for a Wisetack settlement.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {awaitingSettlement.map((r) => (
                <div
                  key={r.job.id}
                  className="rounded-lg border border-amber-100 bg-amber-50/60 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-800">{r.displayName}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        Expected from Wisetack:{" "}
                        <strong>
                          {money(r.displayAmount ?? 0)}
                        </strong>
                        {r.displayAddress ? ` · ${r.displayAddress}` : ""}
                      </div>
                    </div>
                    <Badge className="bg-amber-100 text-amber-800">
                      Awaiting Wisetack
                    </Badge>
                  </div>
                  <form
                    action={recordFinancingSettlement}
                    className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_1.4fr_auto]"
                  >
                    <input type="hidden" name="id" value={r.job.id} />
                    <label className="sr-only" htmlFor={`settlement-amount-${r.job.id}`}>
                      Settlement amount
                    </label>
                    <input
                      id={`settlement-amount-${r.job.id}`}
                      name="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      defaultValue={r.displayAmount ?? ""}
                      placeholder="Amount received"
                      className={input}
                    />
                    <label className="sr-only" htmlFor={`settlement-date-${r.job.id}`}>
                      Settlement date
                    </label>
                    <input
                      id={`settlement-date-${r.job.id}`}
                      name="settledAt"
                      type="date"
                      required
                      defaultValue={new Date().toISOString().slice(0, 10)}
                      className={input}
                    />
                    <label className="sr-only" htmlFor={`settlement-reference-${r.job.id}`}>
                      Wisetack reference
                    </label>
                    <input
                      id={`settlement-reference-${r.job.id}`}
                      name="reference"
                      placeholder="Wisetack reference (optional)"
                      className={input}
                    />
                    <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                      Record settlement
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Card className="mb-6 p-5">
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">
            🏢 Add Property / Community
          </summary>
          <p className="mt-2 text-xs text-slate-400">
            Create a reusable community under a property-management account, such as Dutch Village under Albany Management.
          </p>
          <form action={createProperty} className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className={label}>Property-management account *</label>
              <select name="leadId" required className={input} defaultValue="">
                <option value="" disabled>Select an account</option>
                {propertyAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.firstName} {account.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Property / Community Name *</label>
              <input name="name" required placeholder="Dutch Village" className={input} />
            </div>
            <div>
              <label className={label}>Address</label>
              <input name="address" className={input} />
            </div>
            <div>
              <label className={label}>City</label>
              <input name="city" className={input} />
            </div>
            <div>
              <label className={label}>State</label>
              <input name="state" className={input} />
            </div>
            <div>
              <label className={label}>ZIP</label>
              <input name="zip" className={input} />
            </div>
            <div className="md:col-span-2">
              <button className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                Add Property
              </button>
            </div>
          </form>
        </details>
      </Card>

      {/* Add a job manually (for existing/scheduled jobs, no sale required) */}
      <Card className="mb-6 p-5">
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">
            ➕ Add Job Manually
          </summary>
          <p className="mt-2 text-xs text-slate-400">
            Use this for existing jobs that weren&apos;t created from a sale in the system.
          </p>
          <form action={createJob} className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className={label}>Customer Name *</label>
              <input name="customerName" required className={input} />
            </div>
            <div>
              <label className={label}>Phone</label>
              <input name="customerPhone" className={input} />
            </div>
            <div>
              <label className={label}>Address</label>
              <input name="customerAddress" className={input} />
            </div>
            <div>
              <label className={label}>City</label>
              <input name="customerCity" className={input} />
            </div>
            <div>
              <label className={label}>Product / Job Type</label>
              <input name="productName" placeholder="e.g. Windows, Roofing" className={input} />
            </div>
            <div>
              <label className={label}>Property / Community</label>
              <select name="propertyId" className={input} defaultValue="">
                <option value="">No property selected</option>
                {propertyRows.map(({ property, accountFirstName, accountLastName }) => (
                  <option key={property.id} value={property.id}>
                    {property.name} — {accountFirstName} {accountLastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Unit Number</label>
              <input name="unitNumber" placeholder="e.g. 2B" className={input} />
            </div>
            <div>
              <label className={label}>Contract Amount ($)</label>
              <input name="contractAmount" type="number" step="0.01" className={input} />
            </div>
            <div>
              <label className={label}>Status</label>
              <select name="status" defaultValue="pending" className={input}>
                {JOB_STATUSES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Crew</label>
              <input name="crew" className={input} />
            </div>
            <div>
              <label className={label}>Start Date</label>
              <input type="date" name="startDate" className={input} />
            </div>
            <div>
              <label className={label}>Completion Date</label>
              <input type="date" name="completionDate" className={input} />
            </div>
            <div className="md:col-span-2">
              <label className={label}>Notes</label>
              <textarea name="notes" rows={2} className={input} />
            </div>
            <div className="md:col-span-2">
              <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
                Add Job
              </button>
            </div>
          </form>
        </details>
      </Card>

      {view.length === 0 ? (
        <EmptyState
          message={
            query
              ? "No production jobs matched that search."
              : "No production jobs yet. Jobs are created automatically when a sale is recorded — or add one manually above."
          }
        />
      ) : (
        <div className="space-y-4">
          {view.map((r) => {
            let ms: Record<string, boolean> = {};
            try {
              ms = r.job.milestones ? JSON.parse(r.job.milestones) : {};
            } catch {
              ms = {};
            }
            const done = JOB_MILESTONES.filter((m) => ms[m.key]).length;
            const pct = Math.round((done / JOB_MILESTONES.length) * 100);

            return (
              <Card key={r.job.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {r.job.leadId ? (
                        <Link
                          href={`/leads/${r.job.leadId}`}
                          className="font-semibold text-slate-800 hover:text-orange-600"
                        >
                          {r.displayName}
                        </Link>
                      ) : (
                        <span className="font-semibold text-slate-800">{r.displayName}</span>
                      )}
                      <Badge className={jobStatusColor(r.job.status)}>
                        {jobStatusLabel(r.job.status)}
                      </Badge>
                      {r.financeType === "financed" && (
                        <Badge
                          className={
                            r.financeStatus === "settled"
                              ? "bg-emerald-100 text-emerald-700"
                              : r.financeStatus === "awaiting_settlement"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-sky-100 text-sky-700"
                          }
                        >
                          {financingStatusLabel(r.financeStatus)}
                        </Badge>
                      )}
                      {ms.permit_required && !ms.permits_pulled && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Permit Needed
                        </Badge>
                      )}
                      {!r.job.leadId && (
                        <span className="text-[10px] font-medium uppercase text-slate-400">
                          Manual
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-sm text-slate-500">
                      {r.displayAddress ? `${r.displayAddress}, ` : ""}
                      {r.displayCity ?? "—"} · Contract {money(r.displayAmount ?? 0)}
                      {r.job.productName ? ` · ${r.job.productName}` : ""}
                       {r.propertyName ? ` · ${r.propertyName}` : ""}
                       {r.job.unitNumber ? ` · Unit ${r.job.unitNumber}` : ""}
                    </div>
                  </div>
                  <div className="w-40">
                    <div className="mb-1 flex justify-between text-xs text-slate-400">
                      <span>Progress</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-cyan-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-slate-600">
                    Manage job
                  </summary>
                  <form action={updateJob} className="mt-4 grid gap-4 md:grid-cols-2">
                    <input type="hidden" name="id" value={r.job.id} />
                    <input type="hidden" name="leadId" value={r.job.leadId ?? ""} />
                    <div>
                      <label className={label}>Status</label>
                      <select name="status" defaultValue={r.job.status} className={input}>
                        {JOB_STATUSES.map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={label}>Crew</label>
                      <input name="crew" defaultValue={r.job.crew ?? ""} className={input} />
                    </div>
                    <div>
                      <label className={label}>Property / Community</label>
                      <select name="propertyId" className={input} defaultValue={r.job.propertyId ?? ""}>
                        <option value="">No property selected</option>
                        {propertyRows.map(({ property, accountFirstName, accountLastName }) => (
                          <option key={property.id} value={property.id}>
                            {property.name} — {accountFirstName} {accountLastName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={label}>Unit Number</label>
                      <input name="unitNumber" defaultValue={r.job.unitNumber ?? ""} placeholder="e.g. 2B" className={input} />
                    </div>
                    <div>
                      <label className={label}>Start Date</label>
                      <input
                        type="date"
                        name="startDate"
                        defaultValue={toDateInput(r.job.startDate)}
                        className={input}
                      />
                    </div>
                    <div>
                      <label className={label}>Completion Date</label>
                      <input
                        type="date"
                        name="completionDate"
                        defaultValue={toDateInput(r.job.completionDate)}
                        className={input}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={label}>Job Requirements</label>
                      <p className="mb-2 text-xs text-slate-400">
                        Mark requirements that still apply even when the job moves to another stage.
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {JOB_REQUIREMENTS.map((requirement) => (
                          <label
                            key={requirement.key}
                            className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800"
                          >
                            <input
                              type="checkbox"
                              name={`ms_${requirement.key}`}
                              defaultChecked={!!ms[requirement.key]}
                              className="h-4 w-4 rounded"
                            />
                            {requirement.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className={label}>Milestones</label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {JOB_MILESTONES.map((m) => (
                          <label
                            key={m.key}
                            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600"
                          >
                            <input
                              type="checkbox"
                              name={`ms_${m.key}`}
                              defaultChecked={!!ms[m.key]}
                              className="h-4 w-4 rounded"
                            />
                            {m.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className={label}>Notes</label>
                      <textarea name="notes" rows={2} defaultValue={r.job.notes ?? ""} className={input} />
                    </div>
                    <div className="md:col-span-2">
                      <button className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700">
                        Save Job
                      </button>
                      {r.job.status !== "completed" && (
                        <form action={markJobCompleted} className="inline">
                          <input type="hidden" name="id" value={r.job.id} />
                          <input type="hidden" name="leadId" value={r.job.leadId ?? ""} />
                          <button
                            type="submit"
                            className="ml-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                          >
                            ✓ Mark Completed
                          </button>
                        </form>
                      )}
                      {r.job.completionDate && (
                        <span className="ml-3 text-xs text-slate-400">
                          Completed {fmtDateOnly(r.job.completionDate)}
                        </span>
                      )}
                    </div>
                  </form>
                  <Link
                    href={"/materials/new?jobId=" + r.job.id}
                    className="mt-3 inline-block rounded-lg border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100"
                  >
                    🧱 Order Materials for this job
                  </Link>
                  <form action={deleteJob} className="mt-3 border-t border-slate-100 pt-3">
                    <input type="hidden" name="id" value={r.job.id} />
                    <DeleteButton
                      label="Delete this job"
                      confirmText={`Delete the job for ${r.displayName}? This cannot be undone.`}
                    />
                  </form>
                </details>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
