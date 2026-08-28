import { db } from "@/db";
import { leads, appointments, sales, jobs, callLogs, organizations } from "@/db/schema";
import { sql, desc, eq, gte, and, inArray } from "drizzle-orm";
import Link from "next/link";
import { PageHeader, StatCard, Card, Badge } from "@/components/ui";
import TrialChecklist from "@/components/TrialChecklist";
import { requireUser } from "@/lib/auth";
import {
  STAGES,
  stageLabel,
  stageColor,
  money,
  fmtDateTime,
  dispositionLabel, personName } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const user = await requireUser();
  const orgId = user.orgId;
  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
  const isTrial = org?.plan === "trial";
  const { denied } = await searchParams;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    stageCounts,
    totalLeads,
    apptSet,
    apptSat,
    salesAgg,
    activeJobs,
    recentCalls,
    recentSales,
    upcomingAppts,
  ] = await Promise.all([
    db
      .select({ stage: leads.stage, count: sql<number>`count(*)::int` })
      .from(leads)
      .where(eq(leads.orgId, orgId))
      .groupBy(leads.stage),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(leads)
      .where(and(eq(leads.orgId, orgId), gte(leads.createdAt, monthStart))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(appointments)
      .where(and(eq(appointments.orgId, orgId), gte(appointments.createdAt, monthStart))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(appointments)
      .where(and(eq(appointments.orgId, orgId), gte(appointments.createdAt, monthStart), eq(appointments.status, "sat"))),
    db
      .select({
        count: sql<number>`count(*)::int`,
        total: sql<string>`coalesce(sum(${sales.amount}),0)`,
      })
      .from(sales)
      .where(and(eq(sales.orgId, orgId), gte(sales.soldAt, monthStart))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(jobs)
      .where(and(eq(jobs.orgId, orgId), inArray(jobs.status, ["pending", "measure", "permits", "materials_ordered", "scheduled", "in_progress", "on_hold"]))),
    db.select().from(callLogs).where(eq(callLogs.orgId, orgId)).orderBy(desc(callLogs.createdAt)).limit(6),
    db.select().from(sales).where(eq(sales.orgId, orgId)).orderBy(desc(sales.soldAt)).limit(5),
    db
      .select()
      .from(appointments)
      .where(and(eq(appointments.orgId, orgId), inArray(appointments.status, ["set", "confirmed"])))
      .orderBy(appointments.scheduledAt)
      .limit(5),
  ]);

  const stageMap = new Map(stageCounts.map((s) => [s.stage, s.count]));
  const leadNames = await getLeadNames(orgId, [
    ...recentCalls.map((c) => c.leadId),
    ...recentSales.map((s) => s.leadId),
    ...upcomingAppts.map((a) => a.leadId),
  ]);

  const monthLeads = totalLeads[0]?.count ?? 0;
  const setCount = apptSet[0]?.count ?? 0;
  const satCount = apptSat[0]?.count ?? 0;
  const soldCount = salesAgg[0]?.count ?? 0;
  const revenue = Number(salesAgg[0]?.total ?? 0);

  const setRate = monthLeads ? Math.round((setCount / monthLeads) * 100) : 0;
  const closeRate = satCount ? Math.round((soldCount / satCount) * 100) : 0;
  const avgSale = soldCount ? revenue / soldCount : 0;

  return (
    <div>
      {denied && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You don&apos;t have permission to view that page. Contact an administrator if
          you need access.
        </div>
      )}
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        subtitle="Company performance this month — lead to sale to production."
        action={
          <Link
            href="/leads/new"
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
          >
            + New Prospect
          </Link>
        }
      />

      {isTrial && (
        <div className="mb-6">
          <TrialChecklist orgId={orgId} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="New Leads (MTD)" value={monthLeads} sub="This month" />
        <StatCard
          label="Appts Set (MTD)"
          value={setCount}
          sub={`${setRate}% set rate`}
          accent="text-blue-600"
        />
        <StatCard
          label="Demos Sat"
          value={satCount}
          sub={`${closeRate}% close rate`}
          accent="text-violet-600"
        />
        <StatCard
          label="Revenue (MTD)"
          value={money(revenue)}
          sub={`${soldCount} sales · avg ${money(avgSale)}`}
          accent="text-emerald-600"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Pipeline funnel */}
        <Card className="lg:col-span-2 p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Pipeline</h2>
          <div className="space-y-2">
            {STAGES.map((s) => {
              const c = stageMap.get(s.key) ?? 0;
              const max = Math.max(...STAGES.map((x) => stageMap.get(x.key) ?? 0), 1);
              return (
                <Link
                  key={s.key}
                  href={`/leads?stage=${s.key}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                >
                  <div className="w-32 shrink-0">
                    <Badge className={s.color}>{s.label}</Badge>
                  </div>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-orange-400"
                      style={{ width: `${(c / max) * 100}%` }}
                    />
                  </div>
                  <div className="w-8 text-right text-sm font-semibold text-slate-700">
                    {c}
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>

        {/* Production snapshot */}
        <div className="space-y-4">
          <StatCard
            label="Active Jobs"
            value={activeJobs[0]?.count ?? 0}
            sub="In production pipeline"
            accent="text-cyan-600"
          />
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              Upcoming Appointments
            </h2>
            {upcomingAppts.length === 0 ? (
              <p className="text-sm text-slate-400">None scheduled.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {upcomingAppts.map((a) => (
                  <li key={a.id} className="flex justify-between gap-2">
                    <Link href={`/leads/${a.leadId}`} className="font-medium text-slate-700 hover:text-orange-600">
                      {leadNames.get(a.leadId) ?? `Lead #${a.leadId}`}
                    </Link>
                    <span className="text-slate-400">{fmtDateTime(a.scheduledAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Recent Calls</h2>
          {recentCalls.length === 0 ? (
            <p className="text-sm text-slate-400">No calls logged yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {recentCalls.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2">
                  <Link href={`/leads/${c.leadId}`} className="font-medium text-slate-700 hover:text-orange-600">
                    {leadNames.get(c.leadId) ?? `Lead #${c.leadId}`}
                  </Link>
                  <span className="text-slate-500">{dispositionLabel(c.disposition)}</span>
                  <span className="text-xs text-slate-400">{fmtDateTime(c.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Recent Sales</h2>
          {recentSales.length === 0 ? (
            <p className="text-sm text-slate-400">No sales recorded yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {recentSales.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2">
                  <Link href={`/leads/${s.leadId}`} className="font-medium text-slate-700 hover:text-orange-600">
                    {leadNames.get(s.leadId) ?? `Lead #${s.leadId}`}
                  </Link>
                  <span className="font-semibold text-emerald-600">{money(s.amount)}</span>
                  <span className="text-xs text-slate-400">{fmtDateTime(s.soldAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

async function getLeadNames(orgId: number, ids: number[]) {
  const unique = [...new Set(ids)].filter(Boolean);
  const map = new Map<number, string>();
  if (unique.length === 0) return map;
  const rows = await db
    .select({ id: leads.id, firstName: leads.firstName, lastName: leads.lastName })
    .from(leads)
    .where(and(eq(leads.orgId, orgId), inArray(leads.id, unique)));
  for (const r of rows) map.set(r.id, personName(r.firstName, r.lastName));
  return map;
}
