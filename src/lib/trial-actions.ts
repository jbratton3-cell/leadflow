"use server";

import { randomBytes } from "crypto";
import { db } from "@/db";
import { leads, estimates, estimateItems, invoices, jobs, sales, products, leadSources, organizations } from "@/db/schema";
import { eq, and, like, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

const MARKER = "[leadflow-sample]";

async function requireTrial() {
  const user = await requireUser();
  const [org] = await db.select().from(organizations).where(eq(organizations.id, user.orgId)).limit(1);
  if (!org || org.plan !== "trial") return null;
  return user;
}

// Seed a realistic mini-dataset for guided trial exploration.
export async function loadSampleData() {
  const user = await requireTrial();
  if (!user) return;

  // idempotent: skip if sample lead already exists
  const existing = await db
    .select({ id: leads.id })
    .from(leads)
    .where(and(eq(leads.orgId, user.orgId), eq(leads.notes, MARKER)))
    .limit(1);
  if (existing[0]) {
    revalidatePath("/dashboard");
    return;
  }

  const [src] = await db
    .insert(leadSources)
    .values({ orgId: user.orgId, name: "Sample — Facebook Ads", category: "internet", monthlyCost: "0" })
    .returning();
  const [prod] = await db
    .insert(products)
    .values({ orgId: user.orgId, name: "Sample — Window Replacement", active: true })
    .returning();

  const [lead] = await db
    .insert(leads)
    .values({
      orgId: user.orgId,
      firstName: "Danny",
      lastName: "Demo",
      email: user.email, // so the trial estimate lands in THEIR inbox
      phone: "(555) 010-1234",
      address: "42 Sample Street",
      city: "Albany",
      state: "NY",
      zip: "12205",
      sourceId: src?.id ?? null,
      productId: prod?.id ?? null,
      estimatedValue: "8450",
      notes: MARKER,
      stage: "new",
    })
    .returning();

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(estimates)
    .where(eq(estimates.orgId, user.orgId));

  const [est] = await db
    .insert(estimates)
    .values({
      orgId: user.orgId,
      leadId: lead.id,
      number: `EST-${String(1001 + Number(count ?? 0)).padStart(4, "0")}`,
      title: "Sample — Window Replacement Estimate",
      status: "draft",
      subtotal: "8450",
      taxRate: "0",
      taxAmount: "0",
      discount: "0",
      total: "8450",
      notes: "This is sample data — you can remove it anytime.",
      publicToken: randomBytes(24).toString("hex"),
    })
    .returning();

  await db.insert(estimateItems).values([
    { orgId: user.orgId, estimateId: est.id, description: "Sample — 6 double-hung windows, installed", quantity: "1", unitPrice: "7200", amount: "7200", sortOrder: 0 },
    { orgId: user.orgId, estimateId: est.id, description: "Sample — interior trim & finish", quantity: "1", unitPrice: "1250", amount: "1250", sortOrder: 1 },
  ]);

  revalidatePath("/dashboard");
  revalidatePath("/leads");
  revalidatePath("/estimates");
}

// Remove everything the sample created.
export async function clearSampleData() {
  const user = await requireTrial();
  if (!user) return;

  const sampleLeads = await db
    .select({ id: leads.id })
    .from(leads)
    .where(and(eq(leads.orgId, user.orgId), eq(leads.notes, MARKER)));

  for (const { id } of sampleLeads) {
    const estRows = await db.select({ id: estimates.id }).from(estimates).where(eq(estimates.leadId, id));
    for (const e of estRows) {
      await db.delete(estimateItems).where(eq(estimateItems.estimateId, e.id));
    }
    await db.delete(estimates).where(eq(estimates.leadId, id));
    await db.delete(invoices).where(eq(invoices.leadId, id));
    await db.delete(jobs).where(eq(jobs.leadId, id));
    await db.delete(sales).where(eq(sales.leadId, id));
    await db.delete(leads).where(eq(leads.id, id));
  }

  await db.delete(leadSources).where(and(eq(leadSources.orgId, user.orgId), like(leadSources.name, "Sample —%")));
  await db.delete(products).where(and(eq(products.orgId, user.orgId), like(products.name, "Sample —%")));

  revalidatePath("/dashboard");
  revalidatePath("/leads");
  revalidatePath("/estimates");
}
