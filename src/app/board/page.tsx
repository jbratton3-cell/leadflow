import { db } from "@/db";
import { jobs, leads, sales } from "@/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import AutoRefresh from "@/components/AutoRefresh";
import { requireAccess } from "@/lib/auth";
import { APP_NAME, JOB_MILESTONES, jobStatusLabel, money } from "@/lib/constants";

export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = [
  "pending",
  "measure",
  "permits",
  "materials_ordered",
  "materials_delivered",
  "scheduled",
  "in_progress",
  "on_hold",
] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-500",
  measure: "bg-amber-500",
  permits: "bg-yellow-500",
  materials_ordered: "bg-blue-500",
  materials_delivered: "bg-teal-500",
  scheduled: "bg-indigo-500",
  in_progress: "bg-cyan-500",
  on_hold: "bg-rose-500",
};

function asDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateKey(value: Date | string | null | undefined): string {
  const date = asDate(value);
  return date ? date.toISOString().slice(0, 10) : "no-date";
}

function dateLabel(value: Date | string | null | undefined): string {
  const date = asDate(value);
  if (!date) return "No Date";
  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function timeValue(value: Date | string | null | undefined): number {
  return asDate(value)?.getTime() ?? 0;
}

function selectedMilestoneLabels(value: string | null): string[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return [];

    const selected = parsed as Record<string, unknown>;
    return JOB_MILESTONES.filter((milestone) => Boolean(selected[milestone.key])).map(
      (milestone) => milestone.label,
    );
  } catch {
    return [];
  }
}

export default async function BoardPage() {
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
    .where(and(eq(jobs.orgId, orgId), inArray(jobs.status, [...ACTIVE_STATUSES])))
    .orderBy(desc(jobs.createdAt));

  const view = rows
    .map((r) => {
      const displayName = r.firstName
        ? `${r.firstName} ${r.lastName ?? ""}`.trim()
        : r.job.customerName ?? "(unnamed job)";
      const displayAddress = r.address ?? r.job.customerAddress ?? null;
      const displayCity = r.city ?? r.job.customerCity ?? null;
      const displayAmount = r.amount ?? r.job.contractAmount ?? 0;
      const boardDate = r.job.startDate ?? r.job.createdAt;
      const milestones = selectedMilestoneLabels(r.job.milestones);

      return {
        ...r,
        displayName,
        displayAddress,
        displayCity,
        displayAmount,
        boardDate,
        milestones,
      };
    })
    .sort((a, b) => timeValue(b.boardDate) - timeValue(a.boardDate));

  const groups = new Map<string, { label: string; items: typeof view }>();
  for (const item of view) {
    const key = dateKey(item.boardDate);
    if (!groups.has(key)) {
      groups.set(key, { label: dateLabel(item.boardDate), items: [] });
    }
    groups.get(key)!.items.push(item);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="border-b border-slate-800 bg-slate-900/95 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <a href="/dashboard" className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-slate-800">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-orange-500 text-2xl font-bold text-white">
              {APP_NAME.slice(0, 1)}
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-white">{APP_NAME}</div>
              <div className="text-sm text-slate-400">TV Production Board</div>
            </div>
          </a>

          <div className="text-right">
            <div className="text-sm text-slate-400">Active Jobs</div>
            <div className="text-3xl font-bold text-cyan-400">{view.length}</div>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {view.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 px-6 py-12 text-center text-lg text-slate-500">
            No active jobs yet.
          </div>
        ) : (
          Array.from(groups.entries()).map(([key, group]) => (
            <section key={key} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-lg">
              <div className="flex items-center justify-between gap-4 bg-slate-800 px-5 py-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">{group.label}</h2>
                  <p className="text-sm text-slate-400">
                    {group.items.length} job{group.items.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-800">
                {group.items.map((r) => (
                  <Link
                    key={r.job.id}
                    href={r.job.leadId ? `/leads/${r.job.leadId}` : "/production"}
                    className="grid gap-4 rounded-xl px-5 py-4 transition hover:bg-slate-800/60 md:grid-cols-[220px_1fr_auto] md:items-center"
                  >
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className={`${STATUS_COLORS[r.job.status] ?? "bg-slate-600"} inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white`}
                        >
                          {jobStatusLabel(r.job.status)}
                        </span>
                      </div>
                      {r.milestones.length > 0 && (
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                          {r.milestones.map((milestone, index) => (
                            <span key={milestone} className="text-teal-300">
                              {index > 0 && <span className="mr-2 text-slate-600">·</span>}
                              {milestone}
                            </span>
                          ))}
                        </div>
                      )}
                      {r.job.crew && <div className="text-sm text-cyan-300">Crew: {r.job.crew}</div>}
                    </div>

                    <div>
                      <div className="text-2xl font-bold text-white">
                        {r.displayAddress ?? r.displayName}
                      </div>
                      <div className="mt-1 space-y-1 text-sm text-slate-300">
                        {r.displayAddress && r.displayCity && <div>{r.displayCity}</div>}
                        {r.job.productName && <div>{r.job.productName}</div>}
                        {r.job.notes && <div className="text-xs text-slate-400">{r.job.notes}</div>}
                      </div>
                    </div>

                    <div className="text-left md:text-right">
                      <div className="text-2xl font-bold text-emerald-400">{money(r.displayAmount)}</div>
                      <div className="text-xs text-slate-500">click for details</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
      <AutoRefresh seconds={60} />
    </main>
  );
}
