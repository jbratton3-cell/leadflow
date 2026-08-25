import { db } from "@/db";
import { sql } from "drizzle-orm";

// Helper: run raw SQL and return typed rows.
async function rows<T = Record<string, unknown>>(query: ReturnType<typeof sql>) {
  const res = await db.execute(query);
  return (res.rows ?? []) as T[];
}

const n = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

// Percent change from previous to current.
export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export function monthBounds() {
  const now = new Date();
  const thisStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { now, thisStart, lastStart };
}

/* ------------------------------- KPIs --------------------------------- */

async function windowStats(orgId: number, startISO: string, endISO: string) {
  const [lead] = await rows<{ c: string }>(
    sql`select count(*)::int c from leads where org_id = ${orgId} and created_at >= ${startISO} and created_at < ${endISO}`
  );
  const [appt] = await rows<{ c: string }>(
    sql`select count(*)::int c from appointments where org_id = ${orgId} and created_at >= ${startISO} and created_at < ${endISO}`
  );
  const [sat] = await rows<{ c: string }>(
    sql`select count(*)::int c from appointments where org_id = ${orgId} and created_at >= ${startISO} and created_at < ${endISO} and status = 'sat'`
  );
  const [noshow] = await rows<{ c: string }>(
    sql`select count(*)::int c from appointments where org_id = ${orgId} and created_at >= ${startISO} and created_at < ${endISO} and status = 'no_show'`
  );
  const [sale] = await rows<{ c: string; total: string }>(
    sql`select count(*)::int c, coalesce(sum(amount),0) total from sales where org_id = ${orgId} and sold_at >= ${startISO} and sold_at < ${endISO}`
  );
  return {
    leads: n(lead?.c),
    appts: n(appt?.c),
    sits: n(sat?.c),
    noShows: n(noshow?.c),
    salesCount: n(sale?.c),
    revenue: n(sale?.total),
  };
}

export async function getKpis(orgId: number) {
  const { thisStart, lastStart } = monthBounds();
  const thisISO = thisStart.toISOString();
  const lastISO = lastStart.toISOString();

  const cur = await windowStats(orgId, thisISO, new Date().toISOString());
  const prev = await windowStats(orgId, lastISO, thisISO);

  const ratios = (s: typeof cur) => ({
    ...s,
    setRate: s.leads ? (s.appts / s.leads) * 100 : 0,
    sitRate: s.appts ? (s.sits / s.appts) * 100 : 0,
    closeRate: s.sits ? (s.salesCount / s.sits) * 100 : 0,
    avgTicket: s.salesCount ? s.revenue / s.salesCount : 0,
    revPerLead: s.leads ? s.revenue / s.leads : 0,
    cancelRate: s.appts ? (s.noShows / s.appts) * 100 : 0,
  });

  return { current: ratios(cur), previous: ratios(prev) };
}

// Speed to contact: avg hours between lead creation and first call.
export async function getSpeedToContact(orgId: number) {
  const [r] = await rows<{ hrs: string }>(sql`
    select avg(extract(epoch from (fc.first_call - l.created_at)) / 3600) hrs
    from leads l
    join (select lead_id, min(created_at) first_call from call_logs where org_id = ${orgId} group by lead_id) fc
      on fc.lead_id = l.id
    where l.org_id = ${orgId}
  `);
  return n(r?.hrs);
}

/* ------------------------------ funnel -------------------------------- */

export async function getFunnel(orgId: number) {
  const [leadRow] = await rows<{ c: string }>(sql`select count(*)::int c from leads where org_id = ${orgId}`);
  const [apptRow] = await rows<{ c: string }>(sql`select count(*)::int c from appointments where org_id = ${orgId}`);
  const [sitRow] = await rows<{ c: string }>(
    sql`select count(*)::int c from appointments where org_id = ${orgId} and status = 'sat'`
  );
  const [saleRow] = await rows<{ c: string }>(sql`select count(*)::int c from sales where org_id = ${orgId}`);
  return [
    { label: "Leads", value: n(leadRow?.c) },
    { label: "Appointments", value: n(apptRow?.c) },
    { label: "Demos Sat", value: n(sitRow?.c) },
    { label: "Sales", value: n(saleRow?.c) },
  ];
}

