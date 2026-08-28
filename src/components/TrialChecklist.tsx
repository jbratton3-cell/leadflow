import { db } from "@/db";
import { leads, estimates, invoices } from "@/db/schema";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import TrialGuide from "@/components/TrialGuide";

// Server component: derives real progress from the database for trial orgs.
// No self-reported checkboxes — the CRM itself confirms each step.
export default async function TrialChecklist({ orgId }: { orgId: number }) {
  const count = sql<number>`count(*)::int`;
  const [[leadRow], [sentRow], [acceptedRow], [invRow]] = await Promise.all([
    db.select({ n: count }).from(leads).where(eq(leads.orgId, orgId)),
    db
      .select({ n: count })
      .from(estimates)
      .where(and(eq(estimates.orgId, orgId), isNotNull(estimates.sentAt))),
    db
      .select({ n: count })
      .from(estimates)
      .where(and(eq(estimates.orgId, orgId), eq(estimates.status, "accepted"))),
    db.select({ n: count }).from(invoices).where(eq(invoices.orgId, orgId)),
  ]);

  return (
    <TrialGuide
      hasLead={Number(leadRow?.n ?? 0) > 0}
      hasSent={Number(sentRow?.n ?? 0) > 0}
      hasAccepted={Number(acceptedRow?.n ?? 0) > 0}
      hasInvoice={Number(invRow?.n ?? 0) > 0}
    />
  );
}
