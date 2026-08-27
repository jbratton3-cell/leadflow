import { db } from "@/db";
import { leads } from "@/db/schema";
import { and, eq, inArray, asc, sql, lte } from "drizzle-orm";
import Link from "next/link";
import { PageHeader, Card, Badge, EmptyState, StatCard } from "@/components/ui";
import { getSources, getProducts, getCallReps, getSalesReps, toMap } from "@/lib/queries";
import { requireAccess } from "@/lib/auth";
import DispositionForm from "@/components/DispositionForm";
import {
  stageLabel,
  stageColor,
  fmtDateTime,
  fmtDate,
  dispositionLabel,
  deadReasonLabel,
  REHASHABLE_REASONS, personName } from "@/lib/constants";

export const dynamic = "force-dynamic";

// Leads must sit untouched this many days before entering the rehash queue.
const REHASH_AGE_DAYS = 14;

export default async function CallCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ queue?: string }>;
}) {
  const { orgId } = await requireAccess("call_center");
  const { queue: queueParam } = await searchParams;
  const isRehash = queueParam === "rehash";
  const now = new Date();
  const rehashCutoff = new Date(now.getTime() - REHASH_AGE_DAYS * 86400000);

  // Fresh dial queue: leads in new/contacting stage, not DNC.
  // Priority: due callbacks first, then new leads, then oldest touched.
  const freshQueue = await db
    .select()
    .from(leads)
    .where(and(eq(leads.orgId, orgId), eq(leads.doNotCall, false), inArray(leads.stage, ["new", "contacting"])))
    .orderBy(
      sql`case when ${leads.callbackAt} is not null and ${leads.callbackAt} <= now() then 0
             when ${leads.stage} = 'new' then 1 else 2 end`,
      asc(leads.updatedAt)
    )
    .limit(50);

  // Rehash queue: aged, dead/unsold leads that are eligible to re-work.
  // Excludes DNC, wrong numbers, and bad leads. Oldest (coldest) first.
  const rehashQueue = await db
    .select()
    .from(leads)
    .where(
      and(
        eq(leads.orgId, orgId),
        eq(leads.doNotCall, false),
        eq(leads.stage, "dead"),
        inArray(leads.deadReason, REHASHABLE_REASONS),
        lte(leads.updatedAt, rehashCutoff)
      )
    )
    .orderBy(asc(leads.updatedAt))
    .limit(50);

  // Count of leads that will *become* rehashable soon (aged unsold sits, etc.)
  const [freshTotalRow, rehashTotalRow] = await Promise.all([
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(leads)
      .where(and(eq(leads.orgId, orgId), eq(leads.doNotCall, false), inArray(leads.stage, ["new", "contacting"]))),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(leads)
      .where(
        and(
          eq(leads.orgId, orgId),
          eq(leads.doNotCall, false),
          eq(leads.stage, "dead"),
          inArray(leads.deadReason, REHASHABLE_REASONS),
          lte(leads.updatedAt, rehashCutoff)
        )
      ),
  ]);

  const queue = isRehash ? rehashQueue : freshQueue;

  const [sources, prods, callReps, salesReps] = await Promise.all([
    getSources(),
    getProducts(),
    getCallReps(),
    getSalesReps(),
  ]);
  const srcMap = toMap(sources);
  const prodMap = toMap(prods);

  const dueCallbacks = freshQueue.filter(
    (l) => l.callbackAt && new Date(l.callbackAt) <= now
  ).length;
  const newCount = freshQueue.filter((l) => l.stage === "new").length;
  const freshCount = freshTotalRow[0]?.c ?? 0;
  const rehashCount = rehashTotalRow[0]?.c ?? 0;

  const next = queue[0];
  const accentRing = isRehash ? "ring-violet-200" : "ring-orange-200";
  const accentText = isRehash ? "text-violet-600" : "text-orange-600";

  return (
    <div>
      <PageHeader
        title="Call Center"
        subtitle="Automated dial queues — always know the right next call to make."
      />

      {/* Queue toggle */}
      <div className="mb-6 flex gap-2">
        <Link
          href="/call-center"
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            !isRehash
              ? "bg-orange-500 text-white shadow-sm"
              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          }`}
        >
          📞 Fresh Dial
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              !isRehash ? "bg-orange-600" : "bg-slate-100 text-slate-500"
            }`}
          >
            {freshCount}
          </span>
        </Link>
        <Link
          href="/call-center?queue=rehash"
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            isRehash
              ? "bg-violet-600 text-white shadow-sm"
              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          }`}
        >
          ♻️ Rehash
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              isRehash ? "bg-violet-700" : "bg-slate-100 text-slate-500"
            }`}
          >
            {rehashCount}
          </span>
        </Link>
      </div>

      {isRehash ? (
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
          <StatCard label="Rehash Pool" value={rehashCount} accent="text-violet-600" />
          <StatCard
            label="Aging Rule"
            value={`${REHASH_AGE_DAYS}+ days`}
            sub="Untouched before rehash"
          />
          <StatCard label="Fresh Waiting" value={freshCount} accent="text-orange-600" />
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <StatCard label="In Queue" value={freshCount} accent="text-orange-600" />
          <StatCard label="Due Callbacks" value={dueCallbacks} accent="text-amber-600" />
          <StatCard label="Fresh Leads" value={newCount} accent="text-blue-600" />
        </div>
      )}

      {isRehash && (
        <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">
          <strong>Rehash queue</strong> re-works aged, unsold leads — not-interested,
          no-shows, cancelled appointments, and one-leg demos. Do-not-call, wrong
          numbers, and bad leads are excluded. Logging a contact or booking an
          appointment automatically returns the lead to the active pipeline.
        </div>
      )}

      {!next ? (
        <EmptyState
          message={
            isRehash
              ? "No aged leads to rehash right now. Great — the pool is worked!"
              : "🎉 Queue is clear! No leads waiting to be dialed."
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Next to Dial card */}
          <Card className={`lg:col-span-2 p-6 ring-2 ${accentRing}`}>
            <div className="mb-4 flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wide ${accentText}`}>
                {isRehash ? "♻️ Next To Rehash" : "⭐ Next To Dial"}
              </span>
              <Badge className={stageColor(next.stage)}>{stageLabel(next.stage)}</Badge>
            </div>
            <div className="flex flex-wrap items-baseline gap-3">
              <Link href={`/leads/${next.id}`} className="text-2xl font-bold text-slate-900 hover:text-orange-600">
                {personName(next.firstName, next.lastName)}
              </Link>
              <a href={`tel:${next.phone ?? ""}`} className={`text-lg font-semibold ${accentText}`}>
                {next.phone ?? "No phone"}
              </a>
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {next.city ? `${next.city}, ${next.state ?? ""} ${next.zip ?? ""}` : "No address"}
              {" · "}
              {next.productId ? prodMap.get(next.productId)?.name : "No product"}
              {" · "}
              {next.sourceId ? srcMap.get(next.sourceId)?.name : "No source"}
            </div>
            {isRehash && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <Badge className="bg-violet-100 text-violet-700">
                  Rehash: {deadReasonLabel(next.deadReason)}
                </Badge>
                <span className="text-slate-400">Last touched {fmtDate(next.updatedAt)}</span>
              </div>
            )}
            {next.callbackAt && !isRehash && (
              <div className="mt-1 text-sm font-medium text-amber-600">
                Callback due: {fmtDateTime(next.callbackAt)}
              </div>
            )}
            {next.notes && (
              <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{next.notes}</div>
            )}

            {/* Quick disposition — select "Appointment" to reveal the scheduler */}
            <div className="mt-5 border-t border-slate-100 pt-4">
              <DispositionForm
                key={next.id}
                leadId={next.id}
                callReps={callReps}
                salesReps={salesReps}
                defaultRepId={next.assignedRepId}
                defaultSalesRepId={next.assignedRepId}
                submitLabel={isRehash ? "Save & Next Rehash" : "Save & Next"}
              />
            </div>
          </Card>

          {/* Rest of queue */}
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              {isRehash ? "Rehash Pool" : "Up Next"} ({queue.length - 1})
            </h2>
            <ul className="divide-y divide-slate-100">
              {queue.slice(1, 20).map((l) => (
                <li key={l.id} className="py-2">
                  <Link href={`/leads/${l.id}`} className="flex items-center justify-between hover:text-orange-600">
                    <span className="text-sm font-medium text-slate-700">
                      {personName(l.firstName, l.lastName)}
                    </span>
                    <span className="text-xs text-slate-400">{l.phone}</span>
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    {isRehash ? (
                      <>
                        <Badge className="bg-violet-100 text-violet-700">
                          {deadReasonLabel(l.deadReason)}
                        </Badge>
                        <span>{fmtDate(l.updatedAt)}</span>
                      </>
                    ) : (
                      <>
                        <Badge className={stageColor(l.stage)}>{stageLabel(l.stage)}</Badge>
                        {l.disposition && <span>{dispositionLabel(l.disposition)}</span>}
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
