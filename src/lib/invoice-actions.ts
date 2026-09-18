"use server";

import { randomBytes } from "crypto";
import { db } from "@/db";
import { hcpPayments, invoices, leads, sales, estimates, jobs } from "@/db/schema";
import type { Estimate, Invoice, Job, Lead } from "@/db/schema";
import { eq, and, desc, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  sendEmail,
  invoiceEmailHtml,
  financingRequestedEmailHtml,
  paymentReceiptEmailHtml,
  getBaseUrl,
} from "@/lib/notify";
import { money, personName, contractPrice } from "@/lib/constants";
import { syncInvoiceToQb } from "@/lib/qb-actions";
import { buildPaymentReceiptPdf } from "@/lib/payment-receipt-pdf";

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

async function ensureCollectedPayment(invoice: Invoice): Promise<void> {
  const [existing] = await db
    .select({ id: hcpPayments.id })
    .from(hcpPayments)
    .where(
      and(
        eq(hcpPayments.orgId, invoice.orgId),
        eq(hcpPayments.invoiceId, invoice.id),
      ),
    )
    .limit(1);
  if (existing) return;

  const method = invoice.paymentMethod || "other";
  await db.insert(hcpPayments).values({
    orgId: invoice.orgId,
    leadId: invoice.leadId,
    jobId: invoice.jobId,
    invoiceId: invoice.id,
    receivedAt: invoice.paidAt ?? new Date(),
    amount: invoice.amount,
    paymentType: `LeadFlow ${invoice.kind} payment`,
    jobReference: invoice.number,
    notes: `Recorded from ${invoice.number} via ${method}.`,
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

  const [created] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.orgId, opts.orgId), eq(invoices.number, number)))
    .limit(1);

  const email = opts.lead.email;
  if (!email) {
    if (created) await syncInvoiceToQb(opts.orgId, created.id);
    return;
  }

  const link = `${getBaseUrl()}/invoice/${token}`;
  const sent = await sendEmail({
    to: email,
    subject: `Invoice ${number} — ${opts.kind === "deposit" ? "50% down payment" : "final payment"}`,
    html: invoiceEmailHtml({
      customerName: personName(opts.lead.firstName, opts.lead.lastName, "there"),
      companyName,
      number,
      amountLabel: opts.kind === "deposit" ? "50% down payment" : "final payment",
      amount: money(opts.amount),
      total: money(opts.contractTotal),
      link,
      kind: opts.kind,
    }),
  });

  if (sent) {
    await db
      .update(invoices)
      .set({ status: "sent", sentAt: new Date() })
      .where(eq(invoices.number, number));
  }
  if (created) await syncInvoiceToQb(opts.orgId, created.id);
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
      customerName: personName(lead.firstName, lead.lastName, "there"),
      number: est.number,
      amount: money(contractPrice(est.total, est.cashDiscountPercent, true, est.cashPrice)),
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

  const total = contractPrice(est.total, est.cashDiscountPercent, false, est.cashPrice);
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

  // If a deposit was recorded, its contractTotal is the amount actually
  // agreed for the 50/50 deal. Prefer it over the sale snapshot, which may
  // reflect an older cash-offer calculation.
  const priorRows = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.orgId, job.orgId), eq(invoices.leadId, job.leadId)));
  const depositInvoice = priorRows.find(
    (invoice) =>
      invoice.kind === "deposit" &&
      invoice.status !== "void" &&
      Number(invoice.contractTotal) > 0,
  );
  if (depositInvoice) {
    contract = Number(depositInvoice.contractTotal);
  }
  if (contract <= 0) return;

  // Remaining due = contract minus everything already invoiced (not voided).
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

