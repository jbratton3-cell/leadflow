"use server";

import { randomBytes } from "crypto";
import { db } from "@/db";
import { estimates, estimateItems, leads, jobs, sales, products } from "@/db/schema";
import type { Estimate, Lead } from "@/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAccess } from "@/lib/auth";
import {
  sendEmail,
  estimateEmailHtml,
  getBaseUrl,
} from "@/lib/notify";
import { handleEstimateAccepted } from "@/lib/invoice-actions";
import { BUSINESS_NAME, personName } from "@/lib/constants";

function str(v: FormDataEntryValue | null): string | null {
  const s = (v ?? "").toString().trim();
  return s === "" ? null : s;
}
function req(v: FormDataEntryValue | null): string {
  return (v ?? "").toString().trim();
}
function num(v: FormDataEntryValue | null): number {
  const n = Number((v ?? "").toString().trim());
  return Number.isNaN(n) ? 0 : n;
}
function toDate(v: FormDataEntryValue | null): Date | null {
  const s = (v ?? "").toString().trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Recalculate subtotal/tax/total from line items and save onto the estimate.
async function recalcTotals(estimateId: number) {
  const items = await db
    .select()
    .from(estimateItems)
    .where(eq(estimateItems.estimateId, estimateId));
  const subtotal = items.reduce((s, i) => s + Number(i.amount), 0);

  const [est] = await db.select().from(estimates).where(eq(estimates.id, estimateId)).limit(1);
  if (!est) return;

  const discount = Number(est.discount);
  const taxRate = Number(est.taxRate);
  const taxable = Math.max(subtotal - discount, 0);
  const taxAmount = +(taxable * (taxRate / 100)).toFixed(2);
  const total = +(taxable + taxAmount).toFixed(2);

  await db
    .update(estimates)
    .set({
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(estimates.id, estimateId));
}

/* ------------------------------ estimates ------------------------------ */

export async function createEstimate(formData: FormData) {
  const { orgId } = await requireAccess("estimates");
  const leadId = Number(formData.get("leadId"));

  // Generate a sequential-ish estimate number (per organization)
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(estimates)
    .where(eq(estimates.orgId, orgId));
  const number = `EST-${String((count ?? 0) + 1001).padStart(4, "0")}`;

  const inserted = await db
    .insert(estimates)
    .values({
      orgId,
      leadId,
      number,
      title: req(formData.get("title")) || "Project Estimate",
      taxRate: num(formData.get("taxRate")).toString(),
      discount: num(formData.get("discount")).toString(),
      notes: str(formData.get("notes")),
      terms: str(formData.get("terms")),
      validUntil: toDate(formData.get("validUntil")),
      publicToken: randomBytes(24).toString("hex"),
      status: "draft",
    })
    .returning();

  const est = inserted[0];
  revalidatePath("/estimates");
  revalidatePath(`/leads/${leadId}`);
  if (est) redirect(`/estimates/${est.id}`);
}

export async function updateEstimate(formData: FormData) {
  const { orgId } = await requireAccess("estimates");
  const id = Number(formData.get("id"));

  await db
    .update(estimates)
    .set({
      title: req(formData.get("title")) || "Project Estimate",
      taxRate: num(formData.get("taxRate")).toString(),
      discount: num(formData.get("discount")).toString(),
      notes: str(formData.get("notes")),
      terms: str(formData.get("terms")),
      validUntil: toDate(formData.get("validUntil")),
      updatedAt: new Date(),
    })
    .where(and(eq(estimates.id, id), eq(estimates.orgId, orgId)));

  await recalcTotals(id);
  revalidatePath(`/estimates/${id}`);
}

export async function deleteEstimate(formData: FormData) {
  const { orgId } = await requireAccess("estimates");
  const id = Number(formData.get("id"));
  const leadId = Number(formData.get("leadId"));
  await db
    .delete(estimateItems)
    .where(and(eq(estimateItems.estimateId, id), eq(estimateItems.orgId, orgId)));
  await db.delete(estimates).where(and(eq(estimates.id, id), eq(estimates.orgId, orgId)));
  revalidatePath("/estimates");
  revalidatePath(`/leads/${leadId}`);
  redirect("/estimates");
}

/* ---------------------------- line items ------------------------------- */

export async function addEstimateItem(formData: FormData) {
  const { orgId } = await requireAccess("estimates");
  const estimateId = Number(formData.get("estimateId"));
  const quantity = num(formData.get("quantity")) || 1;
  const unitPrice = num(formData.get("unitPrice"));
  const amount = +(quantity * unitPrice).toFixed(2);

  // Ensure the estimate belongs to this org before adding items.
  const [owner] = await db
    .select({ id: estimates.id })
    .from(estimates)
    .where(and(eq(estimates.id, estimateId), eq(estimates.orgId, orgId)))
    .limit(1);
  if (!owner) return;

  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number>`coalesce(max(${estimateItems.sortOrder}),0)::int` })
    .from(estimateItems)
    .where(eq(estimateItems.estimateId, estimateId));

  await db.insert(estimateItems).values({
    orgId,
    estimateId,
    description: req(formData.get("description")),
    quantity: quantity.toString(),
    unitPrice: unitPrice.toString(),
    amount: amount.toString(),
    sortOrder: (maxOrder ?? 0) + 1,
  });

  await recalcTotals(estimateId);
  revalidatePath(`/estimates/${estimateId}`);
}

