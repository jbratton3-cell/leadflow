import { db } from "@/db";
import { estimates, leads } from "@/db/schema";
import { and, desc, eq, sql, gte } from "drizzle-orm";
import Link from "next/link";
import { PageHeader, Card, Badge, EmptyState, StatCard } from "@/components/ui";
import { requireAccess } from "@/lib/auth";
import {
  estimateStatusLabel,
  estimateStatusColor,
  money,
  fmtDate,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function EstimatesPage() {
  const { orgId } = await requireAccess("estimates");

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [rows, statusAgg, acceptedAgg] = await Promise.all([
    db
      .select({
        est: estimates,
        firstName: leads.firstName,
        lastName: leads.lastName,
        city: leads.city,
      })
      .from(estimates)
      .leftJoin(leads, eq(estimates.leadId, leads.id))
      .where(eq(estimates.orgId, orgId))
      .orderBy(desc(estimates.createdAt))
      .limit(200),
    db
      .select({ status: estimates.status, count: sql<number>`count(*)::int` })
      .from(estimates)
      .where(eq(estimates.orgId, orgId))
      .groupBy(estimates.status),
    db
      .select({
        count: sql<number>`count(*)::int`,
        total: sql<string>`coalesce(sum(${estimates.total}),0)`,
      })
      .from(estimates)
      .where(and(eq(estimates.orgId, orgId), gte(estimates.createdAt, monthStart))),
  ]);

  const statusMap = new Map(statusAgg.map((s) => [s.status, s.count]));
  const sent = (statusMap.get("sent") ?? 0) + (statusMap.get("viewed") ?? 0);
  const accepted = statusMap.get("accepted") ?? 0;
  const mtdCount = acceptedAgg[0]?.count ?? 0;
  const mtdValue = Number(acceptedAgg[0]?.total ?? 0);

  return (
    <div>
      <PageHeader
        title="Estimates"
        subtitle="Create, send, and track customer estimates."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Estimates" value={rows.length} />
        <StatCard label="Outstanding (Sent)" value={sent} accent="text-blue-600" />
        <StatCard label="Accepted" value={accepted} accent="text-emerald-600" />
        <StatCard label="Value Created (MTD)" value={money(mtdValue)} sub={`${mtdCount} estimates`} />
      </div>

      {rows.length === 0 ? (
        <EmptyState message="No estimates yet. Open a prospect and click “New Estimate” to create one." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Estimate</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.est.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/estimates/${r.est.id}`}
                        className="font-semibold text-slate-800 hover:text-orange-600"
                      >
                        {r.est.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/leads/${r.est.leadId}`}
                        className="text-slate-700 hover:text-orange-600"
                      >
                        {r.firstName} {r.lastName}
                      </Link>
                      <div className="text-xs text-slate-400">{r.city ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.est.title}</td>
                    <td className="px-4 py-3">
                      <Badge className={estimateStatusColor(r.est.status)}>
                        {estimateStatusLabel(r.est.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">
                      {money(r.est.total)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {fmtDate(r.est.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