// Create a final invoice manually when a job was completed outside the normal
// production workflow or the final contract amount changed.
export async function createManualFinalInvoice(formData: FormData) {
  const { orgId } = await requireUser();
  const leadId = Number(formData.get("leadId"));
  const amount = Number(formData.get("amount"));
  const contractTotal = Number(formData.get("contractTotal"));
  if (!leadId || !Number.isFinite(amount) || amount <= 0 || !Number.isFinite(contractTotal) || contractTotal <= 0) {
    redirect(`/leads/${leadId || ""}?invoice=invalid`);
  }

  const [lead] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, leadId), eq(leads.orgId, orgId)))
    .limit(1);
  if (!lead) return;

  const [existing] = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(
      and(
        eq(invoices.orgId, orgId),
        eq(invoices.leadId, leadId),
        eq(invoices.kind, "final"),
        ne(invoices.status, "void"),
      ),
    )
    .orderBy(desc(invoices.createdAt))
    .limit(1);
  if (existing) {
    redirect(`/invoices/${existing.id}`);
  }

  const [sale] = await db
    .select({ id: sales.id })
    .from(sales)
    .where(and(eq(sales.orgId, orgId), eq(sales.leadId, leadId)))
    .orderBy(desc(sales.soldAt))
    .limit(1);
  const [job] = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(eq(jobs.orgId, orgId), eq(jobs.leadId, leadId)))
    .orderBy(desc(jobs.createdAt))
    .limit(1);

  const number = await nextInvoiceNumber(orgId);
  const [created] = await db
    .insert(invoices)
    .values({
      orgId,
      leadId,
      jobId: job?.id ?? null,
      saleId: sale?.id ?? null,
      estimateId: null,
      number,
      kind: "final",
      status: "draft",
      amount: amount.toFixed(2),
      contractTotal: contractTotal.toFixed(2),
      publicToken: randomBytes(24).toString("hex"),
      notes: "Final invoice created manually by the office.",
    })
    .returning();

  if (created) await syncInvoiceToQb(orgId, created.id);
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/invoices");
  redirect(`/invoices/${created.id}`);
}


// Record a 50% deposit as already collected (e.g. paper estimate paid in the
// field). Creates the deposit invoice in PAID state — no email is sent.
export async function recordDepositPaid(formData: FormData) {
  const { orgId } = await requireUser();
  const estimateId = Number(formData.get("estimateId"));
  const method = (formData.get("method") ?? "other").toString();
  if (!estimateId) return;

  const [est] = await db
    .select()
    .from(estimates)
    .where(and(eq(estimates.id, estimateId), eq(estimates.orgId, orgId)))
    .limit(1);
  if (!est || est.status !== "accepted") return;

  const total = contractPrice(est.total, est.cashDiscountPercent, est.paymentChoice === "financed", est.cashPrice);
  if (total <= 0) return;

  const [existing] = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.orgId, orgId),
        eq(invoices.estimateId, est.id),
        eq(invoices.kind, "deposit")
      )
    )
    .limit(1);

  const [sale] = await db
    .select({ id: sales.id })
    .from(sales)
    .where(and(eq(sales.orgId, orgId), eq(sales.leadId, est.leadId)))
    .orderBy(desc(sales.soldAt))
    .limit(1);
  const saleId = sale?.id ?? null;
  let paidInvoice: Invoice;

  if (existing) {
    if (existing.status === "void") return;

    if (existing.status !== "paid" && existing.status !== "void") {
      const paidAt = new Date();
      await db
        .update(invoices)
        .set({
          status: "paid",
          paidAt,
          paymentMethod: method,
          updatedAt: paidAt,
          saleId: existing.saleId ?? saleId,
        })
        .where(eq(invoices.id, existing.id));
      paidInvoice = {
        ...existing,
        status: "paid",
        paidAt,
        paymentMethod: method,
        updatedAt: paidAt,
        saleId: existing.saleId ?? saleId,
      };
      await syncInvoiceToQb(orgId, existing.id);
    } else {
      paidInvoice = existing;
      if (paidInvoice.saleId === null && saleId !== null) {
        await db
          .update(invoices)
          .set({ saleId, updatedAt: new Date() })
          .where(eq(invoices.id, paidInvoice.id));
        paidInvoice = { ...paidInvoice, saleId };
      }
    }
  } else {
    const number = await nextInvoiceNumber(orgId);
    [paidInvoice] = await db
      .insert(invoices)
      .values({
        orgId,
        leadId: est.leadId,
        jobId: null,
        saleId,
        estimateId: est.id,
        number,
        kind: "deposit",
        status: "paid",
        amount: (total * 0.5).toFixed(2),
        contractTotal: total.toFixed(2),
        publicToken: randomBytes(24).toString("hex"),
        paidAt: new Date(),
        paymentMethod: method,
        notes: "Deposit collected outside the automated flow (recorded by office).",
      })
      .returning();
    await syncInvoiceToQb(orgId, paidInvoice.id);
  }

  await ensureCollectedPayment(paidInvoice);
  revalidatePath(`/estimates/${estimateId}`);
  revalidatePath("/invoices");
  revalidatePath("/sales");
  revalidatePath("/reports");
  revalidatePath("/");
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
        ? personName(lead.firstName, lead.lastName, "Customer")
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
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.orgId, orgId)))
    .limit(1);
  if (!invoice || invoice.status === "void") return;

  const paidAt = new Date();
  await db
    .update(invoices)
    .set({
      status: "paid",
      paidAt,
      paymentMethod: method,
      updatedAt: paidAt,
    })
    .where(and(eq(invoices.id, id), eq(invoices.orgId, orgId)));
  await ensureCollectedPayment({
    ...invoice,
    status: "paid",
    paidAt,
    paymentMethod: method,
    updatedAt: paidAt,
  });
  await syncInvoiceToQb(orgId, id);
  revalidatePath("/invoices");
  revalidatePath("/sales");
  revalidatePath("/reports");
}

