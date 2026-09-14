"use server";

import { del } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { expenses, jobs } from "@/db/schema";
import { requireUser } from "@/lib/auth";

function textValue(value: FormDataEntryValue | null): string | null {
  const text = (value ?? "").toString().trim();
  return text === "" ? null : text;
}

function requireAdmin() {
  return requireUser().then((user) => {
    if (user.role !== "admin") redirect("/dashboard?denied=1");
    return user;
  });
}

function parseAmount(value: FormDataEntryValue | null): number {
  const amount = Number((value ?? "").toString());
  return Number.isFinite(amount) ? amount : 0;
}

function parsePurchaseDate(value: FormDataEntryValue | null): Date {
  const raw = (value ?? "").toString().trim();
  if (!raw) return new Date();
  const date = new Date(`${raw}T12:00:00`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export async function createExpense(formData: FormData) {
  const user = await requireAdmin();
  const jobId = Number(formData.get("jobId"));
  const amount = parseAmount(formData.get("amount"));
  const category = (formData.get("category") ?? "").toString().trim();

  if (!jobId || !category || amount <= 0) {
    throw new Error("Job, category, and a positive amount are required.");
  }

  const [job] = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.orgId, user.orgId)))
    .limit(1);
  if (!job) throw new Error("Job not found.");

  await db.insert(expenses).values({
    orgId: user.orgId,
    jobId,
    category,
    vendor: textValue(formData.get("vendor")),
    amount: amount.toFixed(2),
    purchaseDate: parsePurchaseDate(formData.get("purchaseDate")),
    paidBy: textValue(formData.get("paidBy")),
    notes: textValue(formData.get("notes")),
    receiptUrl: textValue(formData.get("receiptUrl")),
    receiptFileName: textValue(formData.get("receiptFileName")),
    receiptMimeType: textValue(formData.get("receiptMimeType")),
    receiptSizeBytes: Number(formData.get("receiptSizeBytes")) || null,
    enteredById: user.id,
  });

  revalidatePath("/expenses");
  revalidatePath("/production");
  redirect("/expenses?created=1");
}

export async function deleteExpense(formData: FormData) {
  const user = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;

  const [expense] = await db
    .select()
    .from(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.orgId, user.orgId)))
    .limit(1);
  if (!expense) return;

  if (expense.receiptUrl) {
    try {
      await del(expense.receiptUrl);
    } catch (error) {
      console.error("Receipt delete failed:", error);
    }
  }

  await db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.orgId, user.orgId)));
  revalidatePath("/expenses");
  revalidatePath("/production");
}