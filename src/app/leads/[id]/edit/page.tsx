import { db } from "@/db";
import { leads } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader, Card } from "@/components/ui";
import { getSources, getProducts, getReps } from "@/lib/queries";
import { requireAccess } from "@/lib/auth";
import { updateLead } from "@/lib/actions";

export const dynamic = "force-dynamic";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400";
const label = "mb-1 block text-xs font-medium text-slate-600";

export default async function EditLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { orgId } = await requireAccess("leads");
  const { id } = await params;
  const leadId = Number(id);
  const [lead] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, leadId), eq(leads.orgId, orgId)))
    .limit(1);
  if (!lead) notFound();

  const [sources, prods, allReps] = await Promise.all([
    getSources(),
    getProducts(),
    getReps(),
  ]);

  async function action(formData: FormData) {
    "use server";
    await updateLead(formData);
    redirect(`/leads/${leadId}`);
  }

  return (
    <div>
      <PageHeader title="Edit Prospect" subtitle={`${lead.firstName} ${lead.lastName}`} />
      <Card className="max-w-3xl p-6">
        <form action={action} className="grid grid-cols-2 gap-4">
          <input type="hidden" name="id" value={lead.id} />
          <div>
            <label className={label}>First Name *</label>
            <input name="firstName" required defaultValue={lead.firstName} className={input} />
          </div>
          <div>
            <label className={label}>Last Name *</label>
            <input name="lastName" required defaultValue={lead.lastName} className={input} />
          </div>
          <div>
            <label className={label}>Phone</label>
            <input name="phone" defaultValue={lead.phone ?? ""} className={input} />
          </div>
          <div>
            <label className={label}>Alt. Phone</label>
            <input name="altPhone" defaultValue={lead.altPhone ?? ""} className={input} />
          </div>
          <div className="col-span-2">
            <label className={label}>Email</label>
            <input name="email" type="email" defaultValue={lead.email ?? ""} className={input} />
          </div>
          <div className="col-span-2">
            <label className={label}>Address</label>
            <input name="address" defaultValue={lead.address ?? ""} className={input} />
          </div>
          <div>
            <label className={label}>City</label>
            <input name="city" defaultValue={lead.city ?? ""} className={input} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>State</label>
              <input name="state" defaultValue={lead.state ?? ""} className={input} />
            </div>
            <div>
              <label className={label}>Zip</label>
              <input name="zip" defaultValue={lead.zip ?? ""} className={input} />
            </div>
          </div>
          <div>
            <label className={label}>Lead Source</label>
            <select name="sourceId" className={input} defaultValue={lead.sourceId ?? ""}>
              <option value="">— Select —</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Product Interest</label>
            <select name="productId" className={input} defaultValue={lead.productId ?? ""}>
              <option value="">— Select —</option>
              {prods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Assigned Rep</label>
            <select name="assignedRepId" className={input} defaultValue={lead.assignedRepId ?? ""}>
              <option value="">— Unassigned —</option>
              {allReps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Estimated Value ($)</label>
            <input
              name="estimatedValue"
              type="number"
              step="0.01"
              defaultValue={lead.estimatedValue}
              className={input}
            />
          </div>
          <div className="col-span-2">
            <label className={label}>Notes</label>
            <textarea name="notes" rows={3} defaultValue={lead.notes ?? ""} className={input} />
          </div>
          <div className="col-span-2 flex gap-3">
            <button className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600">
              Save Changes
            </button>
            <Link
              href={`/leads/${lead.id}`}
              className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
