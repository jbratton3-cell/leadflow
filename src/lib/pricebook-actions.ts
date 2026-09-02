"use server";

import { db } from "@/db";
import { pricebookItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

function req(v: FormDataEntryValue | null): string {
  return (v ?? "").toString().trim();
}

export async function createPricebookItem(formData: FormData) {
  const { orgId } = await requireUser();
  await db.insert(pricebookItems).values({
    orgId,
    name: req(formData.get("name")),
    description: req(formData.get("description")) || null,
    price: req(formData.get("price")) || "0",
    unit: req(formData.get("unit")) || "",
    category: req(formData.get("category")) || "Uncategorized",
    active: true,
  });
  revalidatePath("/settings");
  revalidatePath("/estimates");
}

export async function deletePricebookItem(formData: FormData) {
  const { orgId } = await requireUser();
  const id = Number(formData.get("id"));
  await db
    .update(pricebookItems)
    .set({ active: false })
    .where(and(eq(pricebookItems.id, id), eq(pricebookItems.orgId, orgId)));
  revalidatePath("/settings");
  revalidatePath("/estimates");
}
