import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { expenses, jobs, leads, properties, sales } from "@/db/schema";
import { requireAccess } from "@/lib/auth";
import {
  expenseCategoryLabel,
  EXPENSE_CATEGORIES,
  fmtDateOnly,
  money,
} from "@/lib/constants";
import { PageHeader, Card, Badge, EmptyState, StatCard } from "@/components/ui";
import ExpenseForm from "@/components/ExpenseForm";
import { deleteExpense } from "@/lib/expense-actions";

export const dynamic = "force-dynamic";

function jobName(
  firstName: string | null,
  lastName: string | null,
  customerName: string | null,
): string {
  return firstName
    ? `${firstName} ${lastName ?? ""}`.trim()
    : customerName ?? "(unnamed job)";
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const user = await requireAccess("job_financials");
  const { created } = await searchParams;

  const [jobRows, expenseRows] = await Promise.all([
    db
      .select({
        job: jobs,
        firstName: leads.firstName,
        lastName: leads.lastName,
        address: leads.address,
        city: leads.city,
        state: leads.state,
        zip: leads.zip,
        saleAmount: sales.amount,
         propertyName: properties.name,
      })
      .from(jobs)
      .leftJoin(leads, eq(jobs.leadId, leads.id))
      .leftJoin(properties, eq(jobs.propertyId, properties.id))
      .leftJoin(sales, eq(jobs.saleId, sales.id))
      .where(eq(jobs.orgId, user.orgId))
      .orderBy(desc(jobs.createdAt)),
    db
      .select({ expense: expenses, job: jobs })
      .from(expenses)
      .leftJoin(jobs, eq(expenses.jobId, jobs.id))
      .where(eq(expenses.orgId, user.orgId))
      .orderBy(desc(expenses.purchaseDate), desc(expenses.createdAt))
      .limit(250),
  ]);

  const jobOptions = jobRows.map((row) => {
    const name = jobName(row.firstName, row.lastName, row.job.customerName);
    const addressParts = [
      row.address ?? row.job.customerAddress,
      row.city ?? row.job.customerCity,
      row.state,
      row.zip,
    ].filter(Boolean);
    const address = addressParts.join(", ") || "No address";
    const property = row.propertyName
      ? `${row.propertyName}${row.job.unitNumber ? ` · Unit ${row.job.unitNumber}` : ""}`
      : null;
    return { id: row.job.id, label: `${name}${property ? ` — ${property}` : ""} — ${address}` };
  });

  const costsByJob = new Map<number, number>();
  for (const row of expenseRows) {
    costsByJob.set(
      row.expense.jobId,
      (costsByJob.get(row.expense.jobId) ?? 0) + Number(row.expense.amount ?? 0),
    );
  }

  const revenueTotal = jobRows.reduce(
    (sum, row) => sum + Number(row.saleAmount ?? row.job.contractAmount ?? 0),
    0,
  );
  const costTotal = expenseRows.reduce((sum, row) => sum + Number(row.expense.amount ?? 0), 0);
  const profitTotal = revenueTotal - costTotal;
  const jobsWithCosts = jobRows.filter((row) => costsByJob.has(row.job.id)).length;
  const defaultDate = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader
        title="Job Costs"
        subtitle="Admin-only expense entry and profitability tracking."
        action={
          <Link
            href="/production"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            View Production
          </Link>
        }
      />

      {created && (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Expense saved and included in the job profitability totals.
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Recorded Costs" value={money(costTotal)} accent="text-rose-600" />
        <StatCard label="Tracked Job Profit" value={money(profitTotal)} accent="text-emerald-600" />
        <StatCard label="Jobs With Costs" value={jobsWithCosts} accent="text-orange-600" />
      </div>

      <Card className="mb-6 p-5">
        <h2 className="text-lg font-semibold text-slate-800">Add Job Expense</h2>
        <p className="mt-1 mb-4 text-sm text-slate-500">
          Enter office-recorded expenses and attach the receipt for your records.
        </p>
        {jobOptions.length > 0 ? (
          <ExpenseForm jobs={jobOptions} categories={[...EXPENSE_CATEGORIES]} defaultDate={defaultDate} />
        ) : (
          <EmptyState message="Create a production job before recording an expense." />
        )}
      </Card>

      <Card className="mb-6 overflow-x-auto p-0">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-800">Job Profitability</h2>
          <p className="mt-1 text-xs text-slate-500">
            Revenue uses the contract or sale amount. Profit is revenue minus recorded expenses.
          </p>
        </div>
        {jobRows.length === 0 ? (
          <div className="p-8">
            <EmptyState message="No production jobs yet." />
          </div>
        ) : (
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Job</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Contract</th>
                <th className="px-5 py-3 text-right font-medium">Costs</th>
                <th className="px-5 py-3 text-right font-medium">Profit</th>
                <th className="px-5 py-3 text-right font-medium">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobRows.map((row) => {
                const revenue = Number(row.saleAmount ?? row.job.contractAmount ?? 0);
                const cost = costsByJob.get(row.job.id) ?? 0;
                const profit = revenue - cost;
                const margin = revenue > 0 ? (profit / revenue) * 100 : null;
                return (
                  <tr key={row.job.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-slate-800">
                        {jobName(row.firstName, row.lastName, row.job.customerName)}
                      </div>
                      <div className="text-xs text-slate-400">
                        {row.job.customerAddress ?? "No address"}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge className="bg-slate-100 text-slate-600">{row.job.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-slate-700">{money(revenue)}</td>
                    <td className="px-5 py-3 text-right font-medium text-rose-600">{money(cost)}</td>
                    <td
                      className={`px-5 py-3 text-right font-semibold ${
                        profit >= 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {money(profit)}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600">
                      {margin === null ? "—" : `${margin.toFixed(1)}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <Card className="overflow-x-auto p-0">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-800">Recent Expenses</h2>
        </div>
        {expenseRows.length === 0 ? (
          <div className="p-8">
            <EmptyState message="No job expenses recorded yet." />
          </div>
        ) : (
          <table className="w-full min-w-[850px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Job</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Vendor</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Receipt</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenseRows.map(({ expense, job }) => (
                <tr key={expense.id} className="align-top hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-600">{fmtDateOnly(expense.purchaseDate)}</td>
                  <td className="px-5 py-3 font-medium text-slate-700">
                    {job?.customerName ?? `Job #${expense.jobId}`}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{expenseCategoryLabel(expense.category)}</td>
                  <td className="px-5 py-3 text-slate-600">{expense.vendor ?? "—"}</td>
                  <td className="px-5 py-3 text-right font-semibold text-rose-600">
                    {money(expense.amount)}
                  </td>
                  <td className="px-5 py-3">
                    {expense.receiptUrl ? (
                      <a
                        href={expense.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-orange-600 hover:underline"
                      >
                        View receipt
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">None</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <form action={deleteExpense}>
                      <input type="hidden" name="id" value={expense.id} />
                      <button className="text-xs font-medium text-rose-500 hover:underline">
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}