"use server";

import { db } from "@/db";
import {
  leads,
  estimates,
  estimateItems,
  sales,
  jobs,
  invoices,
  callLogs,
  appointments,
  documents,
} from "@/db/schema";
import { eq, and, asc, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

// Deleting is an admin/manager ability.
async function requireDeletePermission() {
  const user = await requireUser();
  if (user.role !== "admin" && user.role !== "manager") {
    redirect("/dashboard?denied=1");
  }
  return user;
}

// Delete a lead and everything attached to it (estimates, sales, jobs, invoices).
export async function deleteLead(formData: FormData) {
  const { orgId } = await requireDeletePermission();
  const id = Number(formData.get("id"));
  if (!id) return;

  const estRows = await db
    .select({ id: estimates.id })
    .from(estimates)
    .where(and(eq(estimates.orgId, orgId), eq(estimates.leadId, id)));
  const estIds = estRows.map((e) => e.id);

  if (estIds.length > 0) {
    await db.delete(estimateItems).where(inArray(estimateItems.estimateId, estIds));
  }
  await db.delete(estimates).where(and(eq(estimates.orgId, orgId), eq(estimates.leadId, id)));
  await db.delete(invoices).where(and(eq(invoices.orgId, orgId), eq(invoices.leadId, id)));
  await db.delete(jobs).where(and(eq(jobs.orgId, orgId), eq(jobs.leadId, id)));
  await db.delete(sales).where(and(eq(sales.orgId, orgId), eq(sales.leadId, id)));
  await db.delete(leads).where(and(eq(leads.id, id), eq(leads.orgId, orgId)));

  revalidatePath("/leads");
  revalidatePath("/estimates");
  revalidatePath("/sales");
  revalidatePath("/production");
  revalidatePath("/invoices");
  revalidatePath("/");
  redirect("/leads");
}

export async function removeExactDuplicateLeads(): Promise<{
  deleted?: number;
  skipped?: number;
  error?: string;
}> {
  const { orgId } = await requireDeletePermission();
  const rows = await db
    .select()
    .from(leads)
    .where(eq(leads.orgId, orgId))
    .orderBy(asc(leads.createdAt), asc(leads.id));

  const groups = new Map<string, typeof rows>();
  for (const lead of rows) {
    const fingerprint = [
      lead.firstName,
      lead.lastName,
      lead.email,
      lead.phone,
      lead.altPhone,
      lead.address,
      lead.city,
      lead.state,
      lead.zip,
      lead.sourceId,
      lead.productId,
      lead.estimatedValue,
      lead.notes,
    ]
      .map((value) => (value ?? "").toString().trim().toLowerCase())
      .join("|");
    const group = groups.get(fingerprint) ?? [];
    group.push(lead);
    groups.set(fingerprint, group);
  }

  const candidates = Array.from(groups.values())
    .filter((group) => group.length > 1)
    .flatMap((group) => group.slice(1));
  if (candidates.length === 0) return { deleted: 0, skipped: 0 };

  const candidateIds = candidates.map((lead) => lead.id);
  const linkedIds = new Set<number>();
  const linkedQueries = await Promise.all([
    db
      .select({ leadId: callLogs.leadId })
      .from(callLogs)
      .where(and(eq(callLogs.orgId, orgId), inArray(callLogs.leadId, candidateIds))),
    db
      .select({ leadId: appointments.leadId })
      .from(appointments)
      .where(and(eq(appointments.orgId, orgId), inArray(appointments.leadId, candidateIds))),
    db
      .select({ leadId: sales.leadId })
      .from(sales)
      .where(and(eq(sales.orgId, orgId), inArray(sales.leadId, candidateIds))),
    db
      .select({ leadId: jobs.leadId })
      .from(jobs)
      .where(and(eq(jobs.orgId, orgId), inArray(jobs.leadId, candidateIds))),
    db
      .select({ leadId: estimates.leadId })
      .from(estimates)
      .where(and(eq(estimates.orgId, orgId), inArray(estimates.leadId, candidateIds))),
    db
      .select({ leadId: invoices.leadId })
      .from(invoices)
      .where(and(eq(invoices.orgId, orgId), inArray(invoices.leadId, candidateIds))),
    db
      .select({ leadId: documents.leadId })
      .from(documents)
      .where(and(eq(documents.orgId, orgId), inArray(documents.leadId, candidateIds))),
  ]);
  for (const query of linkedQueries) {
    for (const row of query) {
      if (row.leadId) linkedIds.add(row.leadId);
    }
  }

  const deletableIds = candidateIds.filter((id) => !linkedIds.has(id));
  if (deletableIds.length > 0) {
    await db.delete(leads).where(and(eq(leads.orgId, orgId), inArray(leads.id, deletableIds)));
  }

  revalidatePath("/import");
  revalidatePath("/leads");
  revalidatePath("/");
  return {
    deleted: deletableIds.length,
    skipped: candidates.length - deletableIds.length,
  };
}

// Delete a production job (and any invoices tied to it).
export async function deleteJob(formData: FormData) {
  const { orgId } = await requireDeletePermission();
  const id = Number(formData.get("id"));
  if (!id) return;

  await db.delete(invoices).where(and(eq(invoices.orgId, orgId), eq(invoices.jobId, id)));
  await db.delete(jobs).where(and(eq(jobs.id, id), eq(jobs.orgId, orgId)));

  revalidatePath("/production");
  revalidatePath("/invoices");
  revalidatePath("/");
}

// Delete a sales record. Linked jobs stay but fall back to their contract amount.
export async function deleteSale(formData: FormData) {
  const { orgId } = await requireDeletePermission();
  const id = Number(formData.get("id"));
  if (!id) return;

  await db.delete(sales).where(and(eq(sales.id, id), eq(sales.orgId, orgId)));

  revalidatePath("/sales");
  revalidatePath("/");
}
