import { NextResponse } from "next/server";
import { db } from "@/db";
import { estimates, estimateItems, leads, estimatePhotos } from "@/db/schema";
import { and, eq, asc, ne } from "drizzle-orm";
import { buildSignedEstimatePdf } from "@/lib/estimate-pdf";

// Public estimate PDF for customers and reps opening the customer view.
// The public token is the access credential, just like the customer view page.
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [est] = await db
    .select()
    .from(estimates)
    .where(and(eq(estimates.publicToken, token), ne(estimates.status, "draft")))
    .limit(1);
  if (!est) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [items, leadRows, photos] = await Promise.all([
    db
      .select()
      .from(estimateItems)
      .where(eq(estimateItems.estimateId, est.id))
      .orderBy(asc(estimateItems.sortOrder)),
    db.select().from(leads).where(eq(leads.id, est.leadId)).limit(1),
    db
      .select()
      .from(estimatePhotos)
      .where(eq(estimatePhotos.estimateId, est.id))
      .orderBy(asc(estimatePhotos.createdAt)),
  ]);

  const pdfBytes = await buildSignedEstimatePdf({
    est,
    items,
    lead: leadRows[0] ?? null,
    orgName: process.env.CRM_ORGANIZATION_NAME || "LeadFlow",
    photos,
  });

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${est.number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}