/* --------------------------- 6-month trend ---------------------------- */

export async function getMonthlyTrend(orgId: number) {
  const leads = await rows<{ m: string; c: string }>(sql`
    select to_char(date_trunc('month', created_at), 'Mon') m, count(*)::int c
    from leads where org_id = ${orgId} and created_at >= date_trunc('month', now()) - interval '5 months'
    group by date_trunc('month', created_at) order by date_trunc('month', created_at)
  `);
  const sales = await rows<{ m: string; c: string; total: string }>(sql`
    select to_char(date_trunc('month', sold_at), 'Mon') m, count(*)::int c, coalesce(sum(amount),0) total
    from sales where org_id = ${orgId} and sold_at >= date_trunc('month', now()) - interval '5 months'
    group by date_trunc('month', sold_at) order by date_trunc('month', sold_at)
  `);
  return {
    leads: leads.map((r) => ({ label: r.m, value: n(r.c) })),
    sales: sales.map((r) => ({ label: r.m, value: n(r.c), revenue: n(r.total) })),
  };
}

/* --------------------------- per-rep metrics -------------------------- */

export async function getSalesRepMetrics(orgId: number) {
  return (
    await rows<{
      id: string;
      name: string;
      appts: string;
      sits: string;
      sold: string;
      revenue: string;
    }>(sql`
      select r.id, r.name,
        count(a.id)::int appts,
        count(a.id) filter (where a.status = 'sat')::int sits,
        count(s.id)::int sold,
        coalesce(sum(s.amount),0) revenue
      from reps r
      left join appointments a on a.sales_rep_id = r.id and a.org_id = ${orgId}
      left join sales s on s.sales_rep_id = r.id and s.org_id = ${orgId}
      where r.org_id = ${orgId} and r.role in ('sales','admin')
      group by r.id, r.name
      having count(a.id) > 0 or count(s.id) > 0
      order by revenue desc
    `)
  ).map((r) => ({
    id: n(r.id),
    name: r.name,
    appts: n(r.appts),
    sits: n(r.sits),
    sold: n(r.sold),
    revenue: n(r.revenue),
    sitRate: n(r.appts) ? (n(r.sits) / n(r.appts)) * 100 : 0,
    closeRate: n(r.sits) ? (n(r.sold) / n(r.sits)) * 100 : 0,
  }));
}

export async function getCallRepMetrics(orgId: number) {
  return (
    await rows<{
      id: string;
      name: string;
      calls: string;
      contacts: string;
      appts: string;
    }>(sql`
      select r.id, r.name,
        count(c.id)::int calls,
        count(c.id) filter (where c.disposition in ('contacted','callback','appt_set'))::int contacts,
        count(distinct a.id)::int appts
      from reps r
      left join call_logs c on c.rep_id = r.id and c.org_id = ${orgId}
      left join appointments a on a.set_by_id = r.id and a.org_id = ${orgId}
      where r.org_id = ${orgId} and r.role in ('call_center','admin')
      group by r.id, r.name
      having count(c.id) > 0 or count(distinct a.id) > 0
      order by appts desc
    `)
  ).map((r) => ({
    id: n(r.id),
    name: r.name,
    calls: n(r.calls),
    contacts: n(r.contacts),
    appts: n(r.appts),
    contactRate: n(r.calls) ? (n(r.contacts) / n(r.calls)) * 100 : 0,
  }));
}

/* ------------------------- lead source metrics ------------------------ */

