import { db } from "@/db";
import { estimates, estimateItems, leads, invoices, pricebookItems, estimatePhotos } from "@/db/schema";
import AddEstimateItemForm from "@/components/AddEstimateItemForm";
import UploadEstimatePhoto from "@/components/UploadEstimatePhoto";
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
  fmtDateTime, personName, cashPrice, cashSavings, hasCashOffer } from "@/lib/constants";
import {
  updateEstimate,
  deleteEstimateItem,
  deleteEstimate,
  markEstimateStatus,
} from "@/lib/estimate-actions";
import { deleteEstimatePhoto } from "@/lib/estimate-photo-actions";
import { recordDepositPaid } from "@/lib/invoice-actions";

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

  const [items, [lead], book, photos] = await Promise.all([
    db.select().from(estimateItems).where(and(eq(estimateItems.orgId, orgId), eq(estimateItems.estimateId, estId))).orderBy(asc(estimateItems.sortOrder)),
    db.select().from(leads).where(and(eq(leads.orgId, orgId), eq(leads.id, est.leadId))).limit(1),
    db.select({
      id: pricebookItems.id,
      name: pricebookItems.name,
      description: pricebookItems.description,
      price: pricebookItems.price,
      unit: pricebookItems.unit,
      category: pricebookItems.category,
    }).from(pricebookItems).where(and(eq(pricebookItems.orgId, orgId), eq(pricebookItems.active, true))).orderBy(asc(pricebookItems.category), asc(pricebookItems.name)),
    db.select().from(estimatePhotos).where(and(eq(estimatePhotos.orgId, orgId), eq(estimatePhotos.estimateId, estId))).orderBy(asc(estimatePhotos.createdAt)),
  ]);

  const locked = est.status === "accepted" || est.status === "declined";

  const [depositInv] = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.orgId, orgId),
        eq(invoices.estimateId, est.id),
        eq(invoices.kind, "deposit")
      )
    )
    .limit(1);

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
                        <td className="max-w-[420px] whitespace-pre-wrap px-2 py-2 text-slate-700">{it.description}</td>
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
              <AddEstimateItemForm
                estimateId={est.id}
                book={book.map((b) => ({
                  id: b.id,
                  name: b.name,
                  description: b.description,
                  price: String(b.price),
                  unit: b.unit,
                  category: b.category,
                }))}
              />
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-1 text-sm font-semibold text-slate-700">Photos</h2>
            <p className="mb-3 text-xs text-slate-400">
              Damage / site pictures the customer will see on this estimate. On a phone this opens the camera.
            </p>
            {photos.length > 0 && (
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((ph) => (
                  <div key={ph.id} className="overflow-hidden rounded-lg border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ph.url} alt={ph.caption || ph.fileName} className="h-36 w-full object-cover" />
                    <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                      <span className="truncate text-[11px] text-slate-500">{ph.caption || ph.fileName}</span>
                      {!locked && (
                        <form action={deleteEstimatePhoto}>
                          <input type="hidden" name="id" value={ph.id} />
                          <input type="hidden" name="estimateId" value={est.id} />
                          <button className="text-[11px] font-medium text-rose-500">Remove</button>
                        </form>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!locked && <UploadEstimatePhoto estimateId={est.id} />}
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
                  <label className={label}>Cash price ($)</label>
                  <input name="cashPrice" type="number" step="0.01" min="0" max={Number(est.total) || undefined} defaultValue={est.cashPrice ?? ""} placeholder="e.g. 8500" className={input} />
                  <p className="mt-1 text-[11px] text-slate-400">What they pay if 50/50 cash — cannot be higher than the list total. Leave blank for no cash offer.</p>
                </div>
                <input type="hidden" name="cashDiscountPercent" value={est.cashDiscountPercent} />
                <div>
                  <label className={label}>Tax Rate (%)</label>
                  <input name="taxRate" type="number" step="0.001" defaultValue={est.taxRate} className={input} />
                  <p className="mt-1 text-[11px] text-slate-400">BuildPros does not charge sales tax — leave this at 0.</p>
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
              {Number(est.taxRate) > 0 && (
                <Row label={`Tax (${Number(est.taxRate)}%)`} value={money(est.taxAmount)} />
              )}
              <div className="mt-2 flex justify-between border-t border-slate-200 pt-2">
                <dt className="font-semibold text-slate-700">List / financed</dt>
                <dd className="text-xl font-bold text-slate-900">{money(est.total)}</dd>
              </div>
              {hasCashOffer(est.total, est.cashDiscountPercent, est.cashPrice) && (
                <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-2">
                  <div className="flex justify-between text-sm">
                    <dt className="font-semibold text-emerald-800">Cash (50/50)</dt>
                    <dd className="text-lg font-bold text-emerald-800">
                      {money(cashPrice(est.total, est.cashDiscountPercent, est.cashPrice))}
                    </dd>
                  </div>
                  <p className="mt-1 text-[11px] text-emerald-700">
                    Save {money(cashSavings(est.total, est.cashDiscountPercent, est.cashPrice))} with 50% deposit, 50% when the job is complete.
                  </p>
                </div>
              )}
              {!hasCashOffer(est.total, est.cashDiscountPercent, est.cashPrice) && (
                <p className="mt-2 text-[11px] text-slate-400">
                  Enter a cash price under Details (then Save) to offer 50/50 cash on this quote.
                </p>
              )}
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Deposit</h2>
            {depositInv ? (
              depositInv.status === "paid" ? (
                <p className="text-sm font-medium text-emerald-700">
                  ✓ {money(depositInv.amount)} deposit paid {fmtDate(depositInv.paidAt)}
                  {depositInv.paymentMethod ? ` · ${depositInv.paymentMethod}` : ""}
                </p>
              ) : depositInv.status === "void" ? (
                <p className="text-sm text-slate-400">Deposit invoice voided.</p>
              ) : (
                <p className="text-sm text-slate-600">
                  {money(depositInv.amount)} deposit invoice {depositInv.number} outstanding —{" "}
                  <Link href={`/invoices/${depositInv.id}`} className="font-medium text-orange-600 hover:underline">
                    view
                  </Link>
                </p>
              )
            ) : est.status === "accepted" ? (
              <>
                <p className="mb-2 text-xs text-slate-400">
                  Record a 50% deposit that was collected outside the automated flow
                  (e.g. already paid on a paper estimate). No email is sent.
                </p>
                <form action={recordDepositPaid} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="estimateId" value={est.id} />
                  <select
                    name="method"
                    defaultValue="check"
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                  >
                    <option value="card">Card</option>
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="ach">ACH</option>
                    <option value="other">Other</option>
                  </select>
                  <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                    Record Deposit Paid
                  </button>
                </form>
              </>
            ) : (
              <p className="text-xs text-slate-400">
                Deposit tracking appears once the estimate is accepted.
              </p>
            )}
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
            {est.signatureData && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
                <div className="mb-1 text-xs font-semibold text-emerald-700">
                  ✍️ Signed{est.signatureName ? ` by ${est.signatureName}` : ""}
                  {est.signatureAt ? ` — ${fmtDateTime(est.signatureAt)}` : ""}
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={est.signatureData} alt="Customer signature" className="h-20 rounded-lg border border-emerald-100 bg-white p-1.5" />
                <a
                  href={`/api/estimates/${est.id}/pdf`}
                  target="_blank"
                  className="mt-2 inline-block rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  📄 Download signed PDF
                </a>
              </div>
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
              <OfficeAcceptForm
                estimateId={est.id}
                listTotal={money(est.total)}
                cashTotal={money(cashPrice(est.total, est.cashDiscountPercent))}
                cashPct={hasCashOffer(est.total, est.cashDiscountPercent, est.cashPrice) ? 1 : 0}
              />
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
