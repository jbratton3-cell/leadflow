import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  captureFromOrder,
  ensurePayPalColumns,
  getPayPalOrder,
  invoiceIdFromCustomId,
  paypalConfigured,
  verifyPayPalWebhook,
  type PayPalCapture,
} from "@/lib/paypal";
import {
  completePayPalInvoicePayment,
  updatePayPalInvoiceStatus,
} from "@/lib/paypal-payment-actions";

export const dynamic = "force-dynamic";

// PayPal's dashboard may validate the URL before the webhook credentials are
// installed. Keep that health check public; actual events still require a
// verified PayPal signature in POST below.
export async function GET() {
  return NextResponse.json({ ok: true, service: "LeadFlow PayPal webhook" });
}

type PayPalWebhookEvent = {
  id?: string;
  event_type?: string;
  resource?: PayPalCapture;
};

export async function POST(req: Request) {
  if (!paypalConfigured()) {
    return NextResponse.json({ error: "PayPal is not configured." }, { status: 503 });
  }

  let event: PayPalWebhookEvent;
  try {
    event = (await req.json()) as PayPalWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  try {
    const verified = await verifyPayPalWebhook(req.headers, event);
    if (!verified) {
      console.warn("Rejected unverified PayPal webhook", event.id);
      return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
    }
  } catch (err) {
    console.error("PayPal webhook verification failed", event.id, err);
    return NextResponse.json({ error: "Verification failed." }, { status: 401 });
  }

  await ensurePayPalColumns();
  const type = event.event_type ?? "";
  const resource = event.resource;
  const orderId = resource?.supplementary_data?.related_ids?.order_id;
  if (!resource || !orderId) return NextResponse.json({ received: true });

  try {
    if (type === "PAYMENT.CAPTURE.COMPLETED") {
      const order = await getPayPalOrder(orderId);
      const capture = captureFromOrder(order) ?? resource;
      const customId = order.purchase_units?.[0]?.custom_id ?? resource.custom_id;
      let invoiceId = invoiceIdFromCustomId(customId);
      if (!invoiceId) {
        const [invoice] = await db
          .select({ id: invoices.id })
          .from(invoices)
          .where(eq(invoices.paypalOrderId, orderId))
          .limit(1);
        invoiceId = invoice?.id ?? null;
      }
      if (!invoiceId) throw new Error("No LeadFlow invoice for PayPal order");
      await completePayPalInvoicePayment({ invoiceId, order, capture });
    } else if (
      [
        "PAYMENT.CAPTURE.PENDING",
        "PAYMENT.CAPTURE.DENIED",
        "PAYMENT.CAPTURE.REFUNDED",
        "PAYMENT.CAPTURE.REVERSED",
      ].includes(type)
    ) {
      await updatePayPalInvoiceStatus({
        orderId,
        status: type.replace("PAYMENT.CAPTURE.", ""),
        captureId: resource.id,
      });
    }
  } catch (err) {
    console.error("PayPal webhook processing failed", event.id, type, err);
    // Returning 500 asks PayPal to retry transient failures.
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
