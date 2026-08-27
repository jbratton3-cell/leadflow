"use server";

import { db } from "@/db";
import { documents, leads } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { requireUser } from "@/lib/auth";

// Record an uploaded scan against a lead.
export async function saveDocument(opts: {
  leadId: number;
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}) {
  const user = await requireUser();
  const [lead] = await db
    .select({ id: leads.id })
    .from(leads)
    .where(and(eq(leads.id, opts.leadId), eq(leads.orgId, user.orgId)))
    .limit(1);
  if (!lead) throw new Error("Prospect not found");

  await db.insert(documents).values({
    orgId: user.orgId,
    leadId: opts.leadId,
    fileName: opts.fileName,
    mimeType: opts.mimeType,
    sizeBytes: opts.sizeBytes,
    url: opts.url,
    uploadedById: user.id,
  });

  revalidatePath(`/leads/${opts.leadId}`);
}

// Remove a document record and its stored file (admin/manager only).
export async function deleteDocument(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "admin" && user.role !== "manager") {
    throw new Error("Not allowed");
  }
  const id = Number(formData.get("id"));
  const leadId = Number(formData.get("leadId"));
  if (!id) return;

  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.orgId, user.orgId)))
    .limit(1);
  if (!doc) return;

  try {
    await del([doc.url]);
  } catch (err) {
    console.error("Blob delete failed:", err);
  }
  await db.delete(documents).where(eq(documents.id, id));

  revalidatePath(`/leads/${leadId}`);
}
