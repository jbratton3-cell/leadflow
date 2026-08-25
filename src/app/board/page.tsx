import { db } from "@/db";
import { jobs, leads, sales } from "@/db/schema";
import { and, eq, gte, isNotNull, asc } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { jobStatusLabel, jobStatusColor, money, APP_NAME } from "@/lib/constants";
import AutoRefresh from "./AutoRefresh";

export const dynamic = "force-dynamic";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function dayLabel(d: Date) {
  const today = startOfToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (dayKey(d) === dayKey(today)) return "Today";
  if (dayKey(d) === dayKey(tomorrow)) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

function dateSub(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function BoardPage() {
  const { orgId } = await requireUser();
  const today = startOfToday();

  // Upcoming jobs with a start date from today forward, not completed.
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
    .where(and(eq(jobs.orgId, orgId), isNotNull(jobs.startDate), gte(jobs.startDate, today)))
    .orderBy(asc(jobs.startDate))
    .limit(200);

  const view = rows
    .filter((r) => r.job.status !== "completed")
    .map((r) => ({
      id: r.job.id,
      name: r.firstName
        ? `${r.firstName} ${r.lastName ?? ""}`.trim()
        : r.job.customerName ?? "(unnamed job)",
      address: r.address ?? r.job.customerAddress ?? null,
      city: r.city ?? r.job.customerCity ?? null,
      amount: r.amount ?? r.job.contractAmount ?? 0,
      product: r.job.productName ?? null,
      crew: r.job.crew ?? null,
      status: r.job.status,
      startDate: r.job.startDate as Date,
    }));

  // Group by day (next 7 distinct days that have jobs)
  const groups = new Map<string, { label: string; sub: string; date: Date; items: typeof view }>();
  for (const j of view) {
    const key = dayKey(j.startDate);
    if (!groups.has(key)) {
      groups.set(key, {
        label: dayLabel(j.startDate),
        sub: dateSub(j.startDate),
        date: j.startDate,
        items: [],
      });
    }
    groups.get(key)!.items.push(j);
  }
  const dayColumns = [...groups.values()].sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 6);

  const jobsToday = groups.get(dayKey(today))?.items.length ?? 0;

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-orange-500 text-2xl font-bold text-white">
            {APP_NAME.slice(0, 1)}
          </div>
          <div>
            <h1 className="text-3xl font-bold">Production Schedule</h1>
            <p className="text-sm text-slate-400">
              {view.length} upcoming jobs · {jobsToday} today
            </p>
          </div>
        </div>
        <AutoRefresh seconds={60} />
      </div>

      {dayColumns.length === 0 ? (
        <div className="grid h-[70vh] place-items-center text-center">
          <div>
            <div className="text-6xl">📅</div>
            <p className="mt-4 text-2xl font-semibold text-slate-300">
              No upcoming jobs scheduled
            </p>
            <p className="mt-1 text-slate-500">
              Jobs with a start date will appear here automatically.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid auto-cols-fr grid-flow-col gap-4 overflow-x-auto">
          {dayColumns.map((col) => (
            <section key={col.label + col.sub} className="min-w-[320px]">
              {/* Day header */}
              <div
                className={`mb-3 rounded-xl px-4 py-3 ${
                  col.label === "Today" ? "bg-orange-500" : "bg-slate-800"
                }`}
              >
                <div className="text-2xl font-bold">{col.label}</div>
                <div className={`text-sm ${col.label === "Today" ? "text-orange-100" : "text-slate-400"}`}>
                  {col.sub} · {col.items.length} {col.items.length === 1 ? "job" : "jobs"}
                </div>
              </div>

              {/* Job cards */}
              <div className="space-y-3">
                {col.items.map((j) => (
                  <div key={j.id} className="rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xl font-bold leading-tight">{j.name}</div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${jobStatusColor(
                          j.status
                        )}`}
                      >
                        {jobStatusLabel(j.status)}
                      </span>
                    </div>
                    {(j.address || j.city) && (
                      <div className="mt-1 text-base text-slate-300">
                        📍 {j.address ? `${j.address}, ` : ""}
                        {j.city ?? ""}
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      {j.product && <span className="text-slate-300">🔧 {j.product}</span>}
                      {j.crew && <span className="text-cyan-300 font-semibold">👷 {j.crew}</span>}
                      {Number(j.amount) > 0 && (
                        <span className="text-emerald-400 font-semibold">{money(j.amount)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="mt-6 text-center text-xs text-slate-600">
        Auto-updates every minute · {APP_NAME}
      </div>
    </main>
  );
}
