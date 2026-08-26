"use server";

import { db } from "@/db";
import { leads, estimates, estimateItems, sales, jobs, invoices } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
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
