import { db } from "@/db";
import { estimates, estimateItems, leads } from "@/db/schema";
import { and, eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader, Card, Badge } from "@/components/ui";
import { requireAccess } from "@/lib/auth";
import SendEstimatePanel from "@/components/SendEstimatePanel";
import OfficeAcceptForm from "@/components/OfficeAcceptForm";
import {
  estimateStatusLabel,
  estimateStatusColor,
  money,
  fmtDate,
  fmtDateTime, personName } from "@/lib/constants";
import {
  updateEstimate,
  addEstimateItem,
  deleteEstimateItem,
  deleteEstimate,
  markEstimateStatus,
} from "@/lib/estimate-actions";

export const dynamic = "force-dynamic";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400";
const label = "mb-1 block text-xs font-medium text-slate-600";

function toDateInput(d: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

export default async function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { orgId } = await requireAccess("estimates");
  const { id } = await params;
  const estId = Number(id);

  const [est] = await db
    .select()
    .from(estimates)
    .where(and(eq(estimates.id, estId), eq(estimates.orgId, orgId)))
    .limit(1);
  if (!est) notFound();

  const [items, [lead]] = await Promise.all([
    db.select().from(estimateItems).where(and(eq(estimateItems.orgId, orgId), eq(estimateItems.estimateId, estId))).orderBy(asc(estimateItems.sortOrder)),
    db.select().from(leads).where(and(eq(leads.orgId, orgId), eq(leads.id, est.leadId))).limit(1),
  ]);

  const locked = est.status === "accepted" || est.status === "declined";

  return (
    <div>
      <PageHeader
        title={`${est.number}`}
        subtitle={lead ? `For ${personName(lead.firstName, lead.lastName, "customer")}` : undefined}
        action={
          <div className="flex items-center gap-2">
            <Badge className={estimateStatusColor(est.status)}>
              {estimateStatusLabel(est.status)}
            </Badge>
            <Link
              href="/estimates"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              All Estimates
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: line items + details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Line items */}
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Line Items</h2>
            {items.length === 0 ? (
              <p className="mb-4 text-sm text-slate-400">
                No line items yet. Add products, materials, or labor below.
              </p>
            ) : (
              <div className="mb-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-2 py-2 font-medium">Description</th>
                      <th className="px-2 py-2 text-right font-medium">Qty</th>
                      <th className="px-2 py-2 text-right font-medium">Unit Price</th>
                      <th className="px-2 py-2 text-right font-medium">Amount</th>
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((it) => (
                      <tr key={it.id}>
                        <td className="px-2 py-2 text-slate-700">{it.description}</td>
                        <td className="px-2 py-2 text-right text-slate-600">{Number(it.quantity)}</td>
                        <td className="px-2 py-2 text-right text-slate-600">{money(it.unitPrice)}</td>
                        <td className="px-2 py-2 text-right font-medium text-slate-700">{money(it.amount)}</td>
                        <td className="px-2 py-2 text-right">
                          {!locked && (
                            <form action={deleteEstimateItem}>
                              <input type="hidden" name="id" value={it.id} />
                              <input type="hidden" name="estimateId" value={est.id} />
                              <button className="text-xs font-medium text-rose-500 hover:text-rose-700">
                                Remove
                              </button>
                            </form>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!locked && (
              <form action={addEstimateItem} className="grid grid-cols-12 gap-2 border-t border-slate-100 pt-4">
                <input type="hidden" name="estimateId" value={est.id} />
                <div className="col-span-6">
                  <label className={label}>Description</label>
                  <input name="description" required placeholder="e.g. Vinyl replacement window" className={input} />
                </div>
                <div className="col-span-2">
                  <label className={label}>Qty</label>
                  <input name="quantity" type="number" step="0.01" defaultValue={1} className={input} />
                </div>
                <div className="col-span-2">
                  <label className={label}>Unit Price</label>
                  <input name="unitPrice" type="number" step="0.01" defaultValue={0} className={input} />
                </div>
                <div className="col-span-2 flex items-end">
                  <button className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                    Add
                  </button>
                </div>
              </form>
            )}
          </Card>

          {/* Estimate details */}
          {!locked && (
            <Card className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Details</h2>
              <form action={updateEstimate} className="grid grid-cols-2 gap-4">
                <input type="hidden" name="id" value={est.id} />
                <div className="col-span-2">
                  <label className={label}>Title</label>
                  <input name="title" defaultValue={est.title} className={input} />
                </div>
                <div>
                  <label className={label}>Discount ($)</label>
                  <input name="discount" type="number" step="0.01" defaultValue={est.discount} className={input} />
                </div>
                <div>
                  <label className={label}>Tax Rate (%)</label>
                  <input name="taxRate" type="number" step="0.001" defaultValue={est.taxRate} className={input} />
                </div>
                <div>
                  <label className={label}>Valid Until</label>
                  <input name="validUntil" type="date" defaultValue={toDateInput(est.validUntil)} className={input} />
                </div>
                <div className="col-span-2">
                  <label className={label}>Notes (shown to customer)</label>
                  <textarea name="notes" rows={2} defaultValue={est.notes ?? ""} className={input} />
                </div>
                <div className="col-span-2">
                  <label className={label}>Terms &amp; Conditions</label>
                  <textarea name="terms" rows={2} defaultValue={est.terms ?? ""} className={input} />
                </div>
                <div className="col-span-2">
                  <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
                    Save Details
                  </button>
                </div>
              </form>
            </Card>
          )}
        </div>

        {/* Right: totals, send, status */}
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Summary</h2>
            <dl className="space-y-1.5 text-sm">
              <Row label="Subtotal" value={money(est.subtotal)} />
              {Number(est.discount) > 0 && <Row label="Discount" value={`- ${money(est.discount)}`} />}
              <Row label={`Tax (${Number(est.taxRate)}%)`} value={money(est.taxAmount)} />
              <div className="mt-2 flex justify-between border-t border-slate-200 pt-2">
                <dt className="font-semibold text-slate-700">Total</dt>
                <dd className="text-xl font-bold text-slate-900">{money(est.total)}</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Send to Customer</h2>
            {locked ? (
              <p className="text-sm text-slate-500">
                This estimate has been {est.status}. It can no longer be edited or resent.
              </p>
            ) : (
              <SendEstimatePanel
                estimateId={est.id}
                hasItems={items.length > 0}
                alreadySent={Boolean(est.sentAt)}
                customerEmail={lead?.email ?? null}
              />
            )}
            <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-400">
              {est.sentAt && <div>Sent: {fmtDateTime(est.sentAt)}</div>}
              {est.viewedAt && <div>Viewed by customer: {fmtDateTime(est.viewedAt)}</div>}
              {est.respondedAt && <div>Responded: {fmtDateTime(est.respondedAt)}</div>}
              {est.validUntil && <div>Valid until: {fmtDate(est.validUntil)}</div>}
            </div>
          </Card>

          {!locked && (
            <Card className="p-5">
              <h2 className="mb-2 text-sm font-semibold text-slate-700">Office Actions</h2>
              <p className="mb-3 text-xs text-slate-400">
                For paper estimates signed in the field — record the outcome here instead
                of waiting for the customer to respond online.
              </p>
              <OfficeAcceptForm estimateId={est.id} />
              <form action={markEstimateStatus} className="mt-3">
                <input type="hidden" name="id" value={est.id} />
                <input type="hidden" name="status" value="declined" />
                <button className="rounded-lg border border-rose-200 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50">
                  Mark as Declined
                </button>
              </form>
            </Card>
          )}

          {!locked && (
            <Card className="p-5">
              <h2 className="mb-2 text-sm font-semibold text-slate-700">Danger Zone</h2>
              <form action={deleteEstimate}>
                <input type="hidden" name="id" value={est.id} />
                <input type="hidden" name="leadId" value={est.leadId} />
                <button className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50">
                  Delete Estimate
                </button>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-700">{value}</dd>
    </div>
  );
}
