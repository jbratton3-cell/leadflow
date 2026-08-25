import { db } from "@/db";
import { jobs, leads, sales } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { PageHeader, Card, Badge, EmptyState, StatCard } from "@/components/ui";
import { requireAccess } from "@/lib/auth";
import { updateJob, createJob } from "@/lib/actions";
import {
  JOB_STATUSES,
  JOB_MILESTONES,
  jobStatusLabel,
  jobStatusColor,
  money,
  fmtDate,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400";
const label = "mb-1 block text-xs font-medium text-slate-600";

function toDateInput(d: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

export default async function ProductionPage() {
  const { orgId } = await requireAccess("production");

  const rows = await db
    .select({
      job: jobs,
      firstName: leads.firstName,
      lastName: leads.lastName,
      city: leads.city,
      address: leads.address,
      amount: sales.amount,
    })
    .from(jobs)
    .leftJoin(leads, eq(jobs.leadId, leads.id))
    .leftJoin(sales, eq(jobs.saleId, sales.id))
    .where(eq(jobs.orgId, orgId))
    .orderBy(desc(jobs.createdAt))
    .limit(200);

  // Resolve display fields from the linked lead/sale, or the manual job fields.
  const view = rows.map((r) => {
    const name = r.firstName
      ? `${r.firstName} ${r.lastName ?? ""}`.trim()
      : r.job.customerName ?? "(unnamed job)";
    const address = r.address ?? r.job.customerAddress ?? null;
    const city = r.city ?? r.job.customerCity ?? null;
    const amount = r.amount ?? r.job.contractAmount ?? 0;
    return { ...r, displayName: name, displayAddress: address, displayCity: city, displayAmount: amount };
  });

  const active = view.filter((r) => !["completed"].includes(r.job.status));
  const completed = view.filter((r) => r.job.status === "completed");
  const backlog = active.reduce((s, r) => s + Number(r.displayAmount ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Production"
        subtitle="Track every job from contract to completion."
        action={
          <Link
            href="/board"
            target="_blank"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            📺 Open TV Job Board
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Active Jobs" value={active.length} accent="text-cyan-600" />
        <StatCard label="Completed" value={completed.length} accent="text-green-600" />
        <StatCard label="Backlog Value" value={money(backlog)} accent="text-orange-600" />
        <StatCard label="Total Jobs" value={view.length} />
      </div>

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
        <EmptyState message="No production jobs yet. Jobs are created automatically when a sale is recorded — or add one manually above." />
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
                      {r.job.completionDate && (
                        <span className="ml-3 text-xs text-slate-400">
                          Completed {fmtDate(r.job.completionDate)}
                        </span>
                      )}
                    </div>
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
