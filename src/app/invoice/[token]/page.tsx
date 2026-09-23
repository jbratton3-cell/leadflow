import Link from "next/link";
import { db } from "@/db";
import { invoices, leads } from "@/db/schema";
import { eq } from "drizzle-orm";
import { markInvoiceViewed, customerInvoiceChoice } from "@/lib/invoice-actions";
import { getSessionUser } from "@/lib/auth";
import { money, fmtDate, copyright, BUSINESS_NAME, APP_NAME, personName } from "@/lib/constants";
import { WISETACK_PREQUAL_URL } from "@/components/WisetackPrequalNote";
import PayPalInvoiceCheckout from "@/components/PayPalInvoiceCheckout";
import { paypalMode, paypalPublicClientId } from "@/lib/paypal";

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

  // CRM users previewing get a way back; customers see nothing.
  const internalUser = await getSessionUser();

  const [lead] = await db
    .select()
    .from(leads)
    .where(eq(leads.id, inv.leadId))
    .limit(1);

  const companyName = process.env.CRM_ORGANIZATION_NAME ?? BUSINESS_NAME;
  const kindLabel =
    inv.kind === "deposit" ? "50% Down Payment" : inv.kind === "final" ? "Final Payment" : "Invoice";
  const decided = Boolean(inv.paymentChoice);
  const paid = inv.status === "paid";
  const financed = inv.status === "financed";
  const paypalClientId = paypalPublicClientId();
  const payingOnline = inv.paymentChoice === "card" && !paid && !financed;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        {internalUser && (
          <div className="mb-4 flex items-center justify-between rounded-xl bg-white px-4 py-2.5 shadow-sm">
            <Link href="/invoices" className="text-sm font-medium text-orange-600 hover:underline">
              &larr; Back to Invoices
            </Link>
            <span className="text-xs text-slate-400">Previewing as {internalUser.name}</span>
          </div>
        )}
        {/* Header */}
        <div className="mb-6 flex items-end gap-3">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/buildpros-logo.png" alt={companyName} className="h-12 w-auto" />
            <div className="mt-1 text-xs text-slate-500">Invoice — {kindLabel}</div>
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
          {decided && (inv.paymentChoice === "cash" || inv.paymentChoice === "direct") && !paid && (
            <div className="bg-sky-50 px-6 py-3 text-sm font-semibold text-sky-700">
              Thanks! We&apos;ve noted you&apos;re paying by cash or check. Our office will
              reach out to coordinate payment.
            </div>
          )}
          {inv.paypalStatus === "PENDING" && !paid && (
            <div className="bg-amber-50 px-6 py-3 text-sm font-semibold text-amber-800">
              PayPal is still processing this payment. We&apos;ll update the invoice as soon as it clears.
            </div>
          )}

          {/* Card / PayPal checkout for the standard-price payment route */}
          {payingOnline && (
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-5">
              {paypalClientId ? (
                <PayPalInvoiceCheckout
                  clientId={paypalClientId}
                  token={token}
                  amountLabel={money(inv.amount)}
                  sandbox={paypalMode() === "sandbox"}
                />
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Online checkout is temporarily unavailable. Please contact our office before sending payment.
                </div>
              )}
            </div>
          )}

          {/* Pay / Finance choice — legacy final invoices only */}
          {inv.kind === "final" && !paid && !financed && !decided && (
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-5">
              <div className="mb-3 text-sm font-semibold text-slate-700">
                How would you like to take care of this balance?
              </div>
              <div className="flex flex-wrap gap-3">
                <form action={customerInvoiceChoice}>
                  <input type="hidden" name="token" value={token} />
                  <input type="hidden" name="choice" value="cash" />
                  <button className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                    Pay by Cash or Check
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
                Select Finance This Amount above, then use the prequalification link to begin your
                application through Wisetack.
              </p>
              <a
                href={WISETACK_PREQUAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex rounded-lg border border-orange-300 bg-white px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
              >
                Prequalify for financing ↗
              </a>
            </div>
          )}

          {/* Cash/check deposit invoices: office coordinates collection. */}
          {inv.kind !== "final" && !paid && !financed && inv.paymentChoice !== "card" && (
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-5 text-sm text-slate-500">
              <span className="font-medium text-slate-700">This down payment is due upon receipt.</span>{" "}
              Our office will reach out to coordinate your cash or check payment.
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
