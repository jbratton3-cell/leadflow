import { db } from "@/db";
import { hcpPayments, invoices, jobs, sales } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { money } from "@/lib/constants";
import { nyPeriodStarts, weekStamps } from "@/lib/ny-dates";
import {
  buildRevenueContracts,
  collectedStats,
  importedJobIds,
  linkedContractKey,
  soldStats,
} from "@/lib/revenue";
import TvBoardChrome from "@/components/TvBoardChrome";

export const dynamic = "force-dynamic";

export default async function SalesBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ tight?: string }>;
}) {
  const user = await requireUser();
  const { tight: tightQ } = await searchParams;
  const tight = tightQ === "1";
  const { today, weekStart, monthStart, yearStart } = nyPeriodStarts();

  const [rows, jobRows, paymentRows] = await Promise.all([
    db.select().from(sales).where(eq(sales.orgId, user.orgId)),
    db
      .select({
        id: jobs.id,
        saleId: jobs.saleId,
        contractAmount: jobs.contractAmount,
        createdAt: jobs.createdAt,
        notes: jobs.notes,
      })
      .from(jobs)
      .where(eq(jobs.orgId, user.orgId)),
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
      .where(eq(hcpPayments.orgId, user.orgId)),
  ]);

  const contracts = buildRevenueContracts(rows, jobRows);
  const importedJobs = importedJobIds(jobRows);
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
  const sold = (from: string) => soldStats(contracts, from).total;
  const collected = (from: string) => collectedStats(contracts, revenuePayments, from).total;

  const todaySold = sold(today);
  const weekSold = sold(weekStart);
  const monthSold = sold(monthStart);
  const yearSold = sold(yearStart);
  const todayCollected = collected(today);
  const weekCollected = collected(weekStart);
  const monthCollected = collected(monthStart);
  const yearCollected = collected(yearStart);

  const weeks = weekStamps(8);
  const weekly = weeks.map((w, i) => {
    const end = weeks[i + 1]?.start ?? "9999-12-32";
    const amt = contracts
      .filter((contract) => {
        const st = contract.soldAt
          ? new Date(contract.soldAt).toLocaleDateString("en-CA", {
              timeZone: "America/New_York",
            })
          : "";
        return st >= w.start && st < end;
      })
      .reduce((n, contract) => n + Number(contract.amount || 0), 0);
    return { ...w, amt };
  });
  const maxW = Math.max(...weekly.map((w) => w.amt), 1);

  const cards = [
    { label: "Today", sold: todaySold, collected: todayCollected, color: "text-cyan-400" },
    { label: "This week", sold: weekSold, collected: weekCollected, color: "text-amber-300" },
    { label: "This month", sold: monthSold, collected: monthCollected, color: "text-emerald-400" },
    { label: "Year to date", sold: yearSold, collected: yearCollected, color: "text-white" },
  ];

  return (
    <TvBoardChrome
      title="TV Sold / Collected Board"
      tight={tight}
      right={
        <div className="text-right">
          <div className="text-slate-400">This month</div>
          <div className={`font-bold text-emerald-400 ${tight ? "text-2xl" : "text-4xl"}`}>
            {money(monthSold)}
          </div>
        </div>
      }
    >
      <div className={`grid gap-3 ${tight ? "grid-cols-4" : "grid-cols-2 lg:grid-cols-4"}`}>
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4">
            <div className="mb-2 text-slate-400">{c.label}</div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs uppercase tracking-wide text-slate-500">Sold</span>
              <span className={`font-bold ${c.color} ${tight ? "text-2xl" : "text-4xl"}`}>
                {money(c.sold)}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-slate-800 pt-2">
              <span className="text-xs uppercase tracking-wide text-slate-500">Collected</span>
              <span className={`font-bold text-blue-300 ${tight ? "text-xl" : "text-3xl"}`}>
                {money(c.collected)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-3 font-semibold text-slate-300">Weekly sales</div>
        <div className="flex h-48 items-end gap-2">
          {weekly.map((w) => (
            <div key={w.start} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
              <div className="text-[10px] text-slate-500">{w.amt ? money(w.amt) : ""}</div>
              <div
                className="w-full rounded-t-md bg-orange-500"
                style={{ height: `${Math.max(4, (w.amt / maxW) * 100)}%` }}
              />
              <div className="text-[10px] text-slate-400">{w.label}</div>
            </div>
          ))}
        </div>
      </div>
    </TvBoardChrome>
  );
}
