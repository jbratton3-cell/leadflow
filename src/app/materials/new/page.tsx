import { db } from "@/db";
import { suppliers, materials, jobs, leads } from "@/db/schema";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { PageHeader, Card } from "@/components/ui";
import { requireAccess } from "@/lib/auth";
import { createMaterialOrder } from "@/lib/material-actions";

export const dynamic = "force-dynamic";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400";

export default async function NewMaterialOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>;
}) {
  const { orgId } = await requireAccess("production");
  const { jobId } = await searchParams;

  const [supplierRows, materialRows, jobRows] = await Promise.all([
    db.select().from(suppliers).where(eq(suppliers.orgId, orgId)).orderBy(asc(suppliers.name)),
    db
      .select()
      .from(materials)
      .where(and(eq(materials.orgId, orgId), eq(materials.active, true)))
      .orderBy(asc(materials.name)),
    db
      .select({ id: jobs.id, customerName: jobs.customerName, status: jobs.status, firstName: leads.firstName, lastName: leads.lastName, address: leads.address })
      .from(jobs)
      .leftJoin(leads, eq(jobs.leadId, leads.id))
      .where(and(eq(jobs.orgId, orgId), inArray(jobs.status, ["pending", "measure", "permits", "materials_ordered", "scheduled", "in_progress", "on_hold"])))
      .orderBy(desc(jobs.createdAt))
      .limit(30),
  ]);

  return (
    <div>
      <PageHeader
        title="Order Materials"
        subtitle="Select a supplier and materials — the order emails automatically on submit."
        action={
          <Link href="/materials" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
            ← Order history
          </Link>
        }
      />

      {supplierRows.length === 0 ? (
        <Card className="p-8 text-center">
          <h2 className="font-semibold text-slate-800">Add a supplier first</h2>
          <p className="mt-1 text-sm text-slate-500">
            Suppliers (with their order email addresses) are managed in Settings.
          </p>
          <Link href="/settings" className="mt-3 inline-block rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
            Go to Settings
          </Link>
        </Card>
      ) : (
        <form action={createMaterialOrder} className="space-y-6">
          <Card className="p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Job (optional)</label>
                <select name="jobId" defaultValue={jobId ?? ""} className={input}>
                  <option value="">— No specific job —</option>
                  {jobRows.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.firstName ? `${j.firstName} ${j.lastName ?? ""}`.trim() : j.customerName ?? "Job"} {j.address ? `— ${j.address}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Supplier *</label>
                <select name="supplierId" required defaultValue="" className={input}>
                  <option value="" disabled>
                    — Select supplier —
                  </option>
                  {supplierRows.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.email ? `(${s.email})` : "(no email on file!)"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Materials</h2>
            <div className="grid gap-2 md:grid-cols-2">
              {materialRows.map((m) => (
                <div key={m.id} className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2">
                  <input
                    type="checkbox"
                    name={`mat_${m.id}`}
                    className="h-4 w-4 accent-orange-500"
                    id={`mat-check-${m.id}`}
                  />
                  <label htmlFor={`mat-check-${m.id}`} className="min-w-0 flex-1 cursor-pointer truncate text-sm text-slate-700">
                    {m.name} <span className="text-xs text-slate-400">({m.unit})</span>
                  </label>
                  <input
                    type="number"
                    name={`qty_${m.id}`}
                    min="0"
                    step="0.01"
                    placeholder="qty"
                    className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                  />
                </div>
              ))}
            </div>
            {materialRows.length === 0 && (
              <p className="text-sm text-slate-400">No materials yet — add them in Settings.</p>
            )}

            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="mb-1 text-xs font-medium text-slate-600">Custom line (anything not in the list)</div>
              <div className="grid gap-2 md:grid-cols-[2fr_80px_100px]">
                <input name="customName" placeholder="e.g. 6ft ladder brackets" className={input} />
                <input name="customQty" type="number" min="0" step="0.01" placeholder="qty" className={input} />
                <input name="customUnit" placeholder="unit" className={input} />
              </div>
            </div>
          </Card>

          <button className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600">
            Submit Order — emails supplier
          </button>
        </form>
      )}
    </div>
  );
}
