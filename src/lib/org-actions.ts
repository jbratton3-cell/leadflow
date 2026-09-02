"use server";

import { db } from "@/db";
import { organizations, estimates } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAccess } from "@/lib/auth";

export async function updateCashDiscount(formData: FormData) {
  const { orgId } = await requireAccess("settings");
  const raw = Number((formData.get("cashDiscountPercent") ?? "0").toString());
  const pct = Number.isNaN(raw) ? 0 : Math.min(100, Math.max(0, raw));
  await db
    .update(organizations)
    .set({ cashDiscountPercent: pct.toFixed(2) })
    .where(eq(organizations.id, orgId));
  // Open quotes inherit the new rate so reps don't re-key every draft.
  await db
    .update(estimates)
    .set({ cashDiscountPercent: pct.toFixed(2), updatedAt: new Date() })
    .where(
      and(
        eq(estimates.orgId, orgId),
        inArray(estimates.status, ["draft", "sent", "viewed"])
      )
    );
  revalidatePath("/settings");
  revalidatePath("/estimates");
}
