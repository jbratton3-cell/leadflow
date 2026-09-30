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

function parseAccountType(value: string): string {
  const key = value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const aliases: Record<string, string> = {
    homeowner: "homeowner",
    home_owner: "homeowner",
    property_management: "property_management",
    property_manager: "property_management",
    propertymanagement: "property_management",
    commercial: "commercial",
    other: "other",
  };
  return aliases[key] ?? "unclassified";
}

function parseBoolean(value: string): boolean {
  return ["true", "yes", "y", "1", "on", "standing", "recurring"].includes(
    value.toLowerCase(),
  );
}

function parseMoney(v: string): string {
  if (!v) return "0";
  const n = Number(v.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n.toString() : "0";
}

function parseImportedDate(value: string): Date | null {
  if (!value) return null;

  // Date-only imports use UTC noon so the calendar date remains stable when
  // displayed and measured in America/New_York.
  const ymd = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymd) {
    const parsed = new Date(Date.UTC(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]), 12));
    if (
      parsed.getUTCFullYear() === Number(ymd[1]) &&
      parsed.getUTCMonth() === Number(ymd[2]) - 1 &&
      parsed.getUTCDate() === Number(ymd[3])
    ) return parsed;
  }

  const mdy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    const parsed = new Date(Date.UTC(Number(mdy[3]), Number(mdy[1]) - 1, Number(mdy[2]), 12));
    if (
      parsed.getUTCFullYear() === Number(mdy[3]) &&
      parsed.getUTCMonth() === Number(mdy[1]) - 1 &&
      parsed.getUTCDate() === Number(mdy[2])
    ) return parsed;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid Lead Date: ${value}`);
  }
  return parsed;
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
      const importedCreatedAt = parseImportedDate(clean(row.createdAt));

      await db.insert(leads).values({
        orgId,
        firstName: firstName || "(no name)",
        lastName: lastName || "",
        company: clean(row.company) || null,
        email: email || null,
        phone: phone || null,
        altPhone: clean(row.altPhone) || null,
        address: clean(row.address) || null,
        city: clean(row.city) || null,
        state: clean(row.state) || null,
        zip: clean(row.zip) || null,
        accountType: parseAccountType(clean(row.accountType)),
        standingContract: parseBoolean(clean(row.standingContract)),
        sourceId,
        productId,
        estimatedValue: parseMoney(clean(row.estimatedValue)),
        notes: clean(row.notes) || null,
        stage: "new",
        ...(importedCreatedAt ? { createdAt: importedCreatedAt } : {}),
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
  revalidatePath("/dashboard");
  revalidatePath("/metrics");
  return result;
}
