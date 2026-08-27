import { db } from "@/db";
import { leads } from "@/db/schema";
import { desc, ilike, or, eq, and, type SQL } from "drizzle-orm";
import Link from "next/link";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { getSources, getProducts, getReps, toMap } from "@/lib/queries";
import { requireAccess } from "@/lib/auth";
import { STAGES, stageLabel, stageColor, money, fmtDate, personName } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; q?: string }>;
}) {
  const { orgId } = await requireAccess("leads");
  const { stage, q } = await searchParams;

  const conds: SQL[] = [eq(leads.orgId, orgId)];
  if (stage) conds.push(eq(leads.stage, stage));
  if (q) {
    const like = `%${q}%`;
    conds.push(
      or(
        ilike(leads.firstName, like),
        ilike(leads.lastName, like),
        ilike(leads.phone, like),
        ilike(leads.city, like),
        ilike(leads.zip, like)
      )!
    );
  }

  const [rows, sources, prods, allReps] = await Promise.all([
    db
      .select()
      .from(leads)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(leads.updatedAt))
      .limit(200),
    getSources(),
    getProducts(),
    getReps(),
  ]);

  const srcMap = toMap(sources);
  const prodMap = toMap(prods);
  const repMap = toMap(allReps);

  return (
    <div>
      <PageHeader
        title="Prospects"
        subtitle="All leads from every source, tracked through the pipeline."
        action={
          <Link
            href="/leads/new"
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
          >
            + New Prospect
          </Link>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <form className="flex gap-2" action="/leads">
          {stage && <input type="hidden" name="stage" value={stage} />}
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search name, phone, city, zip…"
            className="w-64 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-orange-400"
          />
          <button className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
            Search
          </button>
        </form>
        <div className="flex flex-wrap gap-1.5">
          <Link
            href="/leads"
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              !stage ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All
          </Link>
          {STAGES.map((s) => (
            <Link
              key={s.key}
              href={`/leads?stage=${s.key}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                stage === s.key
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState message="No prospects match. Add a new prospect to get started." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Stage</th>
                  <th className="px-4 py-3 font-medium">Rep</th>
                  <th className="px-4 py-3 text-right font-medium">Est. Value</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/leads/${l.id}`} className="font-semibold text-slate-800 hover:text-orange-600">
                        {personName(l.firstName, l.lastName)}
                      </Link>
                      {l.doNotCall && (
                        <span className="ml-2 text-[10px] font-bold uppercase text-rose-600">DNC</span>
                      )}
                      <div className="text-xs text-slate-400">{l.phone ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {l.city ? `${l.city}, ${l.state ?? ""}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {l.productId ? prodMap.get(l.productId)?.name ?? "—" : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {l.sourceId ? srcMap.get(l.sourceId)?.name ?? "—" : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={stageColor(l.stage)}>{stageLabel(l.stage)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {l.assignedRepId ? repMap.get(l.assignedRepId)?.name ?? "—" : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                      {money(l.estimatedValue)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(l.updatedAt)}</td>
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
