import { db } from "@/db";
import { jobs, leads, sales } from "@/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { requireAccess } from "@/lib/auth";
import { APP_NAME, jobStatusLabel, money } from "@/lib/constants";

export const dynamic = "force-dynamic";

const BOARD_STATUSES = [
  "pending",
  "measure",
  "permits",
  "materials_ordered",
  "scheduled",
  "in_progress",
  "on_hold",
] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-500",
  measure: "bg-amber-500",
  permits: "bg-yellow-500",
  materials_ordered: "bg-blue-500",
  scheduled: "bg-indigo-500",
  in_progress: "bg-cyan-500",
  on_hold: "bg-rose-500",
};

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
    .where(and(eq(jobs.orgId, orgId), inArray(jobs.status, [...BOARD_STATUSES])))
    .orderBy(desc(jobs.updatedAt), desc(jobs.createdAt));

  const view = rows.map((r) => {
    const displayName = r.firstName
      ? `${r.firstName} ${r.lastName ?? ""}`.trim()
      : r.job.customerName ?? "(unnamed job)";
    const displayAddress = r.address ?? r.job.customerAddress ?? null;
    const displayCity = r.city ?? r.job.customerCity ?? null;
    const displayAmount = r.amount ?? r.job.contractAmount ?? 0;

    return {
      ...r,
      displayName,
      displayAddress,
      displayCity,
      displayAmount,
    };
  });

  const groups = new Map(BOARD_STATUSES.map((status) => [status, view.filter((r) => r.job.status === status)]));

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="border-b border-slate-800 bg-slate-900/95 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-slate-800">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-orange-500 text-2xl font-bold text-white">
              {APP_NAME.slice(0, 1)}
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-white">{APP_NAME}</div>
              <div className="text-sm text-slate-400">TV Production Board</div>
            </div>
          </Link>

          <div className="text-right">
            <div className="text-sm text-slate-400">Active Jobs</div>
            <div className="text-3xl font-bold text-cyan-400">{view.length}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-4 2xl:grid-cols-7">
        {BOARD_STATUSES.map((status) => {
          const items = groups.get(status) ?? [];
          return (
            <section key={status} className="flex min-h-[70vh] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
              <div className={`px-4 py-3 ${STATUS_COLORS[status] ?? "bg-slate-700"}`}>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-white">
                    {jobStatusLabel(status)}
                  </h2>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">
                    {items.length}
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-3">
                {items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-700 px-3 py-6 text-center text-sm text-slate-500">
                    No jobs
                  </div>
                ) : (
                  items.map((r) => (
                    <article key={r.job.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3 shadow-sm">
                      <div className="mb-2 text-base font-bold text-white">{r.displayName}</div>
                      <div className="space-y-1 text-sm text-slate-300">
                        {r.displayAddress && <div>{r.displayAddress}</div>}
                        {r.displayCity && <div>{r.displayCity}</div>}
                        {r.job.productName && <div>{r.job.productName}</div>}
                        <div className="font-semibold text-emerald-400">{money(r.displayAmount)}</div>
                        {r.job.crew && <div className="text-cyan-300">Crew: {r.job.crew}</div>}
                        {r.job.notes && <div className="line-clamp-3 text-xs text-slate-400">{r.job.notes}</div>}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
