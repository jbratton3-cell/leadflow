"use server";

import { db } from "@/db";
import {
  leads,
  callLogs,
  appointments,
  sales,
  jobs,
  reps,
  leadSources,
  products,
} from "@/db/schema";
import { createAndSendFinalInvoice } from "@/lib/invoice-actions";
import { and, eq } from "drizzle-orm";
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
  await db.insert(leads).values({
    orgId,
    firstName: req(formData.get("firstName")),
    lastName: req(formData.get("lastName")),
    email: str(formData.get("email")),
    phone: str(formData.get("phone")),
    altPhone: str(formData.get("altPhone")),
    address: str(formData.get("address")),
    city: str(formData.get("city")),
    state: str(formData.get("state")),
    zip: str(formData.get("zip")),
    sourceId: num(formData.get("sourceId")),
    productId: num(formData.get("productId")),
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
  await db
    .update(leads)
    .set({
      firstName: req(formData.get("firstName")),
      lastName: req(formData.get("lastName")),
      email: str(formData.get("email")),
      phone: str(formData.get("phone")),
      altPhone: str(formData.get("altPhone")),
      address: str(formData.get("address")),
      city: str(formData.get("city")),
      state: str(formData.get("state")),
      zip: str(formData.get("zip")),
      sourceId: num(formData.get("sourceId")),
      productId: num(formData.get("productId")),
      assignedRepId: num(formData.get("assignedRepId")),
      estimatedValue: (num(formData.get("estimatedValue")) ?? 0).toString(),
      notes: str(formData.get("notes")),
      updatedAt: new Date(),
    })
    .where(and(eq(leads.id, id), eq(leads.orgId, orgId)));
  revalidatePath(`/leads/${id}`);
  revalidatePath("/leads");
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

  // Triggers the final invoice automatically (same as the manual path).
  await createAndSendFinalInvoice(
    await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, id), eq(jobs.orgId, orgId)))
      .limit(1)
      .then((r) => r[0])
  );

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

export async function createProduct(formData: FormData) {
  const { orgId } = await requireUser();
  await db.insert(products).values({
    orgId,
    name: req(formData.get("name")),
    avgTicket: (num(formData.get("avgTicket")) ?? 0).toString(),
  });
  revalidatePath("/settings");
}
