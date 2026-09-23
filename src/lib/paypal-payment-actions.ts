import "server-only";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { hcpPayments, invoices, leads } from "@/db/schema";
import type { Invoice } from "@/db/schema";
import { money, personName } from "@/lib/constants";
import { paymentReceiptEmailHtml, sendEmail } from "@/lib/notify";
import { buildPaymentReceiptPdf } from "@/lib/payment-receipt-pdf";
import { syncInvoiceToQb } from "@/lib/qb-actions";
import {
  ensurePayPalColumns,
  invoiceIdFromCustomId,
  paymentSourceFromOrder,
  type PayPalCapture,
  type PayPalOrder,
} from "@/lib/paypal";

function cents(value: string | number | null | undefined): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : -1;
}

async function recordCollectedPayment(invoice: Invoice): Promise<void> {
  const [existing] = await db
    .select({ id: hcpPayments.id })
    .from(hcpPayments)
    .where(
      and(
        eq(hcpPayments.orgId, invoice.orgId),
        eq(hcpPayments.invoiceId, invoice.id),
      ),
    )
    .limit(1);
  if (existing) return;

  await db.insert(hcpPayments).values({
    orgId: invoice.orgId,
    leadId: invoice.leadId,
    jobId: invoice.jobId,
    invoiceId: invoice.id,
    receivedAt: invoice.paidAt ?? new Date(),
    amount: invoice.amount,
    feeAmount: invoice.paypalFeeAmount ?? "0",
    feeType: invoice.paypalFeeAmount ? "PayPal processing fee" : null,
    paymentType: `LeadFlow ${invoice.kind} payment`,
    jobReference: invoice.number,
    notes: `Recorded automatically from ${invoice.number} via ${invoice.paymentMethod || "PayPal"}.`,
  });
}

async function sendAutomaticReceipt(invoice: Invoice): Promise<void> {
  const [lead] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, invoice.leadId), eq(leads.orgId, invoice.orgId)))
    .limit(1);
  if (!lead?.email) return;

  const orgName = process.env.CRM_ORGANIZATION_NAME || "LeadFlow";
  const customerName = personName(lead.firstName, lead.lastName, "Customer");
  const paidInFull = invoice.kind === "final";
  const paymentDate = (invoice.paidAt ?? new Date()).toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const pdfBytes = await buildPaymentReceiptPdf({
    invoice,
    lead,
    orgName,
  });
  const sent = await sendEmail({
    to: lead.email,
    subject: `Payment receipt ${invoice.number} — ${paidInFull ? "Paid in full" : money(invoice.amount)}`,
    fromName: orgName,
    html: paymentReceiptEmailHtml({
      customerName,
      companyName: orgName,
      number: invoice.number,
      amount: money(invoice.amount),
      paymentType:
        invoice.kind === "deposit"
          ? "50% deposit"
          : invoice.kind === "final"
            ? "final payment"
            : "payment",
      paymentDate,
      paidInFull,
    }),
    attachments: [
      {
        filename: `${invoice.number}-receipt.pdf`,
        content: Buffer.from(pdfBytes),
        contentType: "application/pdf",
      },
    ],
  });
  if (!sent) console.error("Automatic PayPal receipt email failed", invoice.id);
}

export async function completePayPalInvoicePayment(opts: {
  invoiceId: number;
  order: PayPalOrder;
  capture: PayPalCapture;
}): Promise<{ paid: boolean; alreadyPaid: boolean }> {
  await ensurePayPalColumns();
  const { invoiceId, order, capture } = opts;
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  if (
    !invoice ||
    invoice.status === "void" ||
    invoice.status === "financed" ||
    invoice.paymentChoice !== "card"
  ) {
    throw new Error("Invoice is not payable");
  }

  const purchaseUnit = order.purchase_units?.[0];
  const customInvoiceId = invoiceIdFromCustomId(purchaseUnit?.custom_id ?? capture.custom_id);
  if (customInvoiceId !== invoice.id) throw new Error("PayPal invoice reference mismatch");
  if (capture.status !== "COMPLETED") throw new Error("PayPal payment is not complete");
  if (capture.amount?.currency_code !== "USD") throw new Error("PayPal currency mismatch");
  if (cents(capture.amount.value) !== cents(invoice.amount)) {
    throw new Error("PayPal amount mismatch");
  }
  if (invoice.paypalOrderId && invoice.paypalOrderId !== order.id) {
    throw new Error("PayPal order mismatch");
  }
  if (invoice.status === "paid") {
    if (invoice.paypalCaptureId === capture.id) return { paid: true, alreadyPaid: true };
    throw new Error("Invoice was already paid by another transaction");
  }

  const paidAt = new Date();
  const paymentSource = paymentSourceFromOrder(order);
  const fee = capture.seller_receivable_breakdown?.paypal_fee?.value ?? null;
  const [paidInvoice] = await db
    .update(invoices)
    .set({
      status: "paid",
      paymentChoice: "card",
      choiceAt: invoice.choiceAt ?? paidAt,
      paidAt,
      paymentMethod: paymentSource === "card" ? "Card via PayPal" : "PayPal",
      paypalOrderId: order.id,
      paypalCaptureId: capture.id,
      paypalStatus: capture.status,
      paypalPaymentSource: paymentSource,
      paypalPayerEmail: order.payer?.email_address ?? null,
      paypalFeeAmount: fee,
      updatedAt: paidAt,
    })
    .where(
      and(
        eq(invoices.id, invoice.id),
        ne(invoices.status, "paid"),
        ne(invoices.status, "void"),
      ),
    )
    .returning();

  if (!paidInvoice) {
    const [fresh] = await db.select().from(invoices).where(eq(invoices.id, invoice.id)).limit(1);
    if (fresh?.status === "paid" && fresh.paypalCaptureId === capture.id) {
      return { paid: true, alreadyPaid: true };
    }
    throw new Error("Invoice payment state changed");
  }

  await recordCollectedPayment(paidInvoice);
  await syncInvoiceToQb(paidInvoice.orgId, paidInvoice.id);
  try {
    await sendAutomaticReceipt(paidInvoice);
  } catch (err) {
    console.error("Automatic PayPal receipt failed", paidInvoice.id, err);
  }

  revalidatePath(`/invoice/${paidInvoice.publicToken}`);
  revalidatePath(`/invoices/${paidInvoice.id}`);
  revalidatePath("/invoices");
  revalidatePath("/sales");
  revalidatePath("/reports");
  revalidatePath("/");
  return { paid: true, alreadyPaid: false };
}

export async function updatePayPalInvoiceStatus(opts: {
  orderId: string;
  status: string;
  captureId?: string | null;
}): Promise<void> {
  await ensurePayPalColumns();
  await db
    .update(invoices)
    .set({
      paypalStatus: opts.status.slice(0, 30),
      paypalCaptureId: opts.captureId ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(invoices.paypalOrderId, opts.orderId));
}
