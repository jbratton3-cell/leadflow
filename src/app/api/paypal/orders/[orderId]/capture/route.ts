import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  captureFromOrder,
  capturePayPalOrder,
  ensurePayPalColumns,
  getPayPalOrder,
  paypalConfigured,
  type PayPalOrder,
} from "@/lib/paypal";
import { completePayPalInvoicePayment } from "@/lib/paypal-payment-actions";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  if (!paypalConfigured()) {
    return NextResponse.json({ error: "Online payments are not available." }, { status: 503 });
  }

  const { orderId: rawOrderId } = await params;
  const orderId = rawOrderId.trim();
  let token = "";
  try {
    const body = (await req.json()) as { token?: unknown };
    token = typeof body.token === "string" ? body.token.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!orderId || !token) {
    return NextResponse.json({ error: "Invalid payment request." }, { status: 400 });
  }

  await ensurePayPalColumns();
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.publicToken, token))
    .limit(1);
  if (
    !invoice ||
    invoice.status === "void" ||
    invoice.status === "financed" ||
    invoice.paymentChoice !== "card"
  ) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }
  if (invoice.paypalOrderId !== orderId) {
    return NextResponse.json({ error: "Payment does not match this invoice." }, { status: 409 });
  }
  if (invoice.status === "paid" && invoice.paypalOrderId === orderId) {
    return NextResponse.json({ success: true, alreadyPaid: true });
  }

  let order: PayPalOrder;
  try {
    order = await getPayPalOrder(orderId);
    if (order.status !== "COMPLETED") {
      order = await capturePayPalOrder(orderId);
    }
  } catch (err) {
    console.error("PayPal approval/capture failed", invoice.id, orderId, err);
    return NextResponse.json(
      { error: "PayPal did not approve the payment. Please check the payment details and try again." },
      { status: 502 },
    );
  }

  const capture = captureFromOrder(order);
  if (!capture || capture.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "PayPal has not completed the payment yet. Please do not submit it again." },
      { status: 409 },
    );
  }

  try {
    const result = await completePayPalInvoicePayment({
      invoiceId: invoice.id,
      order,
      capture,
    });
    return NextResponse.json({ success: result.paid, alreadyPaid: result.alreadyPaid });
  } catch (err) {
    console.error("PayPal captured but invoice update failed", invoice.id, orderId, err);
    return NextResponse.json(
      {
        error:
          "PayPal approved the payment, but the invoice update is still pending. Do not pay again. Please contact our office with your PayPal confirmation.",
      },
      { status: 500 },
    );
  }
}