export async function deleteEstimateItem(formData: FormData) {
  const { orgId } = await requireAccess("estimates");
  const id = Number(formData.get("id"));
  const estimateId = Number(formData.get("estimateId"));
  await db
    .delete(estimateItems)
    .where(and(eq(estimateItems.id, id), eq(estimateItems.orgId, orgId)));
  await recalcTotals(estimateId);
  revalidatePath(`/estimates/${estimateId}`);
}

/* ------------------------------ sending -------------------------------- */

export async function sendEstimate(
  _prev: { message?: string; link?: string; error?: string } | undefined,
  formData: FormData
): Promise<{ message?: string; link?: string; error?: string }> {
  const { orgId } = await requireAccess("estimates");
  const id = Number(formData.get("id"));

  const [est] = await db
    .select()
    .from(estimates)
    .where(and(eq(estimates.id, id), eq(estimates.orgId, orgId)))
    .limit(1);
  if (!est) return { error: "Estimate not found." };

  const items = await db
    .select()
    .from(estimateItems)
    .where(and(eq(estimateItems.orgId, orgId), eq(estimateItems.estimateId, id)));
  if (items.length === 0) {
    return { error: "Add at least one line item before sending." };
  }

  const [lead] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.orgId, orgId), eq(leads.id, est.leadId)))
    .limit(1);
  if (!lead) return { error: "Customer not found." };

  const link = `${getBaseUrl()}/estimate/${est.publicToken}`;
  const companyName = process.env.CRM_ORGANIZATION_NAME ?? BUSINESS_NAME;
  const total = Number(est.total).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  let emailed = false;
  if (lead.email) {
    emailed = await sendEmail({
      to: lead.email,
      subject: `Your estimate ${est.number} from ${companyName}`,
      html: estimateEmailHtml({
        customerName: personName(lead.firstName, lead.lastName, "there"),
        companyName,
        number: est.number,
        total,
        link,
      }),
    });
  }

  await db
    .update(estimates)
    .set({ status: "sent", sentAt: new Date(), updatedAt: new Date() })
    .where(eq(estimates.id, id));

  revalidatePath(`/estimates/${id}`);
  revalidatePath("/estimates");

  if (emailed) {
    return {
      message: `Estimate emailed to ${lead.email}. You can also share the link below.`,
      link,
    };
  }
  const emailDebug = `GMAIL_USER=${process.env.GMAIL_USER ? "set" : "MISSING"}, GMAIL_APP_PASS=${process.env.GMAIL_APP_PASS ? "set" : "MISSING"}, deployment=${(process.env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 7) || "local"}`;
  return {
    message: lead.email
      ? `Email couldn't be sent (${emailDebug}) — share this link with your customer:`
      : "No customer email on file — share this link with your customer:",
    link,
  };
}

/* ----------------- public customer responses (no auth) ----------------- */


// Office-side status control: record a signed paper estimate (or a decline)
// without requiring the customer to click anything.
export async function markEstimateStatus(formData: FormData) {
  const { orgId } = await requireAccess("estimates");
  const id = Number(formData.get("id"));
  const status = req(formData.get("status")); // accepted | declined
  const financing = formData.get("financing") === "on";
  const sendDeposit = formData.get("sendDeposit") === "on" && !financing;
  if (status !== "accepted" && status !== "declined") return;

  const [est] = await db
    .select()
    .from(estimates)
    .where(and(eq(estimates.id, id), eq(estimates.orgId, orgId)))
    .limit(1);
  if (!est) return;
  if (est.status === "accepted" || est.status === "declined") return;

  await db
    .update(estimates)
    .set({ status, respondedAt: new Date(), updatedAt: new Date() })
    .where(eq(estimates.id, id));

  if (status === "accepted") {
    const [lead] = await db
      .select()
      .from(leads)
      .where(and(eq(leads.orgId, orgId), eq(leads.id, est.leadId)))
      .limit(1);
    if (lead) {
      // No automatic invoice email unless the office explicitly asks for it.
      await applyAcceptanceBookkeeping(est, lead, financing, sendDeposit);
    }
  }

  revalidatePath(`/estimates/${id}`);
  revalidatePath("/estimates");
  revalidatePath(`/leads/${est.leadId}`);
  revalidatePath("/leads");
  revalidatePath("/sales");
  revalidatePath("/production");
  revalidatePath("/invoices");
  revalidatePath("/");
}

