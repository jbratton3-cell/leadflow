"use server";

import { randomBytes } from "crypto";
import { db } from "@/db";
import { invoices, leads, sales } from "@/db/schema";
import type { Estimate, Job, Lead } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  sendEmail,
  invoiceEmailHtml,
  financingRequestedEmailHtml,
  getBaseUrl,
} from "@/lib/notify";
import { money } from "@/lib/constants";

/* ---------------------------- helpers (internal) ---------------------------- */

async function nextInvoiceNumber(orgId: number): Promise<string> {
  const rows = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(eq(invoices.orgId, orgId));
  return `INV-${String(rows.length + 1001).padStart(4, "0")}`;
}

async function notifyOfficeOfFinancing(opts: {
  customerName: string;
  number: string;
  amount: string;
  kind: string;
}): Promise<void> {
  const to = process.env.CRM_ADMIN_EMAIL || process.env.GMAIL_USER;
  if (!to) return;
  await sendEmail({
    to,
    subject: `Financing requested — ${opts.customerName} (${opts.number})`,
    html: financingRequestedEmailHtml(opts),
  });
}

async function insertAndSendInvoice(opts: {
  orgId: number;
  leadId: number;
  jobId: number | null;
  saleId: number | null;
  estimateId: number | null;
  kind: "deposit" | "final";
  amount: number;
  contractTotal: number;
  lead: Lead;
}): Promise<void> {
  const number = await nextInvoiceNumber(opts.orgId);
  const token = randomBytes(24).toString("hex");
  const companyName =
    process.env.CRM_ORGANIZATION_NAME || "LeadFlow";

  await db.insert(invoices).values({
    orgId: opts.orgId,
    leadId: opts.leadId,
    jobId: opts.jobId,
    saleId: opts.saleId,
    estimateId: opts.estimateId,
    number,
    kind: opts.kind,
    status: "draft",
    amount: opts.amount.toFixed(2),
    contractTotal: opts.contractTotal.toFixed(2),
    publicToken: token,
    sentAt: new Date(),
  });

  const email = opts.lead.email;
  if (!email) return; // stays a draft — office can send once an email is on file

  const link = `${getBaseUrl()}/invoice/${token}`;
  const sent = await sendEmail({
    to: email,
    subject: `Invoice ${number} — ${opts.kind === "deposit" ? "50% down payment" : "final payment"}`,
    html: invoiceEmailHtml({
      customerName: `${opts.lead.firstName} ${opts.lead.lastName ?? ""}`.trim(),
      companyName,
      number,
      amountLabel: opts.kind === "deposit" ? "50% down payment" : "final payment",
      amount: money(opts.amount),
      total: money(opts.contractTotal),
      link,
    }),
  });

  if (sent) {
    await db
      .update(invoices)
      .set({ status: "sent", sentAt: new Date() })
      .where(eq(invoices.number, number));
  }
}

/* ------------------------- automatic triggers ------------------------- */

// Called when a customer accepts an estimate.
// financing=true → they chose financing at acceptance: alert the office, no deposit invoice.
// financing=false → they chose to pay directly: auto-send the 50% deposit invoice.
export async function handleEstimateAccepted(
  est: Estimate,
  lead: Lead,
  saleId: number | null,
  financing: boolean
): Promise<void> {
  if (financing) {
    await notifyOfficeOfFinancing({
      customerName: `${lead.firstName} ${lead.lastName ?? ""}`.trim(),
      number: est.number,
      amount: money(est.total),
      kind: "estimate accepted — customer chose financing",
    });
    revalidatePath("/invoices");
    return;
  }

  const [existing] = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(
      and(
        eq(invoices.orgId, est.orgId),
        eq(invoices.estimateId, est.id),
        eq(invoices.kind, "deposit")
      )
    )
    .limit(1);
  if (existing) return; // already invoiced for this estimate

  const total = Number(est.total);
  if (total <= 0) return;

  const deposit = +(total * 0.5).toFixed(2);
  await insertAndSendInvoice({
    orgId: est.orgId,
    leadId: est.leadId,
    jobId: null,
    saleId,
    estimateId: est.id,
    kind: "deposit",
    amount: deposit,
    contractTotal: total,
    lead,
  });
  revalidatePath("/invoices");
}

