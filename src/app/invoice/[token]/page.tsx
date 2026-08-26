import { db } from "@/db";
import { invoices, leads } from "@/db/schema";
import { eq } from "drizzle-orm";
import { markInvoiceViewed, customerInvoiceChoice } from "@/lib/invoice-actions";
import { money, fmtDate, copyright, BUSINESS_NAME, APP_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const [inv] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.publicToken, token))
    .limit(1);

  if (!inv || inv.status === "void" || inv.status === "draft") {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
        <div className="rounded-2xl bg-white p-8 text-center shadow">
          <h1 className="text-lg font-semibold text-slate-900">Invoice not found</h1>
          <p className="mt-2 text-sm text-slate-500">
            This invoice link is invalid or is no longer available.
          </p>
        </div>
      </main>
    );
  }

  // Record the first view
  await markInvoiceViewed(token);

  const [lead] = await db
    .select()
    .from(leads)
    .where(eq(leads.id, inv.leadId))
    .limit(1);

  const companyName = process.env.COMPANY_NAME ?? BUSINESS_NAME;
  const kindLabel =
    inv.kind === "deposit" ? "50% Down Payment" : inv.kind === "final" ? "Final Payment" : "Invoice";
  const decided = Boolean(inv.paymentChoice);
  const paid = inv.status === "paid";
  const financed = inv.status === "financed";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-orange-500 text-xl font-bold text-white">
            H
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{companyName}</div>
            <div className="text-xs text-slate-500">Invoice — {kindLabel}</div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow">
          {/* Title bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-6 py-5">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Invoice {inv.number}</h1>
              <p className="text-sm text-slate-500">{kindLabel}</p>
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

          {/* Amount */}
          <div className="border-b border-slate-100 px-6 py-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-sm text-slate-500">Amount due</div>
                <div className="text-4xl font-bold text-slate-900">{money(inv.amount)}</div>
                <div className="mt-1 text-sm text-slate-500">
                  Project total: {money(inv.contractTotal)}
                </div>
              </div>
              <div className="text-sm text-slate-500">
                <div>
                  <span className="font-medium text-slate-700">Issued:</span>{" "}
                  {fmtDate(inv.sentAt ?? inv.createdAt)}
                </div>
                <div>
                  <span className="font-medium text-slate-700">Due:</span>{" "}
                  {inv.dueDate ? fmtDate(inv.dueDate) : "Upon receipt"}
                </div>
              </div>
            </div>
          </div>

          {/* Status banners */}
          {paid && (
            <div className="bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-700">
              ✓ This invoice is paid in full. Thank you!
            </div>
          )}
          {financed && (
            <div className="bg-amber-50 px-6 py-3 text-sm font-semibold text-amber-700">
              This amount is being financed — we&apos;ll be in touch shortly to complete
              your financing application. No payment is needed right now.
            </div>
          )}
          {decided && inv.paymentChoice === "direct" && !paid && (
            <div className="bg-sky-50 px-6 py-3 text-sm font-semibold text-sky-700">
              Thanks! We&apos;ve noted you&apos;re paying this directly. Our office will
              reach out to arrange payment, or feel free to call us.
            </div>
          )}

          {/* Pay / Finance choice */}
          {!paid && !financed && !decided && (
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-5">
              <div className="mb-3 text-sm font-semibold text-slate-700">
                How would you like to take care of this balance?
              </div>
              <div className="flex flex-wrap gap-3">
                <form action={customerInvoiceChoice}>
                  <input type="hidden" name="token" value={token} />
                  <input type="hidden" name="choice" value="direct" />
                  <button className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                    Pay This Amount
                  </button>
                </form>
                <form action={customerInvoiceChoice}>
                  <input type="hidden" name="token" value={token} />
                  <input type="hidden" name="choice" value="finance" />
                  <button className="rounded-lg border border-amber-500 bg-white px-6 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-50">
                    Finance This Amount
                  </button>
                </form>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Choosing financing pauses this payment — we&apos;ll contact you to set up
                a monthly payment plan instead.
              </p>
            </div>
          )}

          {/* Notes */}
          {inv.notes && (
            <div className="border-t border-slate-100 px-6 py-5 text-sm">
              <div className="font-medium text-slate-700">Notes</div>
              <p className="text-slate-500">{inv.notes}</p>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">Powered by {APP_NAME}</p>
        <p className="mt-1 text-center text-[11px] text-slate-400">{copyright()}</p>
      </div>
    </main>
  );
}
