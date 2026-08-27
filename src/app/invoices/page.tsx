import { db } from "@/db";
import { invoices, leads } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { PageHeader, Card, Badge } from "@/components/ui";
import { requireAccess } from "@/lib/auth";
import { money, fmtDate } from "@/lib/constants";
import { markInvoicePaid, voidInvoice, resendInvoice } from "@/lib/invoice-actions";
import DeleteButton from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-sky-100 text-sky-700",
  viewed: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  financed: "bg-amber-100 text-amber-800",
  void: "bg-rose-100 text-rose-600",
};

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: "Draft",
    sent: "Sent",
    viewed: "Viewed",
    paid: "Paid",
    financed: "Financed",
    void: "Void",
  };
  return map[status] ?? status;
}

function kindLabel(kind: string): string {
  const map: Record<string, string> = {
    deposit: "50% Deposit",
    final: "Final Payment",
    manual: "Invoice",
  };
  return map[kind] ?? kind;
}

export default async function InvoicesPage() {
  const { orgId } = await requireAccess("invoices");

  const rows = await db
    .select({ inv: invoices, firstName: leads.firstName, lastName: leads.lastName })
    .from(invoices)
    .leftJoin(leads, eq(invoices.leadId, leads.id))
    .where(eq(invoices.orgId, orgId))
    .orderBy(desc(invoices.createdAt));

  const outstanding = rows
    .filter((r) => ["sent", "viewed", "draft"].includes(r.inv.status))
    .reduce((s, r) => s + Number(r.inv.amount), 0);
  const collected = rows
    .filter((r) => r.inv.status === "paid")
    .reduce((s, r) => s + Number(r.inv.amount), 0);
  const financed = rows
    .filter((r) => r.inv.status === "financed")
    .reduce((s, r) => s + Number(r.inv.amount), 0);

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Deposits and final payments — created and sent automatically when estimates are accepted and jobs are completed."
      />

      {/* Summary cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Outstanding
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{money(outstanding)}</div>
          <div className="text-xs text-slate-400">waiting on payment</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Collected
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">{money(collected)}</div>
          <div className="text-xs text-slate-400">marked paid</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Financed
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-600">{money(financed)}</div>
          <div className="text-xs text-slate-400">customer chose financing</div>
        </Card>
      </div>

      {rows.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="text-3xl">🧾</div>
          <h2 className="mt-3 font-semibold text-slate-800">No invoices yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            When a customer accepts an estimate and chooses to pay directly, a 50% deposit
            invoice is sent automatically. When you mark their job complete, the final
            invoice goes out the same way.
          </p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Sent</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(({ inv, firstName, lastName }) => {
                const name = firstName ? `${firstName} ${lastName ?? ""}`.trim() : "—";
                const active = inv.status !== "paid" && inv.status !== "void";
                return (
                  <tr key={inv.id} className="align-top hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="font-semibold text-slate-800 hover:text-orange-600"
                      >
                        {inv.number}
                      </Link>
                      <div className="text-xs text-slate-400">{kindLabel(inv.kind)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/leads/${inv.leadId}`}
                        className="font-medium text-slate-700 hover:text-orange-600"
                      >
                        {name}
                      </Link>
                      {inv.paymentChoice === "finance" && (
                        <div className="text-xs text-amber-600">wants financing</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-semibold text-slate-800">{money(inv.amount)}</div>
                      <div className="text-xs text-slate-400">
                        of {money(inv.contractTotal)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={STATUS_STYLE[inv.status] ?? "bg-slate-100 text-slate-600"}>
                        {statusLabel(inv.status)}
                      </Badge>
                      {inv.paidAt && (
                        <div className="mt-1 text-xs text-slate-400">{fmtDate(inv.paidAt)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {inv.sentAt ? fmtDate(inv.sentAt) : "not sent"}
                      {inv.viewedAt && <div className="text-slate-500">viewed {fmtDate(inv.viewedAt)}</div>}
                    </td>
                    <td className="px-4 py-3">
                      {active && (
                        <form action={markInvoicePaid} className="flex items-center gap-2">
                          <input type="hidden" name="id" value={inv.id} />
                          <select
                            name="method"
                            defaultValue="card"
                            className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                          >
                            <option value="card">Card</option>
                            <option value="cash">Cash</option>
                            <option value="check">Check</option>
                            <option value="ach">ACH</option>
                            <option value="other">Other</option>
                          </select>
                          <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                            Mark Paid
                          </button>
                        </form>
                      )}
                      <div className="mt-2 flex items-center gap-3">
                        {active && (
                          <form action={resendInvoice}>
                            <input type="hidden" name="id" value={inv.id} />
                            <button className="text-xs font-medium text-orange-600 hover:underline">
                              Resend
                            </button>
                          </form>
                        )}
                        {active && (
                          <form action={voidInvoice}>
                            <input type="hidden" name="id" value={inv.id} />
                            <button className="text-xs font-medium text-rose-500 hover:underline">
                              Void
                            </button>
                          </form>
                        )}
                        <Link
                          href={`/invoice/${inv.publicToken}`}
                          target="_blank"
                          className="text-xs font-medium text-slate-500 hover:underline"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
