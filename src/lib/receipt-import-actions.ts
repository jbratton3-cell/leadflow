"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { expenses, jobs, leads, properties, receiptImports } from "@/db/schema";
import { requireAccess } from "@/lib/auth";

function parsedItems(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.map((item) => String(item)).filter((item) => item.trim() !== "")
      : [];
  } catch {
    return [];
  }
}

function itemSummary(value: string | null): string {
  const items = parsedItems(value).map((item) => item.replace(/\s+/g, " ").trim());
  if (items.length === 0) return "No item description extracted";
  const shown = items.slice(0, 8);
  return `${shown.join("; ")}${
    items.length > shown.length
      ? `; plus ${items.length - shown.length} additional line item(s)`
      : ""
  }`;
}

function expenseNotes(receipt: typeof receiptImports.$inferSelect): string {
  const pieces = ["Assigned from the automated receipt review inbox."];
  if (receipt.orderNumber) pieces.push(`Order: ${receipt.orderNumber}.`);
  if (receipt.poJobName) pieces.push(`PO/job label: ${receipt.poJobName}.`);
  pieces.push(`Items: ${itemSummary(receipt.itemsJson)}.`);
  if (receipt.messageId) pieces.push(`Gmail Message-ID: ${receipt.messageId}.`);
  pieces.push(`Receipt SHA-256: ${receipt.receiptSha256}.`);
  return pieces.join(" ");
}

export async function assignReceiptToJob(formData: FormData) {
  const user = await requireAccess("job_financials");
  const receiptImportId = Number(formData.get("receiptImportId"));
  const jobId = Number(formData.get("jobId"));
  if (!receiptImportId || !jobId) {
    throw new Error("Receipt and job are required.");
  }

  const [job] = await db
    .select({
      id: jobs.id,
      customerAddress: jobs.customerAddress,
      leadAddress: leads.address,
      propertyAddress: properties.address,
    })
    .from(jobs)
    .leftJoin(leads, eq(jobs.leadId, leads.id))
    .leftJoin(properties, eq(jobs.propertyId, properties.id))
    .where(and(eq(jobs.id, jobId), eq(jobs.orgId, user.orgId)))
    .limit(1);
  if (!job) throw new Error("Job not found.");

  const expenseId = await db.transaction(async (tx) => {
    const [receipt] = await tx
      .update(receiptImports)
      .set({ status: "processing", updatedAt: new Date() })
      .where(
        and(
          eq(receiptImports.id, receiptImportId),
          eq(receiptImports.orgId, user.orgId),
          eq(receiptImports.status, "review"),
        ),
      )
      .returning();

    if (!receipt) return null;
    if (!receipt.total || Number(receipt.total) <= 0 || !receipt.purchaseDate) {
      throw new Error("This receipt is missing a valid amount or purchase date.");
    }

    const [created] = await tx
      .insert(expenses)
      .values({
        orgId: user.orgId,
        jobId,
        category: "materials_purchase",
        vendor: receipt.vendor ?? "Home Depot",
        amount: receipt.total,
        purchaseDate: receipt.purchaseDate,
        notes: expenseNotes(receipt),
        receiptFileName: receipt.fileName,
        receiptMimeType: receipt.mimeType,
        receiptSizeBytes: receipt.sizeBytes,
        receiptAddress:
          job.propertyAddress ?? job.customerAddress ?? job.leadAddress,
        enteredById: user.id,
      })
      .returning({ id: expenses.id });

    const receiptUrl = `/api/expense-receipts/${created.id}`;
    await tx
      .update(expenses)
      .set({ receiptUrl, updatedAt: new Date() })
      .where(eq(expenses.id, created.id));
    await tx
      .update(receiptImports)
      .set({
        expenseId: created.id,
        jobId,
        status: "imported",
        matchReason: `Assigned in Receipt Inbox to Job #${jobId} by ${user.name}`,
        updatedAt: new Date(),
      })
      .where(eq(receiptImports.id, receiptImportId));

    return created.id;
  });

  revalidatePath("/receipts");
  revalidatePath("/expenses");
  revalidatePath("/production");
  if (!expenseId) redirect("/receipts?already=1");
  redirect(`/receipts?assigned=1&expense=${expenseId}`);
}
