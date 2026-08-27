import { db } from "@/db";
import { sales, leads } from "@/db/schema";
import { and, desc, eq, sql, gte } from "drizzle-orm";
import Link from "next/link";
import { PageHeader, Card, EmptyState, StatCard } from "@/components/ui";
import { deleteSale } from "@/lib/delete-actions";
import DeleteButton from "@/components/DeleteButton";
import { getReps, getProducts, toMap } from "@/lib/queries";
import { requireAccess } from "@/lib/auth";
import { money, fmtDate, personName } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const { orgId } = await requireAccess("sales");

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [rows, mtd, allReps, prods, byRep] = await Promise.all([
    db
      .select({
        sale: sales,
        firstName: leads.firstName,
        lastName: leads.lastName,
        city: leads.city,
      })
      .from(sales)
      .leftJoin(leads, eq(sales.leadId, leads.id))
      .where(eq(sales.orgId, orgId))
      .orderBy(desc(sales.soldAt))
      .limit(200),
    db
      .select({
        count: sql<number>`count(*)::int`,
        total: sql<string>`coalesce(sum(${sales.amount}),0)`,
      })
      .from(sales)
      .where(and(eq(sales.orgId, orgId), gte(sales.soldAt, monthStart))),
    getReps(),
    getProducts(),
    db
      .select({
        repId: sales.salesRepId,
        count: sql<number>`count(*)::int`,
        total: sql<string>`coalesce(sum(${sales.amount}),0)`,
      })
      .from(sales)
      .where(and(eq(sales.orgId, orgId), gte(sales.soldAt, monthStart)))
      .groupBy(sales.salesRepId),
  ]);

  const repMap = toMap(allReps);
  const prodMap = toMap(prods);

  const mtdCount = mtd[0]?.count ?? 0;
  const mtdTotal = Number(mtd[0]?.total ?? 0);
  const allTotal = rows.reduce((sum, r) => sum + Number(r.sale.amount), 0);

  const leaderboard = byRep
    .map((r) => ({
      name: r.repId ? repMap.get(r.repId)?.name ?? "Unassigned" : "Unassigned",
      count: r.count,
      total: Number(r.total),
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <div>
      <PageHeader title="Sales" subtitle="Signed contracts and sales performance." />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Sales (MTD)" value={mtdCount} accent="text-emerald-600" />
        <StatCard label="Revenue (MTD)" value={money(mtdTotal)} accent="text-emerald-600" />
        <StatCard
          label="Avg Ticket (MTD)"
          value={money(mtdCount ? mtdTotal / mtdCount : 0)}
        />
        <StatCard label="All-Time Revenue" value={money(allTotal)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          {rows.length === 0 ? (
            <div className="p-6">
              <EmptyState message="No sales recorded yet. Record a sale from a prospect after the demo." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Rep</th>
                    <th className="px-4 py-3 font-medium">Finance</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => (
                    <tr key={r.sale.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/leads/${r.sale.leadId}`}
                          className="font-semibold text-slate-800 hover:text-orange-600"
                        >
                          {personName(r.firstName, r.lastName)}
                        </Link>
                        <div className="text-xs text-slate-400">{r.city ?? "—"}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {r.sale.productId ? prodMap.get(r.sale.productId)?.name ?? "—" : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {r.sale.salesRepId ? repMap.get(r.sale.salesRepId)?.name ?? "—" : "—"}
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-600">{r.sale.financeType}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                        {money(r.sale.amount)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(r.sale.soldAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <form action={deleteSale}>
                          <input type="hidden" name="id" value={r.sale.id} />
                          <DeleteButton
                            label="Delete"
                            confirmText={`Delete the ${money(r.sale.amount)} sale record? This cannot be undone.`}
                          />
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Rep Leaderboard (MTD)</h2>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-slate-400">No sales this month.</p>
          ) : (
            <ol className="space-y-3">
              {leaderboard.map((r, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                      {i + 1}
                    </span>
                    {r.name}
                  </span>
                  <span className="text-right">
                    <span className="block text-sm font-semibold text-emerald-600">
                      {money(r.total)}
                    </span>
                    <span className="text-xs text-slate-400">{r.count} sales</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}