export async function getSourceMetrics(orgId: number) {
  return (
    await rows<{
      id: string;
      name: string;
      category: string;
      leads: string;
      sold: string;
      revenue: string;
      contact_hrs: string;
    }>(sql`
      select ls.id, ls.name, ls.category,
        count(distinct l.id)::int leads,
        count(distinct s.id)::int sold,
        coalesce(sum(s.amount),0) revenue,
        avg(extract(epoch from (fc.first_call - l.created_at)) / 3600) contact_hrs
      from lead_sources ls
      left join leads l on l.source_id = ls.id and l.org_id = ${orgId}
      left join sales s on s.lead_id = l.id and s.org_id = ${orgId}
      left join (select lead_id, min(created_at) first_call from call_logs where org_id = ${orgId} group by lead_id) fc
        on fc.lead_id = l.id
      where ls.org_id = ${orgId}
      group by ls.id, ls.name, ls.category
      having count(distinct l.id) > 0
      order by leads desc
    `)
  ).map((r) => ({
    id: n(r.id),
    name: r.name,
    category: r.category,
    leads: n(r.leads),
    sold: n(r.sold),
    revenue: n(r.revenue),
    convRate: n(r.leads) ? (n(r.sold) / n(r.leads)) * 100 : 0,
    contactHrs: r.contact_hrs ? n(r.contact_hrs) : null,
  }));
}

/* ------------------------- production metrics ------------------------- */

export async function getProductionMetrics(orgId: number) {
  const statusRows = await rows<{ status: string; c: string }>(sql`
    select status, count(*)::int c from jobs where org_id = ${orgId} group by status
  `);
  const [timing] = await rows<{
    sale_to_start: string;
    start_to_done: string;
    sale_to_done: string;
  }>(sql`
    select
      avg(extract(epoch from (j.start_date - s.sold_at)) / 86400) sale_to_start,
      avg(extract(epoch from (j.completion_date - j.start_date)) / 86400) start_to_done,
      avg(extract(epoch from (j.completion_date - s.sold_at)) / 86400) sale_to_done
    from jobs j join sales s on s.id = j.sale_id
    where j.org_id = ${orgId}
  `);
  const [backlog] = await rows<{ jobs: string; value: string; avg_age: string }>(sql`
    select count(*)::int jobs, coalesce(sum(s.amount),0) value,
      avg(extract(epoch from (now() - j.created_at)) / 86400) avg_age
    from jobs j join sales s on s.id = j.sale_id
    where j.org_id = ${orgId} and j.status not in ('completed')
  `);

  return {
    byStatus: statusRows.map((r) => ({ status: r.status, count: n(r.c) })),
    saleToStart: n(timing?.sale_to_start),
    startToDone: n(timing?.start_to_done),
    saleToDone: n(timing?.sale_to_done),
    backlogJobs: n(backlog?.jobs),
    backlogValue: n(backlog?.value),
    backlogAvgAge: n(backlog?.avg_age),
  };
}

/* -------------------------- estimate metrics -------------------------- */

export async function getEstimateMetrics(orgId: number) {
  const [r] = await rows<{
    total: string;
    sent: string;
    viewed: string;
    accepted: string;
    declined: string;
    avg_value: string;
    resp_hrs: string;
  }>(sql`
    select
      count(*)::int total,
      count(*) filter (where sent_at is not null)::int sent,
      count(*) filter (where viewed_at is not null)::int viewed,
      count(*) filter (where status = 'accepted')::int accepted,
      count(*) filter (where status = 'declined')::int declined,
      coalesce(avg(total),0) avg_value,
      avg(extract(epoch from (responded_at - sent_at)) / 3600) resp_hrs
    from estimates
    where org_id = ${orgId}
  `);
  const sent = n(r?.sent);
  const accepted = n(r?.accepted);
  const declined = n(r?.declined);
  return {
    total: n(r?.total),
    sent,
    viewed: n(r?.viewed),
    accepted,
    declined,
    avgValue: n(r?.avg_value),
    respHrs: r?.resp_hrs ? n(r.resp_hrs) : null,
    viewRate: sent ? (n(r?.viewed) / sent) * 100 : 0,
    acceptRate: accepted + declined ? (accepted / (accepted + declined)) * 100 : 0,
  };
}
