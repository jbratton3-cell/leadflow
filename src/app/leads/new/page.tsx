import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader, Card } from "@/components/ui";
import { getSources, getProducts, getCallReps } from "@/lib/queries";
import { requireAccess } from "@/lib/auth";
import { createLead } from "@/lib/actions";
import { roleLabel } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function NewLeadPage() {
  await requireAccess("leads");

  const [sources, prods, callReps] = await Promise.all([
    getSources(),
    getProducts(),
    getCallReps(),
  ]);

  async function action(formData: FormData) {
    "use server";
    await createLead(formData);
    redirect("/leads");
  }

  const input =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400";
  const label = "mb-1 block text-xs font-medium text-slate-600";

  return (
    <div>
      <PageHeader title="New Prospect" subtitle="Capture a new lead into the pipeline." />
      <Card className="max-w-3xl p-6">
        <form action={action} className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>First Name *</label>
            <input name="firstName" className={input} />
          </div>
          <div>
            <label className={label}>Last Name *</label>
            <input name="lastName" className={input} />
          </div>
          <div>
            <label className={label}>Phone</label>
            <input name="phone" className={input} />
          </div>
          <div>
            <label className={label}>Alt. Phone</label>
            <input name="altPhone" className={input} />
          </div>
          <div className="col-span-2">
            <label className={label}>Email</label>
            <input name="email" type="email" className={input} />
          </div>
          <div className="col-span-2">
            <label className={label}>Address</label>
            <input name="address" className={input} />
          </div>
          <div>
            <label className={label}>City</label>
            <input name="city" className={input} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>State</label>
              <input name="state" className={input} />
            </div>
            <div>
              <label className={label}>Zip</label>
              <input name="zip" className={input} />
            </div>
          </div>
          <div>
            <label className={label}>Lead Source</label>
            <select name="sourceId" className={input} defaultValue="">
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
            <select name="productId" className={input} defaultValue="">
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
            <select name="assignedRepId" className={input} defaultValue="">
              <option value="">— Unassigned —</option>
              {callReps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({roleLabel(r.role)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Estimated Value ($)</label>
            <input name="estimatedValue" type="number" step="0.01" className={input} />
          </div>
          <div className="col-span-2">
            <label className={label}>Notes</label>
            <textarea name="notes" rows={3} className={input} />
          </div>
          <div className="col-span-2 flex gap-3">
            <button className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600">
              Save Prospect
            </button>
            <Link
              href="/leads"
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
