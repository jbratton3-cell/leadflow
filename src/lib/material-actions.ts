"use server";

import { db } from "@/db";
import { suppliers, materials, materialOrders, materialOrderItems, jobs, leads } from "@/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccess, requireUser } from "@/lib/auth";
import { sendEmail, materialOrderEmailHtml, getBaseUrl } from "@/lib/notify";

function req(v: FormDataEntryValue | null): string {
  return (v ?? "").toString().trim();
}

/* ------------------------- settings: suppliers ------------------------- */

export async function createSupplier(formData: FormData) {
  const { orgId } = await requireUser();
  await db.insert(suppliers).values({
    orgId,
    name: req(formData.get("name")),
    email: req(formData.get("email")) || null,
    phone: req(formData.get("phone")) || null,
    notes: req(formData.get("notes")) || null,
  });
  revalidatePath("/settings");
}

export async function deleteSupplier(formData: FormData) {
  const { orgId } = await requireUser();
  const id = Number(formData.get("id"));
  await db.delete(suppliers).where(and(eq(suppliers.id, id), eq(suppliers.orgId, orgId)));
  revalidatePath("/settings");
}

/* ------------------------- settings: materials ------------------------- */

export async function createMaterial(formData: FormData) {
  const { orgId } = await requireUser();
  await db.insert(materials).values({
    orgId,
    name: req(formData.get("name")),
    unit: req(formData.get("unit")) || "each",
  });
  revalidatePath("/settings");
  revalidatePath("/materials/new");
}

export async function deleteMaterial(formData: FormData) {
  const { orgId } = await requireUser();
  const id = Number(formData.get("id"));
  await db.update(materials).set({ active: false }).where(and(eq(materials.id, id), eq(materials.orgId, orgId)));
  revalidatePath("/settings");
  revalidatePath("/materials/new");
}

/* ------------------------- ordering ------------------------- */

export async function createMaterialOrder(formData: FormData) {
  const { orgId } = await requireAccess("production");

  const jobId = Number(formData.get("jobId")) || null;
  const supplierId = Number(formData.get("supplierId"));
  if (!supplierId) return;

  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.id, supplierId), eq(suppliers.orgId, orgId)))
    .limit(1);
  if (!supplier) return;

  // Collect checked materials + quantities
  const items: { name: string; quantity: string; unit: string }[] = [];
  for (const [key, _] of formData.entries()) {
    if (!key.startsWith("mat_")) continue;
    const id = Number(key.slice(4));
    const qtyRaw = req(formData.get(`qty_${id}`));
    const qty = qtyRaw === "" ? "1" : qtyRaw;
    if (Number(qty) <= 0) continue;
    const [m] = await db
      .select()
      .from(materials)
      .where(and(eq(materials.id, id), eq(materials.orgId, orgId)))
      .limit(1);
    if (m) items.push({ name: m.name, quantity: qty, unit: m.unit });
  }

  // Custom line item
  const customName = req(formData.get("customName"));
  if (customName) {
    items.push({
      name: customName,
      quantity: req(formData.get("customQty")) || "1",
      unit: req(formData.get("customUnit")) || "each",
    });
  }

  if (items.length === 0) return;

  // Order number
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(materialOrders)
    .where(eq(materialOrders.orgId, orgId));
  const number = `MAT-${String(1001 + Number(count ?? 0)).padStart(4, "0")}`;

  // Job label for the email
  let jobLabel = "an upcoming job";
  if (jobId) {
    const [row] = await db
      .select({ job: jobs, firstName: leads.firstName, lastName: leads.lastName, address: leads.address, city: leads.city })
      .from(jobs)
      .leftJoin(leads, eq(jobs.leadId, leads.id))
      .where(and(eq(jobs.id, jobId), eq(jobs.orgId, orgId)))
      .limit(1);
    if (row) {
      const who = row.firstName ? `${row.firstName} ${row.lastName ?? ""}`.trim() : row.job.customerName ?? "customer";
      const where = row.address ?? row.job.customerAddress ?? row.city ?? row.job.customerCity ?? "";
      jobLabel = where ? `${who} — ${where}` : who;
    }
  }

  const [order] = await db
    .insert(materialOrders)
    .values({ orgId, jobId, supplierId, number, status: "draft" })
    .returning();
  await db.insert(materialOrderItems).values(
    items.map((i) => ({ orgId, orderId: order.id, name: i.name, quantity: i.quantity, unit: i.unit }))
  );

  // Email the supplier
  const companyName = process.env.CRM_ORGANIZATION_NAME || "LeadFlow";
  const officeEmail = process.env.CRM_ADMIN_EMAIL || process.env.GMAIL_USER || "";
  let sent = false;
  if (supplier.email) {
    sent = await sendEmail({
      to: supplier.email,
      fromName: companyName,
      subject: `Materials Order ${number} — ${jobLabel}`,
      html: materialOrderEmailHtml({
        companyName,
        orderNumber: number,
        supplierName: supplier.name,
        jobLabel,
        items,
        officeEmail,
      }),
    });
  }

  await db
    .update(materialOrders)
    .set({ status: sent ? "sent" : "draft", sentTo: supplier.email, sentAt: sent ? new Date() : null })
    .where(eq(materialOrders.id, order.id));

  revalidatePath("/materials");
  revalidatePath("/production");
  redirect(`/materials?sent=${number}`);
}

export async function resendMaterialOrder(formData: FormData) {
  const { orgId } = await requireAccess("production");
  const id = Number(formData.get("id"));
  const [order] = await db
    .select()
    .from(materialOrders)
    .where(and(eq(materialOrders.id, id), eq(materialOrders.orgId, orgId)))
    .limit(1);
  if (!order) return;
  const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, order.supplierId)).limit(1);
  if (!supplier?.email) return;
  const items = await db.select().from(materialOrderItems).where(eq(materialOrderItems.orderId, id));

  const companyName = process.env.CRM_ORGANIZATION_NAME || "LeadFlow";
  const sent = await sendEmail({
    to: supplier.email,
    fromName: companyName,
    subject: `Materials Order ${order.number} (resend)`,
    html: materialOrderEmailHtml({
      companyName,
      orderNumber: order.number,
      supplierName: supplier.name,
      jobLabel: "see original order",
      items: items.map((i) => ({ name: i.name, quantity: String(i.quantity), unit: i.unit })),
      officeEmail: process.env.CRM_ADMIN_EMAIL || process.env.GMAIL_USER || "",
    }),
  });
  if (sent) {
    await db.update(materialOrders).set({ status: "sent", sentAt: new Date() }).where(eq(materialOrders.id, id));
  }
  revalidatePath("/materials");
}
