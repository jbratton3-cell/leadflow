"use server";

import { db, pool } from "@/db";
import {
  leads,
  callLogs,
  outreachLogs,
  appointments,
  sales,
  jobs,
  hcpPayments,
  properties,
  reps,
  leadSources,
  products,
  organizations,
} from "@/db/schema";
import { orgHasEmailOutreach } from "@/lib/constants";
import { createAndSendFinalInvoice } from "@/lib/invoice-actions";
import { and, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

function str(v: FormDataEntryValue | null): string | null {
  const s = (v ?? "").toString().trim();
  return s === "" ? null : s;
}
function req(v: FormDataEntryValue | null): string {
  return (v ?? "").toString().trim();
}
function num(v: FormDataEntryValue | null): number | null {
  const s = (v ?? "").toString().trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}
function toDate(v: FormDataEntryValue | null): Date | null {
  const s = (v ?? "").toString().trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/* ------------------------------ LEADS ------------------------------ */

export async function createLead(formData: FormData) {
  const { orgId } = await requireUser();
  let productId = num(formData.get("productId"));
  const productInterest = str(formData.get("productInterest"));

  if (productInterest) {
    const [existingProduct] = await db
      .select({ id: products.id })
      .from(products)
      .where(
        and(
          eq(products.orgId, orgId),
          eq(products.active, true),
          sql`lower(${products.name}) = lower(${productInterest})`,
        ),
      )
      .limit(1);

    if (existingProduct) {
      productId = existingProduct.id;
    } else {
      const [createdProduct] = await db
        .insert(products)
        .values({ orgId, name: productInterest })
        .returning({ id: products.id });
      productId = createdProduct.id;
    }
  }

  await db.insert(leads).values({
    orgId,
    firstName: req(formData.get("firstName")),
    lastName: req(formData.get("lastName")),
      company: str(formData.get("company")),
    email: str(formData.get("email")),
    phone: str(formData.get("phone")),
    altPhone: str(formData.get("altPhone")),
    address: str(formData.get("address")),
    city: str(formData.get("city")),
    state: str(formData.get("state")),
    zip: str(formData.get("zip")),
    accountType: str(formData.get("accountType")) ?? "unclassified",
    standingContract: formData.get("standingContract") === "on",
    sourceId: num(formData.get("sourceId")),
    productId,
    assignedRepId: num(formData.get("assignedRepId")),
    estimatedValue: (num(formData.get("estimatedValue")) ?? 0).toString(),
    notes: str(formData.get("notes")),
    stage: "new",
  });
  revalidatePath("/leads");
  revalidatePath("/");
}

export async function updateLead(formData: FormData) {
  const { orgId } = await requireUser();
  const id = Number(formData.get("id"));
  const assignedRepId = num(formData.get("assignedRepId"));
  await db
    .update(leads)
    .set({
      firstName: req(formData.get("firstName")),
      lastName: req(formData.get("lastName")),
      company: str(formData.get("company")),
      email: str(formData.get("email")),
      phone: str(formData.get("phone")),
      altPhone: str(formData.get("altPhone")),
      address: str(formData.get("address")),
      city: str(formData.get("city")),
      state: str(formData.get("state")),
      zip: str(formData.get("zip")),
      accountType: str(formData.get("accountType")) ?? "unclassified",
      standingContract: formData.get("standingContract") === "on",
      sourceId: num(formData.get("sourceId")),
      productId: num(formData.get("productId")),
      assignedRepId,
      estimatedValue: (num(formData.get("estimatedValue")) ?? 0).toString(),
      notes: str(formData.get("notes")),
      updatedAt: new Date(),
    })
    .where(and(eq(leads.id, id), eq(leads.orgId, orgId)));

  // Backfill only sales that were previously unassigned. Explicitly assigned
  // sale reps remain authoritative if the lead is reassigned later.
  if (assignedRepId !== null) {
    await db
      .update(sales)
      .set({ salesRepId: assignedRepId })
      .where(
        and(
          eq(sales.orgId, orgId),
          eq(sales.leadId, id),
          isNull(sales.salesRepId),
        ),
      );
  }
  revalidatePath(`/leads/${id}`);
  revalidatePath("/leads");
  revalidatePath("/sales");
}

// Log a call center dial with disposition, advancing pipeline accordingly.
export async function logCall(formData: FormData) {
  const { orgId } = await requireUser();
  const leadId = Number(formData.get("leadId"));
  const disposition = req(formData.get("disposition"));
  const notes = str(formData.get("notes"));
  const callbackAt = toDate(formData.get("callbackAt"));
  const repId = num(formData.get("repId"));

  // "Appointment" disposition triggers the inline scheduler and books an appointment.
  if (disposition === "appt_set") {
    const scheduledAt = toDate(formData.get("scheduledAt"));
    if (!scheduledAt) return; // scheduler required; abort quietly if missing

    await db.insert(appointments).values({
      orgId,
      leadId,
      salesRepId: num(formData.get("salesRepId")),
      setById: repId,
      scheduledAt,
      durationMin: num(formData.get("durationMin")) ?? 90,
      status: "set",
      notes,
    });

    await db.insert(callLogs).values({
      orgId,
      leadId,
      repId,
      disposition: "appt_set",
      notes: notes ?? "Appointment scheduled",
    });

    await db
      .update(leads)
      .set({
        stage: "appt_set",
        disposition: "appt_set",
        deadReason: null,
        updatedAt: new Date(),
      })
      .where(and(eq(leads.id, leadId), eq(leads.orgId, orgId)));

    revalidatePath("/appointments");
    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/call-center");
    revalidatePath("/leads");
    revalidatePath("/");
    return;
  }

  await db.insert(callLogs).values({
    orgId,
    leadId,
    repId,
    disposition,
    notes,
    callbackAt,
  });

  // Update lead based on disposition
  const patch: Partial<typeof leads.$inferInsert> = {
    disposition,
    updatedAt: new Date(),
    callbackAt,
  };

  if (disposition === "do_not_call") {
    patch.doNotCall = true;
    patch.stage = "dead";
    patch.deadReason = "dnc";
  } else if (disposition === "not_interested" || disposition === "wrong_number") {
    patch.stage = "dead";
    patch.deadReason = disposition;
  } else if (["no_answer", "left_message", "busy", "callback", "contacted"].includes(disposition)) {
    patch.stage = "contacting";
    // Reactivating a rehashed/dead lead: clear the prior dead reason.
    patch.deadReason = null;
  }

  await db.update(leads).set(patch).where(and(eq(leads.id, leadId), eq(leads.orgId, orgId)));
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/call-center");
  revalidatePath("/leads");
}

let outreachTableReady = false;
export async function ensureOutreachTable() {
  if (outreachTableReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS outreach_logs (
      id serial PRIMARY KEY,
      org_id integer NOT NULL,
      lead_id integer NOT NULL,
      rep_id integer,
      channel varchar(40) NOT NULL,
      outcome varchar(40) NOT NULL,
      notes text,
      follow_up_at timestamp,
      created_at timestamp NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS outreach_org_idx ON outreach_logs (org_id);
    CREATE INDEX IF NOT EXISTS outreach_lead_idx ON outreach_logs (lead_id);
  `);
  outreachTableReady = true;
}

export async function logOutreach(formData: FormData) {
  const { orgId } = await requireUser();
  const [org] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  if (!orgHasEmailOutreach(org?.name, orgId)) return;
  await ensureOutreachTable();
  const leadId = Number(formData.get("leadId"));
  const channel = req(formData.get("channel"));
  const outcome = req(formData.get("outcome"));
  const notes = str(formData.get("notes"));
  const followUpAt = toDate(formData.get("followUpAt"));
  const repId = num(formData.get("repId"));

  await db.insert(outreachLogs).values({
    orgId,
    leadId,
    repId,
    channel,
    outcome,
    notes,
    followUpAt,
  });

  const patch: Partial<typeof leads.$inferInsert> = { updatedAt: new Date() };
  if (outcome === "not_interested") {
    patch.stage = "dead";
    patch.deadReason = "not_interested";
  } else if (["sent", "replied", "interested", "follow_up", "no_reply", "bounced"].includes(outcome)) {
    patch.stage = "contacting";
    patch.deadReason = null;
  }

  await db.update(leads).set(patch).where(and(eq(leads.id, leadId), eq(leads.orgId, orgId)));
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
}

/* --------------------------- APPOINTMENTS --------------------------- */

export async function createAppointment(formData: FormData) {
  const { orgId } = await requireUser();
  const leadId = Number(formData.get("leadId"));
  const scheduledAt = toDate(formData.get("scheduledAt"));
  if (!scheduledAt) return;

  await db.insert(appointments).values({
    orgId,
    leadId,
    salesRepId: num(formData.get("salesRepId")),
    setById: num(formData.get("setById")),
    scheduledAt,
    durationMin: num(formData.get("durationMin")) ?? 90,
    status: "set",
    notes: str(formData.get("notes")),
  });

  // Also drop a call log noting appt set
  await db.insert(callLogs).values({
    orgId,
    leadId,
    repId: num(formData.get("setById")),
    disposition: "appt_set",
    notes: "Appointment scheduled",
  });

  await db
    .update(leads)
    .set({ stage: "appt_set", disposition: "appt_set", updatedAt: new Date() })
    .where(and(eq(leads.id, leadId), eq(leads.orgId, orgId)));

  revalidatePath("/appointments");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/call-center");
  revalidatePath("/");
}

export async function updateAppointmentStatus(formData: FormData) {
  const { orgId } = await requireUser();
  const id = Number(formData.get("id"));
  const leadId = Number(formData.get("leadId"));
  const status = req(formData.get("status"));
  const result = str(formData.get("result"));

  await db
    .update(appointments)
    .set({ status, result })
    .where(and(eq(appointments.id, id), eq(appointments.orgId, orgId)));

  // Reflect status onto the lead's stage
  const leadPatch: Partial<typeof leads.$inferInsert> = { updatedAt: new Date() };
  if (status === "confirmed") leadPatch.stage = "confirmed";
  else if (status === "sat") leadPatch.stage = "sat";
  else if (status === "no_show") {
    leadPatch.stage = "dead";
    leadPatch.deadReason = "no_show";
  } else if (status === "cancelled") {
    leadPatch.stage = "dead";
    leadPatch.deadReason = "cancelled";
  }

  if (Object.keys(leadPatch).length > 1) {
    await db.update(leads).set(leadPatch).where(and(eq(leads.id, leadId), eq(leads.orgId, orgId)));
  }

  revalidatePath("/appointments");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/");
}

/* ------------------------------ SALES ------------------------------ */

export async function createSale(formData: FormData) {
  const { orgId } = await requireUser();
  const leadId = Number(formData.get("leadId"));
  const amount = num(formData.get("amount")) ?? 0;
  const appointmentId = num(formData.get("appointmentId"));

  const inserted = await db
    .insert(sales)
    .values({
      orgId,
      leadId,
      appointmentId,
      salesRepId: num(formData.get("salesRepId")),
      productId: num(formData.get("productId")),
      amount: amount.toString(),
      financeType: str(formData.get("financeType")) ?? "cash",
      soldAt: toDate(formData.get("soldAt")) ?? new Date(),
      notes: str(formData.get("notes")),
    })
    .returning();

  await db
    .update(leads)
    .set({ stage: "sold", estimatedValue: amount.toString(), updatedAt: new Date() })
    .where(and(eq(leads.id, leadId), eq(leads.orgId, orgId)));

  if (appointmentId) {
    await db
      .update(appointments)
      .set({ status: "sat", result: "sold" })
      .where(and(eq(appointments.id, appointmentId), eq(appointments.orgId, orgId)));
  }

  // Auto-create a production job
  const sale = inserted[0];
  if (sale) {
    await db.insert(jobs).values({
      orgId,
      saleId: sale.id,
      leadId,
      status: "pending",
      milestones: "{}",
    });
  }

  revalidatePath("/sales");
  revalidatePath("/production");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/");
}

/* --------------------------- PRODUCTION ---------------------------- */

// Manually create a production job (e.g. for existing jobs during onboarding),
// without requiring a prior sale or lead.
export async function createJob(formData: FormData) {
  const { orgId } = await requireUser();

  await db.insert(jobs).values({
    orgId,
    saleId: null,
    leadId: null,
    customerName: req(formData.get("customerName")) || "(unnamed job)",
    customerAddress: str(formData.get("customerAddress")),
    customerCity: str(formData.get("customerCity")),
    customerPhone: str(formData.get("customerPhone")),
    propertyId: num(formData.get("propertyId")),
    unitNumber: str(formData.get("unitNumber")),
    contractAmount: (num(formData.get("contractAmount")) ?? 0).toString(),
    productName: str(formData.get("productName")),
    status: req(formData.get("status")) || "pending",
    crew: str(formData.get("crew")),
    startDate: toDate(formData.get("startDate")),
    completionDate: toDate(formData.get("completionDate")),
    milestones: "{}",
    notes: str(formData.get("notes")),
  });

  revalidatePath("/production");
  revalidatePath("/");
}

export async function createProperty(formData: FormData) {
  const { orgId } = await requireUser();
  const leadId = num(formData.get("leadId"));
  const name = req(formData.get("name"));
  if (!leadId || !name) return;

  const [account] = await db
    .select({ id: leads.id })
    .from(leads)
    .where(and(eq(leads.id, leadId), eq(leads.orgId, orgId)))
    .limit(1);
  if (!account) return;

  await db.insert(properties).values({
    orgId,
    leadId,
    name,
    address: str(formData.get("address")),
    city: str(formData.get("city")),
    state: str(formData.get("state")),
    zip: str(formData.get("zip")),
    notes: str(formData.get("notes")),
  });

  revalidatePath("/production");
}

export async function updateJob(formData: FormData) {
  const { orgId } = await requireUser();
  const id = Number(formData.get("id"));
  const leadId = num(formData.get("leadId")); // null for manually-added jobs
  const status = req(formData.get("status"));

  // Collect milestone checkboxes
  const milestones: Record<string, boolean> = {};
  for (const [k, v] of formData.entries()) {
    if (k.startsWith("ms_")) milestones[k.slice(3)] = v === "on";
  }

  await db
    .update(jobs)
    .set({
      status,
      crew: str(formData.get("crew")),
      propertyId: num(formData.get("propertyId")),
      unitNumber: str(formData.get("unitNumber")),
      startDate: toDate(formData.get("startDate")),
      completionDate: toDate(formData.get("completionDate")),
      milestones: JSON.stringify(milestones),
      notes: str(formData.get("notes")),
      updatedAt: new Date(),
    })
    .where(and(eq(jobs.id, id), eq(jobs.orgId, orgId)));

  // Reflect onto the linked lead's stage (only if this job came from a lead)
  if (leadId) {
    const leadStage = status === "completed" ? "completed" : "production";
    await db
      .update(leads)
      .set({ stage: leadStage, updatedAt: new Date() })
      .where(and(eq(leads.id, leadId), eq(leads.orgId, orgId)));
    revalidatePath(`/leads/${leadId}`);
  }

  // Auto-invoice: when the job is completed, send the final invoice for the
  // remaining balance (skips financed deals and already-invoiced jobs on its own).
  if (status === "completed") {
    const [finished] = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, id), eq(jobs.orgId, orgId)))
      .limit(1);
    if (finished) {
      await createAndSendFinalInvoice(finished);
    }
  }

  revalidatePath("/production");
  revalidatePath("/invoices");
  revalidatePath("/");
}

export async function recordFinancingSettlement(formData: FormData) {
  const { orgId } = await requireUser();
  const id = Number(formData.get("id"));
  const amount = num(formData.get("amount"));
  const settledAt = toDate(formData.get("settledAt")) ?? new Date();
  const reference = str(formData.get("reference"));
  if (!id || amount === null || amount <= 0) return;

  const [row] = await db
    .select({
      job: jobs,
      financeType: sales.financeType,
      saleAmount: sales.amount,
      firstName: leads.firstName,
      lastName: leads.lastName,
    })
    .from(jobs)
    .leftJoin(sales, eq(jobs.saleId, sales.id))
    .leftJoin(leads, eq(jobs.leadId, leads.id))
    .where(and(eq(jobs.id, id), eq(jobs.orgId, orgId)))
    .limit(1);
  if (!row || row.financeType !== "financed" || row.job.status !== "completed") return;
  const saleAmount = Number(row.saleAmount ?? row.job.contractAmount ?? 0);
  if (saleAmount > 0 && amount > saleAmount) return;

  const [existing] = await db
    .select({ id: hcpPayments.id })
    .from(hcpPayments)
    .where(
      and(
        eq(hcpPayments.orgId, orgId),
        eq(hcpPayments.jobId, id),
        eq(hcpPayments.paymentType, "Wisetack settlement"),
      ),
    )
    .limit(1);
  if (existing) return;

  await db
    .insert(hcpPayments)
    .values({
      orgId,
      leadId: row.job.leadId,
      jobId: id,
      receivedAt: settledAt,
      amount: amount.toFixed(2),
      paymentType: "Wisetack settlement",
      customerName: [row.firstName, row.lastName].filter(Boolean).join(" ") || row.job.customerName,
      jobReference: `LeadFlow job ${id}`,
      notes: reference
        ? `Wisetack settlement recorded with reference ${reference}.`
        : "Wisetack settlement recorded manually.",
    })
    .returning({ id: hcpPayments.id });

  revalidatePath("/production");
  revalidatePath("/sales");
  revalidatePath("/reports");
}


// One-click completion: sets status + stamps today's date, leaves everything else.
export async function markJobCompleted(formData: FormData) {
  const { orgId } = await requireUser();
  const id = Number(formData.get("id"));
  const leadId = num(formData.get("leadId"));
  if (!id) return;

  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, id), eq(jobs.orgId, orgId)))
    .limit(1);
  if (!job || job.status === "completed") return;

  await db
    .update(jobs)
    .set({
      status: "completed",
      completionDate: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(jobs.id, id), eq(jobs.orgId, orgId)));

  if (leadId) {
    await db
      .update(leads)
      .set({ stage: "completed", updatedAt: new Date() })
      .where(and(eq(leads.id, leadId), eq(leads.orgId, orgId)));
    revalidatePath(`/leads/${leadId}`);
  }

  // Financed jobs move into the Wisetack settlement queue when completed.
  const [finished] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, id), eq(jobs.orgId, orgId)))
    .limit(1);
  if (finished) {
    // Triggers the final invoice automatically for non-financed jobs.
    await createAndSendFinalInvoice(finished);
  }

  revalidatePath("/production");
  revalidatePath("/board");
  revalidatePath("/invoices");
  revalidatePath("/");
}

/* --------------------------- SETTINGS ------------------------------ */

export async function createRep(formData: FormData) {
  const { orgId } = await requireUser();
  await db.insert(reps).values({
    orgId,
    name: req(formData.get("name")),
    email: str(formData.get("email")),
    phone: str(formData.get("phone")),
    role: req(formData.get("role")) || "sales",
  });
  revalidatePath("/settings");
}

export async function createSource(formData: FormData) {
  const { orgId } = await requireUser();
  await db.insert(leadSources).values({
    orgId,
    name: req(formData.get("name")),
    category: req(formData.get("category")) || "internet",
    monthlyCost: (num(formData.get("monthlyCost")) ?? 0).toString(),
  });
  revalidatePath("/settings");
  revalidatePath("/marketing");
}

export async function updateSource(formData: FormData) {
  const { orgId } = await requireUser();
  const id = Number(formData.get("id"));
  if (!id) return;
  await db
    .update(leadSources)
    .set({
      name: req(formData.get("name")),
      category: req(formData.get("category")) || "internet",
      monthlyCost: (num(formData.get("monthlyCost")) ?? 0).toString(),
    })
    .where(and(eq(leadSources.id, id), eq(leadSources.orgId, orgId)));
  revalidatePath("/settings");
  revalidatePath("/marketing");
}

export async function createProduct(formData: FormData) {
  const { orgId } = await requireUser();
  await db.insert(products).values({
    orgId,
    name: req(formData.get("name")),
    avgTicket: (num(formData.get("avgTicket")) ?? 0).toString(),
  });
  revalidatePath("/settings");
}
