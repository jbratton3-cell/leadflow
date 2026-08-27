import { NextResponse } from "next/server";
import { db } from "@/db";
import { estimates, estimateItems, leads } from "@/db/schema";
import { and, eq, asc } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { buildSignedEstimatePdf } from "@/lib/estimate-pdf";

// Streams a PDF of a (signed) estimate. CRM users only, org-scoped.
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: raw } = await params;
  const id = Number(raw);
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [est] = await db
    .select()
    .from(estimates)
    .where(and(eq(estimates.id, id), eq(estimates.orgId, user.orgId)))
    .limit(1);
  if (!est) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [items, leadRows] = await Promise.all([
    db
      .select()
      .from(estimateItems)
      .where(eq(estimateItems.estimateId, id))
      .orderBy(asc(estimateItems.sortOrder)),
    db.select().from(leads).where(eq(leads.id, est.leadId)).limit(1),
  ]);

  const pdfBytes = await buildSignedEstimatePdf({
    est,
    items,
    lead: leadRows[0] ?? null,
    orgName: process.env.CRM_ORGANIZATION_NAME || "LeadFlow",
  });

  const fileName = `${est.number}${est.signatureData ? "-signed" : ""}.pdf`;
  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
