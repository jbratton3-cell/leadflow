import { db } from "@/db";
import { hcpPayments, sales, leads } from "@/db/schema";
import { and, desc, eq, sql, gte } from "drizzle-orm";
import Link from "next/link";
import { PageHeader, Card, EmptyState, StatCard } from "@/components/ui";
import { deleteSale } from "@/lib/delete-actions";
import DeleteButton from "@/components/DeleteButton";
import { getReps, getProducts, toMap } from "@/lib/queries";
import { requireAccess } from "@/lib/auth";
import { money, fmtDate, personName } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { orgId } = await requireAccess("sales");
  const { period: periodParam } = await searchParams;
  const period = periodParam === "ytd" ? "ytd" : "mtd";
  const periodLabel = period.toUpperCase();

  const now = new Date();
  const periodStart = new Date(
    now.getFullYear(),
    period === "ytd" ? 0 : now.getMonth(),
    1,
  );
  periodStart.setHours(0, 0, 0, 0);
  const effectiveRepId = sql<number | null>`coalesce(${sales.salesRepId}, ${leads.assignedRepId})`;

  const [
    rows,
    periodSales,
    allReps,
    prods,
    byRep,
    periodPayments,
    periodWisetack,
    allWisetack,
  ] = await Promise.all([
    db
      .select({
        sale: sales,
        firstName: leads.firstName,
        lastName: leads.lastName,
        city: leads.city,
        assignedRepId: leads.assignedRepId,
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
      .where(and(eq(sales.orgId, orgId), gte(sales.soldAt, periodStart))),
    getReps(),
    getProducts(),
    db
      .select({
        repId: effectiveRepId,
        count: sql<number>`count(*)::int`,
        total: sql<string>`coalesce(sum(${sales.amount}),0)`,
      })
      .from(sales)
      .leftJoin(leads, eq(sales.leadId, leads.id))
      .where(and(eq(sales.orgId, orgId), gte(sales.soldAt, periodStart)))
      .groupBy(effectiveRepId),
    db
      .select({
        count: sql<number>`count(*)::int`,
        total: sql<string>`coalesce(sum(${hcpPayments.amount}),0)`,
      })
      .from(hcpPayments)
      .where(and(eq(hcpPayments.orgId, orgId), gte(hcpPayments.receivedAt, periodStart))),
    db
      .select({
        count: sql<number>`count(*)::int`,
        total: sql<string>`coalesce(sum(${hcpPayments.amount}),0)`,
      })
      .from(hcpPayments)
      .where(
        and(
          eq(hcpPayments.orgId, orgId),
          eq(hcpPayments.paymentType, "Wisetack settlement"),
          gte(hcpPayments.receivedAt, periodStart),
        ),
      ),
    db
      .select({
        total: sql<string>`coalesce(sum(${hcpPayments.amount}),0)`,
      })
      .from(hcpPayments)
      .where(
        and(
          eq(hcpPayments.orgId, orgId),
          eq(hcpPayments.paymentType, "Wisetack settlement"),
        ),
      ),
  ]);

  const repMap = toMap(allReps);
  const prodMap = toMap(prods);

  const periodCount = periodSales[0]?.count ?? 0;
  const periodTotal = Number(periodSales[0]?.total ?? 0);
  const collectedCount = periodPayments[0]?.count ?? 0;
  const collectedTotal = Number(periodPayments[0]?.total ?? 0);
  const wisetackTotal = Number(periodWisetack[0]?.total ?? 0);
  const allWisetackTotal = Number(allWisetack[0]?.total ?? 0);
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
      <PageHeader
        title="Sales"
        subtitle="Signed contracts and sales performance."
        action={
          <div
            className="flex items-center gap-2"
            aria-label="Sales performance period"
          >
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              View
            </span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
              <Link
                href="/sales?period=mtd"
                aria-current={period === "mtd" ? "page" : undefined}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  period === "mtd"
                    ? "bg-slate-800 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                MTD
              </Link>
              <Link
                href="/sales?period=ytd"
                aria-current={period === "ytd" ? "page" : undefined}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  period === "ytd"
                    ? "bg-slate-800 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                YTD
              </Link>
            </div>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label={`Sales (${periodLabel})`} value={periodCount} accent="text-emerald-600" />
        <StatCard label={`Sold (${periodLabel})`} value={money(periodTotal)} accent="text-emerald-600" />
        <StatCard
          label={`Avg Ticket (${periodLabel})`}
          value={money(periodCount ? periodTotal / periodCount : 0)}
        />
        <StatCard label="All-Time Sold" value={money(allTotal)} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label={`Collected (${periodLabel})`}
          value={money(collectedTotal)}
          accent="text-blue-600"
        />
        <StatCard
          label={`Collected Transactions (${periodLabel})`}
          value={collectedCount}
          accent="text-blue-600"
        />
        <StatCard
          label={`Wisetack Settled (${periodLabel})`}
          value={money(wisetackTotal)}
          accent="text-amber-600"
        />
        <StatCard
          label="All-Time Wisetack Settled"
          value={money(allWisetackTotal)}
          accent="text-amber-600"
        />
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
                        {(r.sale.salesRepId ?? r.assignedRepId)
                          ? repMap.get(r.sale.salesRepId ?? r.assignedRepId!)?.name ?? "—"
                          : "—"}
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
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Rep Leaderboard ({periodLabel})
          </h2>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-slate-400">No sales in this period.</p>
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
