"use server";

import { db } from "@/db";
import { leads, leadSources, products } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAccess } from "@/lib/auth";

export type ImportRow = Record<string, string>;

export type ImportResult = {
  imported: number;
  skipped: number;
  errors: string[];
};

const clean = (v: unknown) => (v ?? "").toString().trim();

function parseMoney(v: string): string {
  if (!v) return "0";
  const n = Number(v.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n.toString() : "0";
}

// Import a batch of mapped rows. Called repeatedly by the client wizard.
export async function importLeads(payload: {
  rows: ImportRow[];
  createMissing: boolean;
}): Promise<ImportResult> {
  const { orgId } = await requireAccess("import");

  const { rows, createMissing } = payload;
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

  // Build case-insensitive lookup maps for THIS org's sources & products.
  const srcRows = await db.select().from(leadSources).where(eq(leadSources.orgId, orgId));
  const prodRows = await db.select().from(products).where(eq(products.orgId, orgId));
  const srcMap = new Map(srcRows.map((s) => [s.name.toLowerCase(), s.id]));
  const prodMap = new Map(prodRows.map((p) => [p.name.toLowerCase(), p.id]));

  async function resolveSource(name: string): Promise<number | null> {
    if (!name) return null;
    const key = name.toLowerCase();
    if (srcMap.has(key)) return srcMap.get(key)!;
    if (!createMissing) return null;
    const [created] = await db
      .insert(leadSources)
      .values({ orgId, name, category: "internet" })
      .returning();
    srcMap.set(key, created.id);
    return created.id;
  }

  async function resolveProduct(name: string): Promise<number | null> {
    if (!name) return null;
    const key = name.toLowerCase();
    if (prodMap.has(key)) return prodMap.get(key)!;
    if (!createMissing) return null;
    const [created] = await db.insert(products).values({ orgId, name }).returning();
    prodMap.set(key, created.id);
    return created.id;
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      let firstName = clean(row.firstName);
      let lastName = clean(row.lastName);

      // Support a single "full name" column.
      const full = clean(row.fullName);
      if (full && !firstName) {
        const parts = full.split(/\s+/);
        firstName = parts.shift() ?? "";
        lastName = lastName || parts.join(" ");
      }

      const email = clean(row.email);
      const phone = clean(row.phone);

      // Skip rows with no identifying info at all.
      if (!firstName && !lastName && !email && !phone) {
        result.skipped++;
        continue;
      }
      if (!firstName && !lastName) {
        // Use email/phone as a fallback name so the record is usable.
        firstName = email || phone;
      }

      const sourceId = await resolveSource(clean(row.source));
      const productId = await resolveProduct(clean(row.product));

      await db.insert(leads).values({
        orgId,
        firstName: firstName || "(no name)",
        lastName: lastName || "",
        email: email || null,
        phone: phone || null,
        altPhone: clean(row.altPhone) || null,
        address: clean(row.address) || null,
        city: clean(row.city) || null,
        state: clean(row.state) || null,
        zip: clean(row.zip) || null,
        sourceId,
        productId,
        estimatedValue: parseMoney(clean(row.estimatedValue)),
        notes: clean(row.notes) || null,
        stage: "new",
      });
      result.imported++;
    } catch (e) {
      result.skipped++;
      result.errors.push(
        `Row ${i + 1}: ${e instanceof Error ? e.message : "import failed"}`
      );
    }
  }

  revalidatePath("/leads");
  revalidatePath("/");
  return result;
}