export async function markEstimateViewed(token: string) {
  const [est] = await db
    .select()
    .from(estimates)
    .where(eq(estimates.publicToken, token))
    .limit(1);
  if (est && est.status === "sent") {
    await db
      .update(estimates)
      .set({ status: "viewed", viewedAt: new Date() })
      .where(eq(estimates.id, est.id));
  }
}

// Shared bookkeeping when an estimate is accepted (online by the customer, or
// recorded by the office from a signed paper estimate): sale, job, lead stage,
// and (optionally) the automatic deposit invoice.
async function applyAcceptanceBookkeeping(
  est: Estimate,
  lead: Lead,
  financing: boolean,
  triggerInvoices: boolean
): Promise<void> {
      const [existingSale] = await db
        .select()
        .from(sales)
        .where(and(eq(sales.orgId, est.orgId), eq(sales.leadId, est.leadId)))
        .limit(1);

      let saleId = existingSale?.id ?? null;
      if (!existingSale) {
        const inserted = await db
          .insert(sales)
          .values({
            orgId: est.orgId,
            leadId: est.leadId,
            salesRepId: null,
            productId: lead.productId,
            amount: String(est.total),
            financeType: financing ? "financed" : "cash",
            soldAt: new Date(),
            notes: `Auto-created from accepted estimate ${est.number}.`,
          })
          .returning();
        saleId = inserted[0]?.id ?? null;
      }

      const [existingJob] = await db
        .select({ id: jobs.id })
        .from(jobs)
        .where(and(eq(jobs.orgId, est.orgId), eq(jobs.leadId, est.leadId)))
        .limit(1);

      let productName: string | null = null;
      if (lead.productId) {
        const [product] = await db
          .select()
          .from(products)
          .where(and(eq(products.orgId, est.orgId), eq(products.id, lead.productId)))
          .limit(1);
        productName = product?.name ?? null;
      }

      if (!existingJob) {
        await db.insert(jobs).values({
          orgId: est.orgId,
          saleId,
          leadId: est.leadId,
          customerName: personName(lead.firstName, lead.lastName, "Customer"),
          customerAddress: lead.address,
          customerCity: lead.city,
          customerPhone: lead.phone,
          contractAmount: String(est.total),
          productName,
          status: "pending",
          milestones: "{}",
          notes: `Customer accepted estimate ${est.number} online. Contact to schedule the job.`,
        });
      }

      await db
        .update(leads)
        .set({
          stage: "sold",
          estimatedValue: String(est.total),
          updatedAt: new Date(),
        })
        .where(and(eq(leads.id, est.leadId), eq(leads.orgId, est.orgId)));

      // Auto-invoice: deposit invoice (paying directly) or financing alert.
      if (triggerInvoices) {
        await handleEstimateAccepted(est, lead, saleId, financing);
      }
    
}

export async function respondToEstimate(formData: FormData) {
  const token = req(formData.get("token"));
  const decision = req(formData.get("decision")); // accept | decline
  const financing = req(formData.get("paymentIntent")) === "finance";
  const [est] = await db
    .select()
    .from(estimates)
    .where(eq(estimates.publicToken, token))
    .limit(1);
  if (!est) return;
  if (est.status === "accepted" || est.status === "declined") return;

  const status = decision === "accept" ? "accepted" : "declined";
  await db
    .update(estimates)
    .set({ status, respondedAt: new Date(), updatedAt: new Date() })
    .where(eq(estimates.id, est.id));

  if (status === "accepted") {
    const [lead] = await db
      .select()
      .from(leads)
      .where(and(eq(leads.orgId, est.orgId), eq(leads.id, est.leadId)))
      .limit(1);

    if (lead) {
      await applyAcceptanceBookkeeping(est, lead, financing, true);
    }
  }

  revalidatePath(`/estimate/${token}`);
  revalidatePath(`/estimates/${est.id}`);
  revalidatePath("/estimates");
  revalidatePath(`/leads/${est.leadId}`);
  revalidatePath("/leads");
  revalidatePath("/sales");
  revalidatePath("/production");
  revalidatePath("/invoices");
  revalidatePath("/");
}

export async function getEstimateWithItems(id: number) {
  const [est] = await db.select().from(estimates).where(eq(estimates.id, id)).limit(1);
  if (!est) return null;
  const items = await db
    .select()
    .from(estimateItems)
    .where(eq(estimateItems.estimateId, id))
    .orderBy(asc(estimateItems.sortOrder));
  return { estimate: est, items };
}
