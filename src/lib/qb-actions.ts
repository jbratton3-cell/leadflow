"use server";

import { requireAccess } from "@/lib/auth";
import { disconnectQb, ensureQbColumns, qbPost, qbQuery } from "@/lib/quickbooks";
import { db } from "@/db";
import { invoices, leads } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { personName } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function disconnectQbAction() {
  const user = await requireAccess("settings");
  await disconnectQb(user.orgId);
  revalidatePath("/settings");
}

type QbQuery<T> = { QueryResponse?: T };

async function findOrCreateCustomer(orgId: number, lead: typeof leads.$inferSelect): Promise<string | null> {
  const name = personName(lead.firstName, lead.lastName, "Customer").replace(/'/g, "\\'");
  const found = await qbQuery<QbQuery<{ Customer?: { Id: string }[] }>>(
    orgId,
    `select Id from Customer where DisplayName = '${name}'`
  );
  const existing = found?.QueryResponse?.Customer?.[0]?.Id;
  if (existing) return existing;

  const created = await qbPost<{ Customer?: { Id: string } }>(orgId, "customer", {
    DisplayName: personName(lead.firstName, lead.lastName, "Customer").slice(0, 500),
    PrimaryEmailAddr: lead.email ? { Address: lead.email } : undefined,
    PrimaryPhone: lead.phone ? { FreeFormNumber: lead.phone } : undefined,
    BillAddr: lead.address
      ? {
          Line1: lead.address,
          City: lead.city ?? undefined,
          CountrySubDivisionCode: lead.state ?? undefined,
          PostalCode: lead.zip ?? undefined,
        }
      : undefined,
  });
  return created.data?.Customer?.Id ?? null;
}

async function serviceItemId(orgId: number): Promise<string> {
  const found = await qbQuery<QbQuery<{ Item?: { Id: string }[] }>>(
    orgId,
    `select Id from Item where Name = 'Services'`
  );
  return found?.QueryResponse?.Item?.[0]?.Id ?? "1";
}

async function qbInvoiceByNumber(orgId: number, number: string): Promise<string | null> {
  const doc = number.slice(0, 21).replace(/'/g, "\\'");
  const found = await qbQuery<QbQuery<{ Invoice?: { Id: string }[] }>>(
    orgId,
    `select Id from Invoice where DocNumber = '${doc}'`
  );
  return found?.QueryResponse?.Invoice?.[0]?.Id ?? null;
}

export async function rememberQbInvoiceIfExists(orgId: number, inv: typeof invoices.$inferSelect) {
  if (inv.qbInvoiceId) return inv.qbInvoiceId;
  const existing = await qbInvoiceByNumber(orgId, inv.number);
  if (!existing) return null;
  await db
    .update(invoices)
    .set({ qbInvoiceId: existing, updatedAt: new Date() })
    .where(and(eq(invoices.id, inv.id), eq(invoices.orgId, orgId)));
  return existing;
}

export async function pushInvoiceToQuickBooks(formData: FormData) {
  const { orgId } = await requireAccess("invoices");
  await ensureQbColumns();
  const id = Number(formData.get("id"));
  const [inv] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.orgId, orgId)))
    .limit(1);
  if (!inv) redirect("/invoices");
  const already = inv.qbInvoiceId || (await rememberQbInvoiceIfExists(orgId, inv));
  if (already) redirect(`/invoices/${id}?qb=exists`);

  const [lead] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, inv.leadId), eq(leads.orgId, orgId)))
    .limit(1);
  if (!lead) redirect(`/invoices/${id}?qb=nolead`);

  const customerId = await findOrCreateCustomer(orgId, lead);
  if (!customerId) redirect(`/invoices/${id}?qb=customer`);

  const itemId = await serviceItemId(orgId);
  const amount = Number(inv.amount) || 0;
  const desc =
    inv.kind === "deposit"
      ? `Deposit ${inv.number}`
      : inv.kind === "final"
        ? `Final payment ${inv.number}`
        : `Invoice ${inv.number}`;

  const created = await qbPost<{ Invoice?: { Id: string } }>(orgId, "invoice", {
    DocNumber: inv.number.slice(0, 21),
    CustomerRef: { value: customerId },
    PrivateNote: `LeadFlow ${inv.number}`,
    Line: [
      {
        Amount: amount,
        DetailType: "SalesItemLineDetail",
        Description: desc,
        SalesItemLineDetail: {
          ItemRef: { value: itemId },
          Qty: 1,
          UnitPrice: amount,
        },
      },
    ],
  });

  if (!created.ok || !created.data?.Invoice?.Id) {
    redirect(`/invoices/${id}?qb=fail`);
  }

  const qbId = created.data.Invoice.Id;
  await db
    .update(invoices)
    .set({ qbInvoiceId: qbId, updatedAt: new Date() })
    .where(and(eq(invoices.id, id), eq(invoices.orgId, orgId)));

  if (inv.status === "paid") {
    const pay = await postQbPayment(orgId, customerId, qbId, amount);
    if (pay) {
      await db
        .update(invoices)
        .set({ qbPaymentId: pay, updatedAt: new Date() })
        .where(and(eq(invoices.id, id), eq(invoices.orgId, orgId)));
    }
  }

  redirect(`/invoices/${id}?qb=ok`);
}

async function postQbPayment(
  orgId: number,
  customerId: string,
  qbInvoiceId: string,
  amount: number
): Promise<string | null> {
  const created = await qbPost<{ Payment?: { Id: string } }>(orgId, "payment", {
    TotalAmt: amount,
    CustomerRef: { value: customerId },
    Line: [
      {
        Amount: amount,
        LinkedTxn: [{ TxnId: qbInvoiceId, TxnType: "Invoice" }],
      },
    ],
  });
  return created.data?.Payment?.Id ?? null;
}

export async function recordQbPayment(formData: FormData) {
  const { orgId } = await requireAccess("invoices");
  await ensureQbColumns();
  const id = Number(formData.get("id"));
  const [inv] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.orgId, orgId)))
    .limit(1);
  if (!inv?.qbInvoiceId) redirect(`/invoices/${id}?qb=fail`);
  if (inv.qbPaymentId) redirect(`/invoices/${id}?qb=paid`);

  const found = await qbQuery<QbQuery<{ Invoice?: { Id: string; CustomerRef?: { value: string } }[] }>>(
    orgId,
    `select Id, CustomerRef from Invoice where Id = '${inv.qbInvoiceId}'`
  );
  const customerId = found?.QueryResponse?.Invoice?.[0]?.CustomerRef?.value;
  if (!customerId) redirect(`/invoices/${id}?qb=fail`);

  const pay = await postQbPayment(orgId, customerId, inv.qbInvoiceId, Number(inv.amount) || 0);
  if (!pay) redirect(`/invoices/${id}?qb=fail`);

  await db
    .update(invoices)
    .set({ qbPaymentId: pay, updatedAt: new Date() })
    .where(and(eq(invoices.id, id), eq(invoices.orgId, orgId)));

  redirect(`/invoices/${id}?qb=paid`);
}
