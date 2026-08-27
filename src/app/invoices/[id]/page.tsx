import { db } from "@/db";
import { invoices, leads } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Card, Badge } from "@/components/ui";
import { requireAccess } from "@/lib/auth";
import { money, fmtDate } from "@/lib/constants";
import { markInvoicePaid, voidInvoice, resendInvoice } from "@/lib/invoice-actions";

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

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { orgId } = await requireAccess("invoices");
  const { id: raw } = await params;
  const id = Number(raw);
  if (!id) notFound();

  const [inv] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.orgId, orgId)))
    .limit(1);
  if (!inv) notFound();

  const [lead] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, inv.leadId), eq(leads.orgId, orgId)))
    .limit(1);

  const active = inv.status !== "paid" && inv.status !== "void";
  const customerName = lead
    ? `${lead.firstName} ${lead.lastName ?? ""}`.trim()
    : "Unknown customer";
  const publicLink = `/invoice/${inv.publicToken}`;

  return (
    <div>
      <PageHeader
        title={`Invoice ${inv.number}`}
        subtitle={`${kindLabel(inv.kind)} — ${customerName}`}
        action={
          <div className="flex items-center gap-2">
            <Badge className={STATUS_STYLE[inv.status] ?? "bg-slate-100 text-slate-600"}>
              {statusLabel(inv.status)}
            </Badge>
            <Link
              href="/invoices"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              &larr; All Invoices
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Amount
                </div>
                <div className="text-4xl font-bold text-slate-900">{money(inv.amount)}</div>
                <div className="mt-1 text-sm text-slate-500">
                  of {money(inv.contractTotal)} project total
                </div>
              </div>
              <div className="text-sm text-slate-500">
                {inv.paidAt && (
                  <div>
                    <span className="font-medium text-emerald-600">Paid</span> {fmtDate(inv.paidAt)}
                    {inv.paymentMethod ? ` via ${inv.paymentMethod}` : ""}
                  </div>
                )}
                {inv.paymentChoice && (
                  <div className="capitalize">
                    Customer chose: <span className="font-medium">{inv.paymentChoice === "finance" ? "financing" : "pay directly"}</span>
                    {inv.choiceAt ? ` (${fmtDate(inv.choiceAt)})` : ""}
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-slate-800">Customer</h2>
            {lead ? (
              <div className="mt-2 text-sm text-slate-600">
                <Link
                  href={`/leads/${lead.id}`}
                  className="font-semibold text-slate-800 hover:text-orange-600"
                >
                  {customerName}
                </Link>
                {lead.email && <div>{lead.email}</div>}
                {lead.phone && <div>{lead.phone}</div>}
                {lead.address && (
                  <div>
                    {lead.address}, {lead.city ?? ""} {lead.state ?? ""} {lead.zip ?? ""}
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">No linked customer record.</p>
            )}
          </Card>

          {inv.notes && (
            <Card className="p-6">
              <h2 className="font-semibold text-slate-800">Notes</h2>
              <p className="mt-2 text-sm text-slate-600">{inv.notes}</p>
            </Card>
          )}
        </div>

        {/* Right column: actions + timeline */}
        <div className="space-y-6">
          {active && (
            <Card className="p-5">
              <h2 className="font-semibold text-slate-800">Actions</h2>
              <form action={markInvoicePaid} className="mt-3 space-y-2">
                <input type="hidden" name="id" value={inv.id} />
                <select
                  name="method"
                  defaultValue="card"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="card">Card</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="ach">ACH</option>
                  <option value="other">Other</option>
                </select>
                <button className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                  Mark Paid
                </button>
              </form>
              <div className="mt-3 flex gap-2">
                <form action={resendInvoice} className="flex-1">
                  <input type="hidden" name="id" value={inv.id} />
                  <button className="w-full rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600">
                    Resend Email
                  </button>
                </form>
                <form action={voidInvoice} className="flex-1">
                  <input type="hidden" name="id" value={inv.id} />
                  <button className="w-full rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50">
                    Void
                  </button>
                </form>
              </div>
            </Card>
          )}

          <Card className="p-5">
            <h2 className="font-semibold text-slate-800">Timeline</h2>
            <dl className="mt-3 space-y-2 text-sm">
              {(
                [
                  ["Created", inv.createdAt],
                  ["Emailed", inv.sentAt],
                  ["Viewed by customer", inv.viewedAt],
                  ["Payment choice", inv.choiceAt],
                  ["Paid", inv.paidAt],
                ] as [string, Date | null][]
              ).map(([label, value]) => (
                <div key={String(label)} className="flex justify-between gap-3">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="font-medium text-slate-700">
                    {value ? fmtDate(value as Date) : "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold text-slate-800">Customer view</h2>
            <p className="mt-1 text-xs text-slate-500">
              The page your customer sees (same link as in their email).
            </p>
            <Link
              href={publicLink}
              target="_blank"
              className="mt-3 inline-block rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Open customer page ↗
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
