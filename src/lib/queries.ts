import { db } from "@/db";
import { reps, leadSources, products } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

export async function getReps() {
  const { orgId } = await requireUser();
  return db
    .select()
    .from(reps)
    .where(and(eq(reps.orgId, orgId), eq(reps.active, true)))
    .orderBy(asc(reps.name));
}

export async function getSalesReps() {
  const all = await getReps();
  return all.filter((r) => r.role === "sales" || r.role === "admin");
}

export async function getCallReps() {
  const all = await getReps();
  return all.filter((r) => r.role === "call_center" || r.role === "admin");
}

export async function getSources() {
  const { orgId } = await requireUser();
  return db
    .select()
    .from(leadSources)
    .where(and(eq(leadSources.orgId, orgId), eq(leadSources.active, true)))
    .orderBy(asc(leadSources.name));
}

export async function getProducts() {
  const { orgId } = await requireUser();
  return db
    .select()
    .from(products)
    .where(and(eq(products.orgId, orgId), eq(products.active, true)))
    .orderBy(asc(products.name));
}

export function toMap<T extends { id: number }>(rows: T[]) {
  const m = new Map<number, T>();
  for (const r of rows) m.set(r.id, r);
  return m;
}