// Called when a job is marked completed.
export async function createAndSendFinalInvoice(job: Job): Promise<void> {
  if (!job.leadId) return; // manual jobs with no linked customer

  const [existing] = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(
      and(
        eq(invoices.orgId, job.orgId),
        eq(invoices.jobId, job.id),
        eq(invoices.kind, "final")
      )
    )
    .limit(1);
  if (existing) return; // final invoice already sent for this job

  const [lead] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, job.leadId), eq(leads.orgId, job.orgId)))
    .limit(1);
  if (!lead) return;

  // Skip auto-invoice when the whole deal was financed up front.
  let contract = Number(job.contractAmount ?? 0);
  if (job.saleId) {
    const [sale] = await db
      .select()
      .from(sales)
      .where(and(eq(sales.id, job.saleId), eq(sales.orgId, job.orgId)))
      .limit(1);
    if (sale) {
      if (sale.financeType === "financed") return;
      contract = Number(sale.amount);
    }
  }
  if (contract <= 0) return;

  // Remaining due = contract minus everything already invoiced (not voided).
  const priorRows = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.orgId, job.orgId), eq(invoices.leadId, job.leadId)));
  const prior = priorRows
    .filter((i) => i.status !== "void")
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const remaining = +(contract - prior).toFixed(2);
  if (remaining <= 0) return;

  await insertAndSendInvoice({
    orgId: job.orgId,
    leadId: job.leadId,
    jobId: job.id,
    saleId: job.saleId ?? null,
    estimateId: null,
    kind: "final",
    amount: remaining,
    contractTotal: contract,
    lead,
  });
  revalidatePath("/invoices");
}

/* ------------------------- customer (public) ------------------------- */

export async function markInvoiceViewed(token: string) {
  const [inv] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.publicToken, token))
    .limit(1);
  if (inv && inv.status === "sent") {
    await db
      .update(invoices)
      .set({ status: "viewed", viewedAt: new Date() })
      .where(eq(invoices.id, inv.id));
  }
}

export async function customerInvoiceChoice(formData: FormData) {
  const token = (formData.get("token") ?? "").toString().trim();
  const choice = (formData.get("choice") ?? "").toString().trim(); // direct | finance
  if (!token || (choice !== "direct" && choice !== "finance")) return;

  const [inv] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.publicToken, token))
    .limit(1);
  if (!inv) return;
  if (inv.status === "paid" || inv.status === "void" || inv.paymentChoice) return;

  await db
    .update(invoices)
    .set({
      paymentChoice: choice,
      choiceAt: new Date(),
      status: choice === "finance" ? "financed" : inv.status,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, inv.id));

  if (choice === "finance") {
    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, inv.leadId))
      .limit(1);
    await notifyOfficeOfFinancing({
      customerName: lead
        ? `${lead.firstName} ${lead.lastName ?? ""}`.trim()
        : "Customer",
      number: inv.number,
      amount: money(inv.amount),
      kind: inv.kind === "deposit" ? "50% down payment" : "final payment",
    });
  }

  revalidatePath(`/invoice/${token}`);
}

/* ------------------------- office (CRM) ------------------------- */

export async function markInvoicePaid(formData: FormData) {
  const { orgId } = await requireUser();
  const id = Number(formData.get("id"));
  const method = (formData.get("method") ?? "other").toString();
  await db
    .update(invoices)
    .set({
      status: "paid",
      paidAt: new Date(),
      paymentMethod: method,
      updatedAt: new Date(),
    })
    .where(and(eq(invoices.id, id), eq(invoices.orgId, orgId)));
  revalidatePath("/invoices");
}

export async function voidInvoice(formData: FormData) {
  const { orgId } = await requireUser();
  const id = Number(formData.get("id"));
  await db
    .update(invoices)
    .set({ status: "void", updatedAt: new Date() })
    .where(and(eq(invoices.id, id), eq(invoices.orgId, orgId)));
  revalidatePath("/invoices");
}

export async function resendInvoice(formData: FormData) {
  const { orgId } = await requireUser();
  const id = Number(formData.get("id"));
  const [inv] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.orgId, orgId)))
    .limit(1);
  if (!inv || inv.status === "paid" || inv.status === "void") return;

  const [lead] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, inv.leadId), eq(leads.orgId, orgId)))
    .limit(1);
  if (!lead?.email) return;

  const link = `${getBaseUrl()}/invoice/${inv.publicToken}`;
  const sent = await sendEmail({
    to: lead.email,
    subject: `Invoice ${inv.number} — ${inv.kind === "deposit" ? "50% down payment" : "final payment"}`,
    html: invoiceEmailHtml({
      customerName: `${lead.firstName} ${lead.lastName ?? ""}`.trim(),
      companyName: process.env.CRM_ORGANIZATION_NAME || "LeadFlow",
      number: inv.number,
      amountLabel: inv.kind === "deposit" ? "50% down payment" : "final payment",
      amount: money(inv.amount),
      total: money(inv.contractTotal),
      link,
    }),
  });
  if (sent) {
    await db
      .update(invoices)
      .set({
        sentAt: new Date(),
        status: inv.status === "draft" ? "sent" : inv.status,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, inv.id));
  }
  revalidatePath("/invoices");
}
