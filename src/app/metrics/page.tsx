import { PageHeader, Card, KpiTile } from "@/components/ui";
import { requireAccess } from "@/lib/auth";
import { money, jobStatusLabel } from "@/lib/constants";
import {
  LineChart,
  BarChart,
  HorizontalBarChart,
  DonutChart,
  FunnelChart,
} from "@/components/charts";
import {
  getKpis,
  getSpeedToContact,
  getMonthlyTrend,
  getFunnel,
  getSalesRepMetrics,
  getCallRepMetrics,
  getSourceMetrics,
  getProductionMetrics,
  getEstimateMetrics,
  pctChange,
} from "@/lib/metrics";

export const dynamic = "force-dynamic";

const pct = (v: number) => `${v.toFixed(1)}%`;
const days = (v: number) => (v ? `${v.toFixed(1)}d` : "—");
const hrs = (v: number | null) => (v === null ? "—" : v < 48 ? `${v.toFixed(1)}h` : `${(v / 24).toFixed(1)}d`);

export default async function MetricsPage() {
  const { orgId } = await requireAccess("reports");

  const [
    { current, previous },
    speed,
    trend,
    funnel,
    salesReps,
    callReps,
    sources,
    prod,
    est,
  ] = await Promise.all([
    getKpis(orgId),
    getSpeedToContact(orgId),
    getMonthlyTrend(orgId),
    getFunnel(orgId),
    getSalesRepMetrics(orgId),
    getCallRepMetrics(orgId),
    getSourceMetrics(orgId),
    getProductionMetrics(orgId),
    getEstimateMetrics(orgId),
  ]);

  // Chart-ready datasets
  const leadTrend = trend.leads.map((t) => ({ label: t.label, value: t.value }));
  const revenueTrend = trend.sales.map((t) => ({ label: t.label, value: t.revenue }));
  const repRevenue = salesReps.map((r) => ({ label: r.name, value: r.revenue }));
  const sourceConv = sources.map((s) => ({ label: s.name, value: s.sold }));

  const JOB_COLORS: Record<string, string> = {
    pending: "#94a3b8",
    measure: "#f59e0b",
    permits: "#eab308",
    materials_ordered: "#3b82f6",
    materials_delivered: "#14b8a6",
    scheduled: "#6366f1",
    in_progress: "#06b6d4",
    completed: "#22c55e",
    on_hold: "#f43f5e",
  };
  const jobSlices = prod.byStatus.map((s) => ({
    label: jobStatusLabel(s.status),
    value: s.count,
    color: JOB_COLORS[s.status] ?? "#94a3b8",
  }));
  const totalJobs = prod.byStatus.reduce((a, b) => a + b.count, 0);

  const estimateSlices = [
    { label: "Accepted", value: est.accepted, color: "#22c55e" },
    { label: "Declined", value: est.declined, color: "#f43f5e" },
    {
      label: "Outstanding",
      value: Math.max(est.sent - est.accepted - est.declined, 0),
      color: "#3b82f6",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Metrics"
        subtitle="Your KPI command center — ratios, per-rep performance, and month-over-month trends."
      />

      {/* ---- Company KPIs (month-over-month) ---- */}
      <h2 className="mb-3 text-sm font-semibold text-slate-700">
        Company KPIs · This Month vs Last Month
      </h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiTile
          label="New Leads"
          value={current.leads}
          delta={pctChange(current.leads, previous.leads)}
          deltaLabel="vs last month"
        />
        <KpiTile
          label="Set Rate"
          value={pct(current.setRate)}
          delta={pctChange(current.setRate, previous.setRate)}
          deltaLabel="appts ÷ leads"
        />
        <KpiTile
          label="Sit Rate"
          value={pct(current.sitRate)}
          delta={pctChange(current.sitRate, previous.sitRate)}
          deltaLabel="sat ÷ appts"
        />
        <KpiTile
          label="Close Rate"
          value={pct(current.closeRate)}
          delta={pctChange(current.closeRate, previous.closeRate)}
          deltaLabel="sales ÷ sits"
        />
        <KpiTile
          label="Net Sales"
          value={current.salesCount}
          delta={pctChange(current.salesCount, previous.salesCount)}
          deltaLabel="vs last month"
        />
        <KpiTile
          label="Revenue"
          value={money(current.revenue)}
          delta={pctChange(current.revenue, previous.revenue)}
          deltaLabel="vs last month"
        />
        <KpiTile
          label="Avg Ticket"
          value={money(current.avgTicket)}
          delta={pctChange(current.avgTicket, previous.avgTicket)}
          deltaLabel="revenue ÷ sales"
        />
        <KpiTile
          label="Revenue / Lead"
          value={money(current.revPerLead)}
          delta={pctChange(current.revPerLead, previous.revPerLead)}
          deltaLabel="revenue ÷ leads"
        />
        <KpiTile
          label="Cancellation Rate"
          value={pct(current.cancelRate)}
          delta={pctChange(current.cancelRate, previous.cancelRate)}
          deltaLabel="no-shows ÷ appts"
          goodWhenUp={false}
        />
        <KpiTile
          label="Speed to Contact"
          value={hrs(speed)}
          hint="avg lead → 1st call"
        />
      </div>

      {/* ---- Trends & Funnel ---- */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Leads — 6-Month Trend</h2>
          <LineChart data={leadTrend} color="#6366f1" />
        </Card>
        <Card className="p-5">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Revenue — 6-Month Trend</h2>
          <BarChart data={revenueTrend} color="#10b981" format="money" />
        </Card>
      </div>

      {/* ---- Conversion funnel ---- */}
      <div className="mt-6">
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">
            Conversion Funnel (All-Time)
          </h2>
          <FunnelChart data={funnel} />
        </Card>
      </div>

      {/* ---- Rep revenue chart ---- */}
      <div className="mt-6">
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Revenue by Sales Rep</h2>
          <HorizontalBarChart data={repRevenue} color="#f97316" format="money" />
        </Card>
      </div>

      {/* ---- Per-rep: Sales ---- */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Sales Rep Performance</h2>
          {salesReps.length === 0 ? (
            <p className="text-sm text-slate-400">No sales rep activity yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-2 font-medium">Rep</th>
                    <th className="py-2 px-2 text-right font-medium">Appts</th>
                    <th className="py-2 px-2 text-right font-medium">Sat</th>
                    <th className="py-2 px-2 text-right font-medium">Sit%</th>
                    <th className="py-2 px-2 text-right font-medium">Sold</th>
                    <th className="py-2 px-2 text-right font-medium">Close%</th>
                    <th className="py-2 pl-2 text-right font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesReps.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 pr-2 font-medium text-slate-700">{r.name}</td>
                      <td className="py-2 px-2 text-right text-slate-600">{r.appts}</td>
                      <td className="py-2 px-2 text-right text-slate-600">{r.sits}</td>
                      <td className="py-2 px-2 text-right text-slate-600">{pct(r.sitRate)}</td>
                      <td className="py-2 px-2 text-right text-slate-600">{r.sold}</td>
                      <td className="py-2 px-2 text-right text-slate-600">{pct(r.closeRate)}</td>
                      <td className="py-2 pl-2 text-right font-semibold text-emerald-600">
                        {money(r.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ---- Per-rep: Call Center ---- */}
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Call Center Performance</h2>
          {callReps.length === 0 ? (
            <p className="text-sm text-slate-400">No call activity yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-2 font-medium">Rep</th>
                    <th className="py-2 px-2 text-right font-medium">Calls</th>
                    <th className="py-2 px-2 text-right font-medium">Contacts</th>
                    <th className="py-2 px-2 text-right font-medium">Contact%</th>
                    <th className="py-2 pl-2 text-right font-medium">Appts Set</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {callReps.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 pr-2 font-medium text-slate-700">{r.name}</td>
                      <td className="py-2 px-2 text-right text-slate-600">{r.calls}</td>
                      <td className="py-2 px-2 text-right text-slate-600">{r.contacts}</td>
                      <td className="py-2 px-2 text-right text-slate-600">{pct(r.contactRate)}</td>
                      <td className="py-2 pl-2 text-right font-semibold text-blue-600">{r.appts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* ---- Lead source performance ---- */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Sales by Source</h2>
          <HorizontalBarChart data={sourceConv} color="#8b5cf6" />
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Lead Source Performance</h2>
          {sources.length === 0 ? (
            <p className="text-sm text-slate-400">No source data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-2 font-medium">Source</th>
                    <th className="py-2 px-2 font-medium">Volume</th>
                    <th className="py-2 px-2 text-right font-medium">Leads</th>
                    <th className="py-2 px-2 text-right font-medium">Sold</th>
                    <th className="py-2 px-2 text-right font-medium">Conv%</th>
                    <th className="py-2 px-2 text-right font-medium">Speed to Contact</th>
                    <th className="py-2 pl-2 text-right font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sources.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2 pr-2">
                        <div className="font-medium text-slate-700">{s.name}</div>
                        <div className="text-xs capitalize text-slate-400">
                          {s.category.replace("_", " ")}
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-orange-400"
                            style={{
                              width: `${Math.min((s.leads / Math.max(...sources.map((x) => x.leads), 1)) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </td>
                      <td className="py-2 px-2 text-right text-slate-600">{s.leads}</td>
                      <td className="py-2 px-2 text-right text-slate-600">{s.sold}</td>
                      <td className="py-2 px-2 text-right text-slate-600">{pct(s.convRate)}</td>
                      <td className="py-2 px-2 text-right text-slate-600">{hrs(s.contactHrs)}</td>
                      <td className="py-2 pl-2 text-right font-semibold text-emerald-600">
                        {money(s.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* ---- Production + Estimates ---- */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Production Metrics</h2>
          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="Sale → Start" value={days(prod.saleToStart)} />
            <MiniStat label="Start → Done" value={days(prod.startToDone)} />
            <MiniStat label="Full Cycle" value={days(prod.saleToDone)} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniStat label="Backlog Value" value={money(prod.backlogValue)} accent="text-orange-600" />
            <MiniStat label="Backlog Avg Age" value={days(prod.backlogAvgAge)} />
          </div>
          <h3 className="mt-5 mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Jobs by Status
          </h3>
          <DonutChart
            data={jobSlices}
            centerValue={`${totalJobs}`}
            centerLabel="jobs"
          />
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Estimate Metrics</h2>
          <div className="mb-5">
            <DonutChart
              data={estimateSlices}
              centerValue={pct(est.acceptRate)}
              centerLabel="accept rate"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Sent" value={est.sent} accent="text-blue-600" />
            <MiniStat label="Avg Value" value={money(est.avgValue)} />
            <MiniStat label="View Rate" value={pct(est.viewRate)} accent="text-indigo-600" />
            <MiniStat label="Time to Respond" value={hrs(est.respHrs)} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  accent = "text-slate-900",
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className={`mt-1 text-lg font-bold ${accent}`}>{value}</div>
    </div>
  );
}
