import { db } from "@/db";
import { leads } from "@/db/schema";
import { count, desc, ilike, or, eq, and, type SQL } from "drizzle-orm";
import Link from "next/link";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { getSources, getProducts, getReps, toMap } from "@/lib/queries";
import { requireAccess } from "@/lib/auth";
import { accountTypeLabel, STAGES, stageLabel, stageColor, money, fmtDate, personName } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; q?: string; page?: string }>;
}) {
  const { orgId } = await requireAccess("leads");
  const { stage, q, page: pageParam } = await searchParams;
  const search = q?.trim();
  const pageSize = 50;
  const parsedPage = Number.parseInt(pageParam ?? "1", 10);
  const requestedPage = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;

  const conds: SQL[] = [eq(leads.orgId, orgId)];
  if (stage) conds.push(eq(leads.stage, stage));
  if (search) {
    const like = `%${search}%`;
    conds.push(
      or(
        ilike(leads.firstName, like),
        ilike(leads.lastName, like),
        ilike(leads.address, like),
        ilike(leads.phone, like),
        ilike(leads.city, like),
        ilike(leads.zip, like)
      )!
    );
  }

  const [{ total }, sources, prods, allReps] = await Promise.all([
    db
      .select({ total: count() })
      .from(leads)
      .where(conds.length ? and(...conds) : undefined)
      .then(([result]) => ({ total: Number(result?.total ?? 0) })),
    getSources(),
    getProducts(),
    getReps(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * pageSize;

  const [rows] = await Promise.all([
    db
      .select()
      .from(leads)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(leads.updatedAt))
      .limit(pageSize)
      .offset(offset),
  ]);

  const srcMap = toMap(sources);
  const prodMap = toMap(prods);
  const repMap = toMap(allReps);
  const firstResult = total === 0 ? 0 : offset + 1;
  const lastResult = Math.min(offset + rows.length, total);
  const pageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (stage) params.set("stage", stage);
    if (search) params.set("q", search);
    if (targetPage > 1) params.set("page", String(targetPage));
    const query = params.toString();
    return query ? `/leads?${query}` : "/leads";
  };

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
            placeholder="Search name, address, phone, city, zip…"
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

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
        <span>
          Showing {firstResult.toLocaleString()}–{lastResult.toLocaleString()} of {total.toLocaleString()} prospects
        </span>
        {totalPages > 1 && (
          <nav className="flex items-center gap-1" aria-label="Prospects pages">
            <Link
              href={pageHref(currentPage - 1)}
              aria-disabled={currentPage === 1}
              className={`rounded-lg border px-3 py-1.5 font-medium ${
                currentPage === 1
                  ? "pointer-events-none border-slate-200 text-slate-300"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Previous
            </Link>
            <span className="px-2 text-xs font-medium text-slate-500">
              Page {currentPage} of {totalPages}
            </span>
            <Link
              href={pageHref(currentPage + 1)}
              aria-disabled={currentPage === totalPages}
              className={`rounded-lg border px-3 py-1.5 font-medium ${
                currentPage === totalPages
                  ? "pointer-events-none border-slate-200 text-slate-300"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Next
            </Link>
          </nav>
        )}
      </div>

      {rows.length === 0 ? (
        search ? (
          <div className="grid place-items-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-sm text-slate-600">
              No prospect found for <span className="font-semibold text-slate-800">“{search}”</span>.
            </p>
            <Link
              href={`/leads/new?q=${encodeURIComponent(search)}`}
              className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
            >
              Create new prospect
            </Link>
          </div>
        ) : (
          <EmptyState message="No prospects yet. Add a new prospect to get started." />
        )
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
                  <th className="px-4 py-3 font-medium"><span className="sr-only">Actions</span></th>
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
                      <div className="text-xs text-cyan-700">
                        {accountTypeLabel(l.accountType)}
                        {l.standingContract ? " · Standing contract" : ""}
                      </div>
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
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/leads/${l.id}/edit`}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex justify-end">
          <nav className="flex items-center gap-1" aria-label="Prospects pages">
            <Link
              href={pageHref(currentPage - 1)}
              aria-disabled={currentPage === 1}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                currentPage === 1
                  ? "pointer-events-none border-slate-200 text-slate-300"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Previous
            </Link>
            <span className="px-2 text-xs font-medium text-slate-500">
              Page {currentPage} of {totalPages}
            </span>
            <Link
              href={pageHref(currentPage + 1)}
              aria-disabled={currentPage === totalPages}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                currentPage === totalPages
                  ? "pointer-events-none border-slate-200 text-slate-300"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Next
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
