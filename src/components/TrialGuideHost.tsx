import { db } from "@/db";
import { leads, estimates, invoices } from "@/db/schema";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { organizations } from "@/db/schema";
import FloatingTrialGuide from "@/components/FloatingTrialGuide";

// Server side: computes trial progress and renders the floating guide.
// Rendered from the root layout so it follows the user across every page.
export default async function TrialGuideHost() {
  const user = await getSessionUser();
  if (!user) return null;

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, user.orgId))
    .limit(1);
  if (!org || org.plan !== "trial") return null;

  const count = sql<number>`count(*)::int`;
  const [[leadRow], [sentRow], [acceptedRow], [invRow]] = await Promise.all([
    db.select({ n: count }).from(leads).where(eq(leads.orgId, user.orgId)),
    db
      .select({ n: count })
      .from(estimates)
      .where(and(eq(estimates.orgId, user.orgId), isNotNull(estimates.sentAt))),
    db
      .select({ n: count })
      .from(estimates)
      .where(and(eq(estimates.orgId, user.orgId), eq(estimates.status, "accepted"))),
    db.select({ n: count }).from(invoices).where(eq(invoices.orgId, user.orgId)),
  ]);

  return (
    <FloatingTrialGuide
      hasLead={Number(leadRow?.n ?? 0) > 0}
      hasSent={Number(sentRow?.n ?? 0) > 0}
      hasAccepted={Number(acceptedRow?.n ?? 0) > 0}
      hasInvoice={Number(invRow?.n ?? 0) > 0}
    />
  );
}
