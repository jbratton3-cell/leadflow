import { db } from "@/db";
import { estimates, estimateItems, leads } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import {
  markEstimateViewed,
  respondToEstimate,
} from "@/lib/estimate-actions";
import { money, fmtDate, copyright, BUSINESS_NAME, APP_NAME } from "@/lib/constants";

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

  const [items, [lead]] = await Promise.all([
    db.select().from(estimateItems).where(eq(estimateItems.estimateId, est.id)).orderBy(asc(estimateItems.sortOrder)),
    db.select().from(leads).where(eq(leads.id, est.leadId)).limit(1),
  ]);

  const companyName = process.env.CRM_ORGANIZATION_NAME ?? BUSINESS_NAME;
  const responded = est.status === "accepted" || est.status === "declined";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-orange-500 text-xl font-bold text-white">
            {APP_NAME.slice(0, 1)}
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{companyName}</div>
            <div className="text-xs text-slate-500">Project Estimate</div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow">
          {/* Title bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-6 py-5">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{est.title}</h1>
              <p className="text-sm text-slate-500">Estimate {est.number}</p>
            </div>
            <div className="text-right text-sm text-slate-500">
              {lead && (
                <div className="font-medium text-slate-700">
                  {lead.firstName} {lead.lastName}
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
                    <td className="py-2.5 text-slate-700">{it.description}</td>
                    <td className="py-2.5 text-right text-slate-600">{Number(it.quantity)}</td>
                    <td className="py-2.5 text-right text-slate-600">{money(it.unitPrice)}</td>
                    <td className="py-2.5 text-right font-medium text-slate-700">{money(it.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

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
              <div className="flex justify-between">
                <span className="text-slate-500">Tax ({Number(est.taxRate)}%)</span>
                <span className="font-medium text-slate-700">{money(est.taxAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="font-semibold text-slate-800">Total</span>
                <span className="text-xl font-bold text-slate-900">{money(est.total)}</span>
              </div>
            </div>
          </div>

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
                      Pay directly
                    </span>
                    <span className="block text-sm text-slate-500">
                      50% down payment now, remaining balance when the job is complete.
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
                      Finance this project
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