export async function sendPaymentReceipt(formData: FormData) {
  const { orgId } = await requireUser();
  const id = Number(formData.get("id"));
  if (!id) return;

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.orgId, orgId)))
    .limit(1);
  if (!invoice || invoice.status !== "paid") {
    redirect(`/invoices/${id}?receipt=unavailable`);
  }

  const [lead] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, invoice.leadId), eq(leads.orgId, orgId)))
    .limit(1);
  if (!lead?.email) {
    redirect(`/invoices/${id}?receipt=missing-email`);
  }

  const paymentDate = invoice.paidAt
    ? invoice.paidAt.toLocaleDateString("en-US", {
        timeZone: "America/New_York",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Today";
  const customerName = personName(lead.firstName, lead.lastName, "Customer");
  const companyName = process.env.CRM_ORGANIZATION_NAME || "LeadFlow";
  const paidInFull = invoice.kind === "final";
  const pdfBytes = await buildPaymentReceiptPdf({
    invoice,
    lead,
    orgName: companyName,
  });
  const sent = await sendEmail({
    to: lead.email,
    subject: `Payment receipt ${invoice.number} — ${paidInFull ? "Paid in full" : money(invoice.amount)}`,
    html: paymentReceiptEmailHtml({
      customerName,
      companyName,
      number: invoice.number,
      amount: money(invoice.amount),
      paymentType: invoice.kind === "deposit" ? "50% deposit" : invoice.kind === "final" ? "final payment" : "payment",
      paymentDate,
      paidInFull,
    }),
    attachments: [
      {
        filename: `${invoice.number}-receipt.pdf`,
        content: Buffer.from(pdfBytes),
        contentType: "application/pdf",
      },
    ],
  });

  redirect(`/invoices/${id}?receipt=${sent ? "sent" : "failed"}`);
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
      customerName: personName(lead.firstName, lead.lastName, "there"),
      companyName: process.env.CRM_ORGANIZATION_NAME || "LeadFlow",
      number: inv.number,
      amountLabel: inv.kind === "deposit" ? "50% down payment" : "final payment",
      amount: money(inv.amount),
      total: money(inv.contractTotal),
      link,
      kind: inv.kind,
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
