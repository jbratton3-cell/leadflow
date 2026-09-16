import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, leads } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { buildPaymentReceiptPdf } from "@/lib/payment-receipt-pdf";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id: raw } = await params;
  const id = Number(raw);
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.orgId, user.orgId)))
    .limit(1);
  if (!invoice || invoice.status !== "paid") {
    return NextResponse.json({ error: "A receipt is available only for paid invoices." }, { status: 404 });
  }

  const [lead] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, invoice.leadId), eq(leads.orgId, user.orgId)))
    .limit(1);

  const pdfBytes = await buildPaymentReceiptPdf({
    invoice,
    lead: lead ?? null,
    orgName: process.env.CRM_ORGANIZATION_NAME || "LeadFlow",
  });

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.number}-receipt.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}