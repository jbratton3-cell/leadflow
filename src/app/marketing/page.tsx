import { db } from "@/db";
import { leads, sales, leadSources } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import { PageHeader, Card, EmptyState, StatCard } from "@/components/ui";
import { requireAccess } from "@/lib/auth";
import { money } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const { orgId } = await requireAccess("marketing");

  const [sources, leadsBySource, salesBySource] = await Promise.all([
    db.select().from(leadSources).where(eq(leadSources.orgId, orgId)).orderBy(leadSources.name),
    db
      .select({
        sourceId: leads.sourceId,
        count: sql<number>`count(*)::int`,
        sold: sql<number>`count(*) filter (where ${leads.stage} in ('sold','production','completed'))::int`,
      })
      .from(leads)
      .where(eq(leads.orgId, orgId))
      .groupBy(leads.sourceId),
    db
      .select({
        sourceId: leads.sourceId,
        revenue: sql<string>`coalesce(sum(${sales.amount}),0)`,
        deals: sql<number>`count(*)::int`,
      })
      .from(sales)
      .leftJoin(leads, eq(sales.leadId, leads.id))
      .where(eq(sales.orgId, orgId))
      .groupBy(leads.sourceId),
  ]);

  const leadMap = new Map(leadsBySource.map((r) => [r.sourceId, r]));
  const saleMap = new Map(salesBySource.map((r) => [r.sourceId, r]));

  const table = sources.map((s) => {
    const l = leadMap.get(s.id);
    const sa = saleMap.get(s.id);
    const cost = Number(s.monthlyCost);
    const leadCount = l?.count ?? 0;
    const dealCount = sa?.deals ?? 0;
    const revenue = Number(sa?.revenue ?? 0);
    const cpl = leadCount ? cost / leadCount : 0;
    const cps = dealCount ? cost / dealCount : 0;
    const roi = cost ? ((revenue - cost) / cost) * 100 : 0;
    const convRate = leadCount ? (dealCount / leadCount) * 100 : 0;
    return { source: s, cost, leadCount, dealCount, revenue, cpl, cps, roi, convRate };
  });

  const totalCost = table.reduce((s, r) => s + r.cost, 0);
  const totalLeads = table.reduce((s, r) => s + r.leadCount, 0);
  const totalRevenue = table.reduce((s, r) => s + r.revenue, 0);
  const totalDeals = table.reduce((s, r) => s + r.dealCount, 0);

  return (
    <div>
      <PageHeader
        title="Marketing"
        subtitle="Link every lead to its source — see cost-per-lead, cost-per-sale, and ROI."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Marketing Spend" value={money(totalCost)} accent="text-orange-600" />
        <StatCard
          label="Cost Per Lead"
          value={money(totalLeads ? totalCost / totalLeads : 0)}
        />
        <StatCard
          label="Cost Per Sale"
          value={money(totalDeals ? totalCost / totalDeals : 0)}
        />
        <StatCard
          label="Overall ROI"
          value={`${totalCost ? Math.round(((totalRevenue - totalCost) / totalCost) * 100) : 0}%`}
          accent="text-emerald-600"
        />
      </div>

      {table.length === 0 ? (
        <EmptyState message="No lead sources yet. Add sources in Settings to track marketing ROI." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 text-right font-medium">Spend</th>
                  <th className="px-4 py-3 text-right font-medium">Leads</th>
                  <th className="px-4 py-3 text-right font-medium">Sales</th>
                  <th className="px-4 py-3 text-right font-medium">Conv %</th>
                  <th className="px-4 py-3 text-right font-medium">CPL</th>
                  <th className="px-4 py-3 text-right font-medium">CPS</th>
                  <th className="px-4 py-3 text-right font-medium">Revenue</th>
                  <th className="px-4 py-3 text-right font-medium">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {table.map((r) => (
                  <tr key={r.source.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{r.source.name}</div>
                      <div className="text-xs capitalize text-slate-400">
                        {r.source.category.replace("_", " ")}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{money(r.cost)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{r.leadCount}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{r.dealCount}</td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {r.convRate.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{money(r.cpl)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{money(r.cps)}</td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-600">
                      {money(r.revenue)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-semibold ${
                          r.roi >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {Math.round(r.roi)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
