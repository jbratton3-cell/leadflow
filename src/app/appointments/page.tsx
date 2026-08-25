import { db } from "@/db";
import { appointments, leads } from "@/db/schema";
import { desc, eq, and, type SQL } from "drizzle-orm";
import Link from "next/link";
import { PageHeader, Card, Badge, EmptyState, StatCard } from "@/components/ui";
import { getReps, toMap } from "@/lib/queries";
import { requireAccess } from "@/lib/auth";
import { updateAppointmentStatus } from "@/lib/actions";
import {
  APPT_STATUSES,
  APPT_RESULTS,
  apptStatusLabel,
  apptStatusColor,
  fmtDateTime,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { orgId } = await requireAccess("appointments");
  const { status } = await searchParams;

  const conds: SQL[] = [eq(appointments.orgId, orgId)];
  if (status) conds.push(eq(appointments.status, status));

  const rows = await db
    .select({
      appt: appointments,
      firstName: leads.firstName,
      lastName: leads.lastName,
      city: leads.city,
      phone: leads.phone,
    })
    .from(appointments)
    .leftJoin(leads, eq(appointments.leadId, leads.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(appointments.scheduledAt))
    .limit(200);

  const allReps = await getReps();
  const repMap = toMap(allReps);

  const now = new Date();
  const upcoming = rows.filter(
    (r) =>
      ["set", "confirmed"].includes(r.appt.status) &&
      new Date(r.appt.scheduledAt) >= now
  );
  const statusCounts = APPT_STATUSES.map((s) => ({
    ...s,
    count: rows.filter((r) => r.appt.status === s.key).length,
  }));

  return (
    <div>
      <PageHeader
        title="Appointments"
        subtitle="Manage the sales calendar — confirm, run, and record results."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Upcoming" value={upcoming.length} accent="text-blue-600" />
        <StatCard
          label="Confirmed"
          value={statusCounts.find((s) => s.key === "confirmed")?.count ?? 0}
          accent="text-indigo-600"
        />
        <StatCard
          label="Sat"
          value={statusCounts.find((s) => s.key === "sat")?.count ?? 0}
          accent="text-violet-600"
        />
        <StatCard
          label="No Shows"
          value={statusCounts.find((s) => s.key === "no_show")?.count ?? 0}
          accent="text-rose-600"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <Link
          href="/appointments"
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            !status ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All
        </Link>
        {APPT_STATUSES.map((s) => (
          <Link
            key={s.key}
            href={`/appointments?status=${s.key}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              status === s.key
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState message="No appointments yet. Set one from a prospect or the call center." />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r.appt.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/leads/${r.appt.leadId}`}
                      className="font-semibold text-slate-800 hover:text-orange-600"
                    >
                      {r.firstName} {r.lastName}
                    </Link>
                    <Badge className={apptStatusColor(r.appt.status)}>
                      {apptStatusLabel(r.appt.status)}
                    </Badge>
                  </div>
                  <div className="mt-0.5 text-sm text-slate-500">
                    {fmtDateTime(r.appt.scheduledAt)} · {r.city ?? "—"} · {r.phone ?? "—"}
                    {r.appt.salesRepId && (
                      <span className="ml-1">
                        · Rep: {repMap.get(r.appt.salesRepId)?.name ?? "—"}
                      </span>
                    )}
                  </div>
                  {r.appt.result && (
                    <div className="text-xs text-slate-400">Result: {r.appt.result}</div>
                  )}
                </div>

                {["set", "confirmed"].includes(r.appt.status) && (
                  <form action={updateAppointmentStatus} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={r.appt.id} />
                    <input type="hidden" name="leadId" value={r.appt.leadId} />
                    <select
                      name="status"
                      defaultValue={r.appt.status}
                      className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="sat">Sat</option>
                      <option value="no_show">No Show</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="rescheduled">Rescheduled</option>
                    </select>
                    <select
                      name="result"
                      defaultValue=""
                      className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                    >
                      <option value="">Result…</option>
                      {APPT_RESULTS.map((res) => (
                        <option key={res.key} value={res.key}>
                          {res.label}
                        </option>
                      ))}
                    </select>
                    <button className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700">
                      Update
                    </button>
                  </form>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
