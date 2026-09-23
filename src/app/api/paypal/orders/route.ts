import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { BUSINESS_NAME } from "@/lib/constants";
import {
  captureFromOrder,
  createPayPalOrder,
  ensurePayPalColumns,
  getPayPalOrder,
  paypalConfigured,
} from "@/lib/paypal";
import { completePayPalInvoicePayment } from "@/lib/paypal-payment-actions";

export const dynamic = "force-dynamic";

function amountValue(value: string): string | null {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount.toFixed(2);
}

export async function POST(req: Request) {
  if (!paypalConfigured()) {
    return NextResponse.json({ error: "Online payments are not available." }, { status: 503 });
  }

  let token = "";
  try {
    const body = (await req.json()) as { token?: unknown };
    token = typeof body.token === "string" ? body.token.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!token) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });

  await ensurePayPalColumns();
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.publicToken, token))
    .limit(1);
  if (
    !invoice ||
    invoice.status === "paid" ||
    invoice.status === "void" ||
    invoice.status === "financed" ||
    invoice.paymentChoice !== "card"
  ) {
    return NextResponse.json({ error: "This invoice is not available for online payment." }, { status: 409 });
  }

  const amount = amountValue(invoice.amount);
  if (!amount) return NextResponse.json({ error: "Invalid invoice amount." }, { status: 409 });

  if (invoice.paypalOrderId) {
    try {
      const existing = await getPayPalOrder(invoice.paypalOrderId);
      if (existing.status === "COMPLETED") {
        const capture = captureFromOrder(existing);
        if (capture?.status === "COMPLETED") {
          await completePayPalInvoicePayment({ invoiceId: invoice.id, order: existing, capture });
          return NextResponse.json({ id: existing.id, status: "COMPLETED" });
        }
      }
      if (["CREATED", "SAVED", "APPROVED", "PAYER_ACTION_REQUIRED"].includes(existing.status)) {
        return NextResponse.json({ id: existing.id, status: existing.status });
      }
    } catch (err) {
      console.error("Existing PayPal order lookup failed", invoice.id, err);
    }
  }

  try {
    const order = await createPayPalOrder({
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      amount,
      description: invoice.kind === "deposit" ? "50% deposit" : invoice.kind === "final" ? "Final payment" : "Invoice payment",
      brandName: process.env.CRM_ORGANIZATION_NAME || BUSINESS_NAME,
    });
    await db
      .update(invoices)
      .set({
        paypalOrderId: order.id,
        paypalStatus: order.status,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoice.id));
    return NextResponse.json({ id: order.id, status: order.status });
  } catch (err) {
    console.error("PayPal order creation failed", invoice.id, err);
    return NextResponse.json(
      { error: "PayPal could not start the payment. Please try again." },
      { status: 502 },
    );
  }
}
