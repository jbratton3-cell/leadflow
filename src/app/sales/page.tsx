import { db } from "@/db";
import { hcpPayments, invoices, jobs, sales, leads, products, reps } from "@/db/schema";
import { and, desc, eq, sql, gte, ilike, or, type SQL } from "drizzle-orm";
import Link from "next/link";
import { PageHeader, Card, EmptyState, StatCard } from "@/components/ui";
import { deleteSale } from "@/lib/delete-actions";
import DeleteButton from "@/components/DeleteButton";
import { getReps, getProducts, toMap } from "@/lib/queries";
import { requireAccess } from "@/lib/auth";
import { money, fmtDate, personName } from "@/lib/constants";
import {
  buildRevenueContracts,
  collectedStats,
  importedJobIds,
  linkedContractKey,
  soldStats,
} from "@/lib/revenue";

export const dynamic = "force-dynamic";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; q?: string }>;
}) {
  const { orgId } = await requireAccess("sales");
  const { period: periodParam, q: rawQuery } = await searchParams;
  const period = periodParam === "ytd" ? "ytd" : "mtd";
  const periodLabel = period.toUpperCase();
  const query = rawQuery?.trim() ?? "";

  const now = new Date();
  const periodStart = new Date(
    now.getFullYear(),
    period === "ytd" ? 0 : now.getMonth(),
    1,
  );
  periodStart.setHours(0, 0, 0, 0);
  const effectiveRepId = sql<number | null>`coalesce(${sales.salesRepId}, ${leads.assignedRepId})`;
  const saleConditions: SQL[] = [eq(sales.orgId, orgId)];
  if (query) {
    const like = `%${query}%`;
    saleConditions.push(
      or(
        ilike(leads.firstName, like),
        ilike(leads.lastName, like),
        ilike(leads.company, like),
        ilike(leads.address, like),
        ilike(leads.phone, like),
        ilike(leads.city, like),
        ilike(leads.zip, like),
        ilike(products.name, like),
        ilike(reps.name, like),
        ilike(sales.financeType, like),
        ilike(sales.notes, like),
        ilike(sql`${sales.amount}::text`, like),
        ilike(sql`${sales.id}::text`, like),
      )!,
    );
  }

  const [
    rows,
    allReps,
    prods,
    byRep,
    revenueSales,
    revenueJobs,
    paymentRows,
  ] = await Promise.all([
    db
      .select({
        sale: sales,
        firstName: leads.firstName,
        lastName: leads.lastName,
        city: leads.city,
        assignedRepId: leads.assignedRepId,
        productName: products.name,
        repName: reps.name,
      })
      .from(sales)
      .leftJoin(leads, eq(sales.leadId, leads.id))
      .leftJoin(products, eq(sales.productId, products.id))
      .leftJoin(reps, eq(reps.id, effectiveRepId))
      .where(and(...saleConditions))
      .orderBy(desc(sales.soldAt))
      .limit(200),
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
        id: sales.id,
        amount: sales.amount,
        soldAt: sales.soldAt,
      })
      .from(sales)
      .where(eq(sales.orgId, orgId)),
    db
      .select({
        id: jobs.id,
        saleId: jobs.saleId,
        contractAmount: jobs.contractAmount,
        createdAt: jobs.createdAt,
        notes: jobs.notes,
      })
      .from(jobs)
      .where(eq(jobs.orgId, orgId)),
    db
      .select({
        jobId: hcpPayments.jobId,
        invoiceJobId: invoices.jobId,
        amount: hcpPayments.amount,
        receivedAt: hcpPayments.receivedAt,
        paymentType: hcpPayments.paymentType,
        jobSaleId: jobs.saleId,
        invoiceSaleId: invoices.saleId,
      })
      .from(hcpPayments)
      .leftJoin(jobs, eq(hcpPayments.jobId, jobs.id))
      .leftJoin(invoices, eq(hcpPayments.invoiceId, invoices.id))
      .where(eq(hcpPayments.orgId, orgId)),
  ]);

  const repMap = toMap(allReps);
  const prodMap = toMap(prods);

  const periodStamp = `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, "0")}-01`;
  const contracts = buildRevenueContracts(revenueSales, revenueJobs);
  const importedJobs = importedJobIds(revenueJobs);
  const revenuePayments = paymentRows.map((payment) => ({
    amount: payment.amount,
    receivedAt: payment.receivedAt,
    paymentType: payment.paymentType,
    contractKey: linkedContractKey(
      payment.jobId,
      payment.invoiceJobId,
      payment.jobSaleId,
      payment.invoiceSaleId,
      importedJobs,
    ),
  }));
  const sold = soldStats(contracts, periodStamp);
  const collected = collectedStats(contracts, revenuePayments, periodStamp);
  const wisetack = collectedStats(
    contracts,
    revenuePayments,
    periodStamp,
    "Wisetack settlement",
  );
  const allWisetack = collectedStats(
    contracts,
    revenuePayments,
    "0000-01-01",
    "Wisetack settlement",
  );
  const collectedCount = collected.count;
  const collectedTotal = collected.total;
  const wisetackTotal = wisetack.total;
  const allTotal = soldStats(contracts, "0000-01-01").total;
  const allWisetackTotal = allWisetack.total;
  const periodCount = sold.count;
  const periodTotal = sold.total;

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
                href={query ? `/sales?period=mtd&q=${encodeURIComponent(query)}` : "/sales?period=mtd"}
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
                href={query ? `/sales?period=ytd&q=${encodeURIComponent(query)}` : "/sales?period=ytd"}
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

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <form className="flex gap-2" action="/sales">
          <input type="hidden" name="period" value={period} />
          <label className="sr-only" htmlFor="sales-search">
            Search sales
          </label>
          <input
            id="sales-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Search customer, product, rep, amount…"
            className="w-72 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-orange-400"
          />
          <button className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
            Search
          </button>
          {query && (
            <Link
              href={`/sales?period=${period}`}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Clear
            </Link>
          )}
        </form>
        <span className="text-xs text-slate-500">
          {query ? `Showing sales matching “${query}”` : "Search all sales"}
        </span>
      </div>

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
              <EmptyState
                message={
                  query
                    ? "No sales matched that search."
                    : "No sales recorded yet. Record a sale from a prospect after the demo."
                }
              />
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
