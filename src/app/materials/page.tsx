import { db } from "@/db";
import { materialOrders, materialOrderItems, suppliers, jobs, leads } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { PageHeader, Card, Badge } from "@/components/ui";
import { requireAccess } from "@/lib/auth";
import { fmtDate } from "@/lib/constants";
import { resendMaterialOrder } from "@/lib/material-actions";

export const dynamic = "force-dynamic";

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { orgId } = await requireAccess("production");
  const { sent } = await searchParams;

  const rows = await db
    .select({
      order: materialOrders,
      supplierName: suppliers.name,
      jobCustomer: jobs.customerName,
      firstName: leads.firstName,
      lastName: leads.lastName,
    })
    .from(materialOrders)
    .leftJoin(suppliers, eq(materialOrders.supplierId, suppliers.id))
    .leftJoin(jobs, eq(materialOrders.jobId, jobs.id))
    .leftJoin(leads, eq(jobs.leadId, leads.id))
    .where(eq(materialOrders.orgId, orgId))
    .orderBy(desc(materialOrders.createdAt))
    .limit(50);

  const itemCounts = new Map<number, number>();
  if (rows.length > 0) {
    const allItems = await db.select().from(materialOrderItems).where(eq(materialOrderItems.orgId, orgId));
    for (const it of allItems) {
      itemCounts.set(it.orderId, (itemCounts.get(it.orderId) ?? 0) + 1);
    }
  }

  return (
    <div>
      <PageHeader
        title="Materials"
        subtitle="Orders emailed to suppliers — logged and linked to their jobs."
        action={
          <Link href="/materials/new" className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
            + Order Materials
          </Link>
        }
      />

      {sent && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Order {sent} submitted — emailed to the supplier.
        </div>
      )}

      {rows.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="text-3xl">🧱</div>
          <h2 className="mt-3 font-semibold text-slate-800">No orders yet</h2>
          <p className="mt-1 text-sm text-slate-500">
            Create the first materials order — it emails the supplier automatically.
          </p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium">Job</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Sent</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.order.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{r.order.number}</td>
                  <td className="px-4 py-3 text-slate-600">{r.supplierName ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.firstName
                      ? `${r.firstName} ${r.lastName ?? ""}`.trim()
                      : r.jobCustomer ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{itemCounts.get(r.order.id) ?? 0}</td>
                  <td className="px-4 py-3">
                    <Badge className={r.order.status === "sent" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                      {r.order.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {r.order.sentAt ? fmtDate(r.order.sentAt) : "not sent"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.order.status !== "sent" && (
                      <form action={resendMaterialOrder}>
                        <input type="hidden" name="id" value={r.order.id} />
                        <button className="text-xs font-medium text-orange-600 hover:underline">Send now</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
