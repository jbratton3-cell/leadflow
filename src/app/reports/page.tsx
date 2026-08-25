import { db } from "@/db";
import { leads, appointments, sales, jobs, products } from "@/db/schema";
import { sql, eq, and } from "drizzle-orm";
import { PageHeader, Card } from "@/components/ui";
import { requireAccess } from "@/lib/auth";
import { STAGES, stageLabel, money } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const { orgId } = await requireAccess("reports");

  const [
    stageCounts,
    apptAgg,
    salesAgg,
    salesByProduct,
    monthly,
    cycleTime,
  ] = await Promise.all([
    db
      .select({ stage: leads.stage, count: sql<number>`count(*)::int` })
      .from(leads)
      .where(eq(leads.orgId, orgId))
      .groupBy(leads.stage),
    db
      .select({
        total: sql<number>`count(*)::int`,
        sat: sql<number>`count(*) filter (where status = 'sat')::int`,
        noShow: sql<number>`count(*) filter (where status = 'no_show')::int`,
      })
      .from(appointments)
      .where(eq(appointments.orgId, orgId)),
    db
      .select({
        count: sql<number>`count(*)::int`,
        total: sql<string>`coalesce(sum(${sales.amount}),0)`,
      })
      .from(sales)
      .where(eq(sales.orgId, orgId)),
    db
      .select({
        productId: sales.productId,
        count: sql<number>`count(*)::int`,
        total: sql<string>`coalesce(sum(${sales.amount}),0)`,
      })
      .from(sales)
      .where(eq(sales.orgId, orgId))
      .groupBy(sales.productId),
    db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${sales.soldAt}), 'Mon YYYY')`,
        monthKey: sql<string>`to_char(date_trunc('month', ${sales.soldAt}), 'YYYY-MM')`,
        count: sql<number>`count(*)::int`,
        total: sql<string>`coalesce(sum(${sales.amount}),0)`,
      })
      .from(sales)
      .where(eq(sales.orgId, orgId))
      .groupBy(sql`date_trunc('month', ${sales.soldAt})`)
      .orderBy(sql`date_trunc('month', ${sales.soldAt}) desc`)
      .limit(6),
    db
      .select({
        avgDays: sql<number>`coalesce(avg(extract(epoch from (${jobs.completionDate} - ${jobs.createdAt})) / 86400), 0)`,
      })
      .from(jobs)
      .where(and(eq(jobs.orgId, orgId), eq(jobs.status, "completed"))),
  ]);

  const prods = await db.select().from(products).where(eq(products.orgId, orgId));
  const prodMap = new Map(prods.map((p) => [p.id, p.name]));

  const stageMap = new Map(stageCounts.map((s) => [s.stage, s.count]));
  const totalLeads = stageCounts.reduce((s, r) => s + r.count, 0);
  const soldLeads =
    (stageMap.get("sold") ?? 0) +
    (stageMap.get("production") ?? 0) +
    (stageMap.get("completed") ?? 0);
  const apptTotal = apptAgg[0]?.total ?? 0;
  const satTotal = apptAgg[0]?.sat ?? 0;
  const salesCount = salesAgg[0]?.count ?? 0;
  const salesTotal = Number(salesAgg[0]?.total ?? 0);

  // Conversion funnel counts
  const funnel = [
    { label: "Leads", value: totalLeads },
    { label: "Appointments Set", value: apptTotal },
    { label: "Demos Sat", value: satTotal },
    { label: "Sales", value: salesCount },
  ];
  const funnelMax = Math.max(...funnel.map((f) => f.value), 1);

  const productReport = salesByProduct
    .map((r) => ({
      name: r.productId ? prodMap.get(r.productId) ?? "Other" : "Other",
      count: r.count,
      total: Number(r.total),
    }))
    .sort((a, b) => b.total - a.total);
  const monthlyMax = Math.max(...monthly.map((m) => Number(m.total)), 1);
  const avgCycle = Math.round(Number(cycleTime[0]?.avgDays ?? 0));

  return (
    <div>
      <PageHeader title="Reports" subtitle="Key numbers across the whole operation." />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Conversion funnel */}
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Conversion Funnel</h2>
          <div className="space-y-3">
            {funnel.map((f, i) => (
              <div key={f.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-600">{f.label}</span>
                  <span className="font-semibold text-slate-800">
                    {f.value}
                    {i > 0 && funnel[i - 1].value > 0 && (
                      <span className="ml-2 text-xs text-slate-400">
                        {Math.round((f.value / funnel[i - 1].value) * 100)}%
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-orange-400"
                    style={{ width: `${(f.value / funnelMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-center">
            <Metric label="Lead→Sale" value={`${totalLeads ? Math.round((soldLeads / totalLeads) * 100) : 0}%`} />
            <Metric label="Close Rate" value={`${satTotal ? Math.round((salesCount / satTotal) * 100) : 0}%`} />
            <Metric label="Avg Cycle" value={`${avgCycle}d`} />
          </div>
        </Card>

        {/* Pipeline by stage */}
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Leads by Stage</h2>
          <div className="space-y-2">
            {STAGES.map((s) => {
              const c = stageMap.get(s.key) ?? 0;
              const max = Math.max(...STAGES.map((x) => stageMap.get(x.key) ?? 0), 1);
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <span className="w-32 text-xs text-slate-500">{stageLabel(s.key)}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-indigo-400" style={{ width: `${(c / max) * 100}%` }} />
                  </div>
                  <span className="w-8 text-right text-sm font-medium text-slate-700">{c}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Sales by product */}
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Sales by Product</h2>
          {productReport.length === 0 ? (
            <p className="text-sm text-slate-400">No sales yet.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {productReport.map((p) => (
                  <tr key={p.name}>
                    <td className="py-2 font-medium text-slate-700">{p.name}</td>
                    <td className="py-2 text-right text-slate-500">{p.count} sales</td>
                    <td className="py-2 text-right font-semibold text-emerald-600">
                      {money(p.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* Monthly revenue trend */}
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Revenue Trend (6 mo)</h2>
          {monthly.length === 0 ? (
            <p className="text-sm text-slate-400">No sales yet.</p>
          ) : (
            <div className="space-y-2">
              {[...monthly].reverse().map((m) => (
                <div key={m.monthKey} className="flex items-center gap-3">
                  <span className="w-20 text-xs text-slate-500">{m.month}</span>
                  <div className="h-4 flex-1 overflow-hidden rounded bg-slate-100">
                    <div
                      className="h-full rounded bg-emerald-400"
                      style={{ width: `${(Number(m.total) / monthlyMax) * 100}%` }}
                    />
                  </div>
                  <span className="w-24 text-right text-sm font-medium text-slate-700">
                    {money(m.total)}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-500">
            All-time: <span className="font-semibold text-slate-800">{money(salesTotal)}</span> across{" "}
            {salesCount} sales
          </div>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-lg font-bold text-slate-800">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}
