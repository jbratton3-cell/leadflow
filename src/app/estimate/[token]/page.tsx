import Link from "next/link";
import { db } from "@/db";
import { estimates, estimateItems, leads, estimatePhotos } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import {
  markEstimateViewed,
  respondToEstimate,
} from "@/lib/estimate-actions";
import { getSessionUser } from "@/lib/auth";
import SignatureStep from "@/components/SignatureStep";
import PrintButton from "@/components/PrintButton";
import { money, fmtDate, copyright, BUSINESS_NAME, APP_NAME, personName, cashPrice, cashSavings, hasCashOffer } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function PublicEstimatePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const [est] = await db
    .select()
    .from(estimates)
    .where(eq(estimates.publicToken, token))
    .limit(1);

  if (!est || est.status === "draft") {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
        <div className="rounded-2xl bg-white p-8 text-center shadow">
          <h1 className="text-lg font-semibold text-slate-900">Estimate not found</h1>
          <p className="mt-2 text-sm text-slate-500">
            This estimate link is invalid or is no longer available.
          </p>
        </div>
      </main>
    );
  }

  // Record the first view
  await markEstimateViewed(token);

  // CRM users previewing get a way back; customers see nothing.
  const internalUser = await getSessionUser();

  const [items, [lead], photos] = await Promise.all([
    db.select().from(estimateItems).where(eq(estimateItems.estimateId, est.id)).orderBy(asc(estimateItems.sortOrder)),
    db.select().from(leads).where(eq(leads.id, est.leadId)).limit(1),
    db.select().from(estimatePhotos).where(eq(estimatePhotos.estimateId, est.id)).orderBy(asc(estimatePhotos.createdAt)),
  ]);

  const companyName = process.env.CRM_ORGANIZATION_NAME ?? BUSINESS_NAME;
  const responded = est.status === "accepted" || est.status === "declined";
  const cashPct = Number(est.cashDiscountPercent);
  const cashTotal = cashPrice(est.total, cashPct, est.cashPrice);
  const showCash = hasCashOffer(est.total, cashPct, est.cashPrice);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        {internalUser && (
          <div className="no-print mb-4 flex items-center justify-between rounded-xl bg-white px-4 py-2.5 shadow-sm">
            <Link href="/estimates" className="text-sm font-medium text-orange-600 hover:underline">
              &larr; Back to Estimates
            </Link>
            <span className="text-xs text-slate-400">Previewing as {internalUser.name}</span>
          </div>
        )}
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/buildpros-logo.png" alt={companyName} className="h-12 w-auto" />
            <div className="mt-1 text-xs text-slate-500">Project Estimate</div>
          </div>
          <PrintButton />
        </div>

        <div className="print-plain overflow-hidden rounded-2xl bg-white shadow">
          {/* Title bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-6 py-5">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{est.title}</h1>
              <p className="text-sm text-slate-500">Estimate {est.number}</p>
            </div>
            <div className="text-right text-sm text-slate-500">
              {lead && (
                <div className="font-medium text-slate-700">
                  {personName(lead.firstName, lead.lastName, "Customer")}
                </div>
              )}
              {lead?.address && <div>{lead.address}</div>}
              {lead?.city && (
                <div>
                  {lead.city}, {lead.state ?? ""} {lead.zip ?? ""}
                </div>
              )}
            </div>
          </div>

          {/* Status banner */}
          {responded && (
            <div
              className={`px-6 py-3 text-sm font-semibold ${
                est.status === "accepted"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {est.status === "accepted"
                ? "✓ You accepted this estimate. Thank you! We'll be in touch shortly."
                : "This estimate was declined."}
            </div>
          )}

          {/* Signature on file */}
          {est.signatureData && (
            <div className="border-t border-slate-100 px-6 py-5">
              <div className="mb-2 text-sm font-medium text-slate-700">
                Signed{est.signatureName ? ` by ${est.signatureName}` : ""}
                {est.signatureAt ? ` — ${fmtDate(est.signatureAt)}` : ""}
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={est.signatureData}
                alt="Customer signature"
                className="h-24 rounded-lg border border-slate-200 bg-white p-2"
              />
            </div>
          )}

          {/* Line items */}
          <div className="px-6 py-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 font-medium">Description</th>
                  <th className="py-2 text-right font-medium">Qty</th>
                  <th className="py-2 text-right font-medium">Unit</th>
                  <th className="py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it) => (
                  <tr key={it.id}>
                    <td className="whitespace-pre-wrap py-2.5 text-slate-700">{it.description}</td>
                    <td className="py-2.5 text-right text-slate-600">{Number(it.quantity)}</td>
                    <td className="py-2.5 text-right text-slate-600">{money(it.unitPrice)}</td>
                    <td className="py-2.5 text-right font-medium text-slate-700">{money(it.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {photos.length > 0 && (
              <div className="mt-6">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Site photos
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {photos.map((ph) => (
                    <figure key={ph.id} className="overflow-hidden rounded-xl border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ph.url} alt={ph.caption || "Job photo"} className="w-full object-cover" />
                      {ph.caption && (
                        <figcaption className="px-3 py-2 text-xs text-slate-500">{ph.caption}</figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-700">{money(est.subtotal)}</span>
              </div>
              {Number(est.discount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Discount</span>
                  <span className="font-medium text-slate-700">- {money(est.discount)}</span>
                </div>
              )}
              {Number(est.taxRate) > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Tax ({Number(est.taxRate)}%)</span>
                  <span className="font-medium text-slate-700">{money(est.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="font-semibold text-slate-800">List / financed total</span>
                <span className="text-xl font-bold text-slate-900">{money(est.total)}</span>
              </div>
              {showCash && (
                <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2.5">
                  <div className="flex justify-between">
                    <span className="font-semibold text-emerald-800">Cash price</span>
                    <span className="text-xl font-bold text-emerald-800">{money(cashTotal)}</span>
                  </div>
                  <p className="mt-1 text-xs text-emerald-700">
                    Save {money(cashSavings(est.total, cashPct, est.cashPrice))} by putting 50% down now, remainder when the job is complete.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Optional signature step after accepting */}
          {est.status === "accepted" && !est.signatureData && lead && (
            <div className="no-print border-t border-slate-100 bg-slate-50 px-6 py-5">
              <SignatureStep
                token={token}
                customerName={personName(lead.firstName, lead.lastName, "Customer")}
              />
            </div>
          )}

          {/* Notes & terms */}
          {(est.notes || est.terms || est.validUntil) && (
            <div className="space-y-3 border-t border-slate-100 px-6 py-5 text-sm">
              {est.validUntil && (
                <p className="text-slate-500">
                  <span className="font-medium text-slate-700">Valid until:</span>{" "}
                  {fmtDate(est.validUntil)}
                </p>
              )}
              {est.notes && (
                <div>
                  <div className="font-medium text-slate-700">Notes</div>
                  <p className="text-slate-500">{est.notes}</p>
                </div>
              )}
              {est.terms && (
                <div>
                  <div className="font-medium text-slate-700">Terms &amp; Conditions</div>
                  <p className="text-slate-500">{est.terms}</p>
                </div>
              )}
            </div>
          )}

          {/* Accept (with payment choice) / Decline */}
          {!responded && (
            <div className="space-y-4 border-t border-slate-100 bg-slate-50 px-6 py-5">
              <form action={respondToEstimate} className="space-y-3">
                <input type="hidden" name="token" value={token} />
                <input type="hidden" name="decision" value="accept" />
                <div className="text-sm font-semibold text-slate-700">
                  How would you like to pay for this project?
                </div>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-400">
                  <input
                    type="radio"
                    name="paymentIntent"
                    value="direct"
                    defaultChecked
                    className="mt-1 h-4 w-4 accent-emerald-600"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">
                      Pay cash — {showCash ? money(cashTotal) : money(est.total)}
                    </span>
                    <span className="block text-sm text-slate-500">
                      {showCash
                        ? `Save ${money(cashSavings(est.total, cashPct, est.cashPrice))} — 50% deposit now, remainder when the job is complete.`
                        : "50% deposit now, remaining balance when the job is complete."}
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-amber-400">
                  <input
                    type="radio"
                    name="paymentIntent"
                    value="finance"
                    className="mt-1 h-4 w-4 accent-amber-600"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">
                      Finance this project — {money(est.total)}
                    </span>
                    <span className="block text-sm text-slate-500">
                      Affordable monthly payments — we&apos;ll follow up to complete a
                      quick financing application.
                    </span>
                  </span>
                </label>
                <button className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                  Accept Estimate
                </button>
              </form>
              <form action={respondToEstimate}>
                <input type="hidden" name="token" value={token} />
                <input type="hidden" name="decision" value="decline" />
                <button className="rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                  Decline
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Powered by {APP_NAME}
        </p>
        <p className="mt-1 text-center text-[11px] text-slate-400">{copyright()}</p>
      </div>
    </main>
  );
}
