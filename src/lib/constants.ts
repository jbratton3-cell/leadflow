// Central definitions for the CRM pipeline, dispositions, and labels.

// Business / branding
export const APP_NAME = "LeadFlow";
export const BUSINESS_NAME = "JMB Business Solutions";

// Copyright line, e.g. "© 2026 JMB Business Solutions. All rights reserved."
export function copyright(): string {
  return `© ${new Date().getFullYear()} ${BUSINESS_NAME}. All rights reserved.`;
}

export const STAGES = [
  { key: "new", label: "New Lead", color: "bg-slate-100 text-slate-700" },
  { key: "contacting", label: "Contacting", color: "bg-amber-100 text-amber-800" },
  { key: "appt_set", label: "Appointment Set", color: "bg-blue-100 text-blue-800" },
  { key: "confirmed", label: "Confirmed", color: "bg-indigo-100 text-indigo-800" },
  { key: "sat", label: "Demo Sat", color: "bg-violet-100 text-violet-800" },
  { key: "sold", label: "Sold", color: "bg-emerald-100 text-emerald-800" },
  { key: "production", label: "In Production", color: "bg-cyan-100 text-cyan-800" },
  { key: "completed", label: "Completed", color: "bg-green-100 text-green-800" },
  { key: "dead", label: "Dead / Lost", color: "bg-rose-100 text-rose-700" },
] as const;

export type StageKey = (typeof STAGES)[number]["key"];

export const stageLabel = (key: string) =>
  STAGES.find((s) => s.key === key)?.label ?? key;

export const stageColor = (key: string) =>
  STAGES.find((s) => s.key === key)?.color ?? "bg-slate-100 text-slate-700";

export const DISPOSITIONS = [
  { key: "no_answer", label: "No Answer" },
  { key: "left_message", label: "Left Message" },
  { key: "busy", label: "Busy" },
  { key: "contacted", label: "Contacted" },
  { key: "callback", label: "Callback Scheduled" },
  { key: "appt_set", label: "Appointment Set" },
  { key: "not_interested", label: "Not Interested" },
  { key: "wrong_number", label: "Wrong Number" },
  { key: "do_not_call", label: "Do Not Call" },
] as const;

export const dispositionLabel = (key?: string | null) =>
  DISPOSITIONS.find((d) => d.key === key)?.label ?? (key ?? "—");

export const APPT_STATUSES = [
  { key: "set", label: "Set", color: "bg-blue-100 text-blue-800" },
  { key: "confirmed", label: "Confirmed", color: "bg-indigo-100 text-indigo-800" },
  { key: "sat", label: "Sat", color: "bg-violet-100 text-violet-800" },
  { key: "no_show", label: "No Show", color: "bg-rose-100 text-rose-700" },
  { key: "cancelled", label: "Cancelled", color: "bg-slate-200 text-slate-600" },
  { key: "rescheduled", label: "Rescheduled", color: "bg-amber-100 text-amber-800" },
] as const;

export const apptStatusLabel = (key: string) =>
  APPT_STATUSES.find((s) => s.key === key)?.label ?? key;
export const apptStatusColor = (key: string) =>
  APPT_STATUSES.find((s) => s.key === key)?.color ?? "bg-slate-100 text-slate-700";

export const APPT_RESULTS = [
  { key: "sold", label: "Sold" },
  { key: "not_sold", label: "Not Sold" },
  { key: "one_leg", label: "One Leg (Callback)" },
  { key: "no_demo", label: "No Demo" },
] as const;

export const JOB_STATUSES = [
  { key: "pending", label: "Pending", color: "bg-slate-100 text-slate-700" },
  { key: "measure", label: "Measure", color: "bg-amber-100 text-amber-800" },
  { key: "permits", label: "Permits", color: "bg-yellow-100 text-yellow-800" },
  { key: "materials_ordered", label: "Materials Ordered", color: "bg-blue-100 text-blue-800" },
  { key: "materials_delivered", label: "Materials Delivered", color: "bg-teal-100 text-teal-800" },
  { key: "scheduled", label: "Scheduled", color: "bg-indigo-100 text-indigo-800" },
  { key: "in_progress", label: "In Progress", color: "bg-cyan-100 text-cyan-800" },
  { key: "completed", label: "Completed", color: "bg-green-100 text-green-800" },
  { key: "on_hold", label: "On Hold", color: "bg-rose-100 text-rose-700" },
] as const;

export const jobStatusLabel = (key: string) =>
  JOB_STATUSES.find((s) => s.key === key)?.label ?? key;
export const jobStatusColor = (key: string) =>
  JOB_STATUSES.find((s) => s.key === key)?.color ?? "bg-slate-100 text-slate-700";

export const JOB_MILESTONES = [
  { key: "measured", label: "Final Measure" },
  { key: "permits_pulled", label: "Permits Pulled" },
  { key: "materials_ordered", label: "Materials Ordered" },
  { key: "materials_received", label: "Materials Delivered" },
  { key: "crew_assigned", label: "Crew Assigned" },
  { key: "installed", label: "Installed" },
  { key: "inspected", label: "Inspected" },
  { key: "paid", label: "Final Payment" },
] as const;

export const SOURCE_CATEGORIES = [
  { key: "internet", label: "Internet / Web" },
  { key: "direct_mail", label: "Direct Mail" },
  { key: "tv", label: "TV" },
  { key: "radio", label: "Radio" },
  { key: "referral", label: "Referral" },
  { key: "home_show", label: "Home Show" },
  { key: "canvassing", label: "Canvassing" },
  { key: "repeat", label: "Repeat Customer" },
] as const;

export const REP_ROLES = [
  { key: "call_center", label: "Call Center" },
  { key: "sales", label: "Sales Rep" },
  { key: "production", label: "Production" },
  { key: "admin", label: "Admin" },
] as const;

export const roleLabel = (key: string) =>
  REP_ROLES.find((r) => r.key === key)?.label ?? key;

// Reasons a dead/stalled lead can be re-worked in the rehash queue.
export const DEAD_REASONS = [
  { key: "not_interested", label: "Not Interested", rehash: true },
  { key: "no_show", label: "No Show", rehash: true },
  { key: "cancelled", label: "Cancelled Appt", rehash: true },
  { key: "one_leg", label: "One-Leg (Unsold)", rehash: true },
  { key: "not_sold", label: "Demo Not Sold", rehash: true },
  { key: "wrong_number", label: "Wrong Number", rehash: false },
  { key: "bad_lead", label: "Bad Lead", rehash: false },
  { key: "dnc", label: "Do Not Call", rehash: false },
] as const;

export const deadReasonLabel = (key?: string | null) =>
  DEAD_REASONS.find((d) => d.key === key)?.label ?? (key ?? "—");

// Dead reasons eligible for rehashing (re-marketing to old leads).
export const REHASHABLE_REASONS = DEAD_REASONS.filter((d) => d.rehash).map(
  (d) => d.key
) as string[];

export const FINANCE_TYPES = [
  { key: "cash", label: "Cash" },
  { key: "financed", label: "Financed" },
  { key: "check", label: "Check" },
] as const;

export const ESTIMATE_STATUSES = [
  { key: "draft", label: "Draft", color: "bg-slate-100 text-slate-700" },
  { key: "sent", label: "Sent", color: "bg-blue-100 text-blue-800" },
  { key: "viewed", label: "Viewed", color: "bg-indigo-100 text-indigo-800" },
  { key: "accepted", label: "Accepted", color: "bg-emerald-100 text-emerald-800" },
  { key: "declined", label: "Declined", color: "bg-rose-100 text-rose-700" },
] as const;

export const estimateStatusLabel = (key: string) =>
  ESTIMATE_STATUSES.find((s) => s.key === key)?.label ?? key;
export const estimateStatusColor = (key: string) =>
  ESTIMATE_STATUSES.find((s) => s.key === key)?.color ?? "bg-slate-100 text-slate-700";

export function money(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? parseFloat(value) : value ?? 0;
  return (n || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

/** Cash contract: explicit dollar amount from the rep, else list minus %. Never above list. */
export function cashPrice(
  listTotal: number | string,
  percent: number | string | null | undefined,
  explicit?: number | string | null
): number {
  const list = +(typeof listTotal === "string" ? parseFloat(listTotal) : listTotal || 0).toFixed(2);
  const listed = typeof explicit === "string" ? parseFloat(explicit) : explicit ?? 0;
  if (listed && listed > 0) return +Math.min(listed, list).toFixed(2);
  const p = typeof percent === "string" ? parseFloat(percent) : percent ?? 0;
  if (!list || !p || p <= 0) return list;
  return +(list * (1 - p / 100)).toFixed(2);
}

export function cashSavings(
  listTotal: number | string,
  percent: number | string | null | undefined,
  explicit?: number | string | null
): number {
  const list = +(typeof listTotal === "string" ? parseFloat(listTotal) : listTotal || 0).toFixed(2);
  const cash = cashPrice(list, percent, explicit);
  return +Math.max(list - cash, 0).toFixed(2);
}

export function contractPrice(
  listTotal: number | string,
  percent: number | string | null | undefined,
  financing: boolean,
  explicitCash?: number | string | null
): number {
  const list = +(typeof listTotal === "string" ? parseFloat(listTotal) : listTotal || 0).toFixed(2);
  return financing ? list : cashPrice(list, percent, explicitCash);
}

export function hasCashOffer(
  listTotal: number | string,
  percent: number | string | null | undefined,
  explicit?: number | string | null
): boolean {
  const cash = cashPrice(listTotal, percent, explicit);
  const list = +(typeof listTotal === "string" ? parseFloat(listTotal) : listTotal || 0).toFixed(2);
  const explicitN = typeof explicit === "string" ? parseFloat(explicit) : explicit ?? 0;
  const p = typeof percent === "string" ? parseFloat(percent) : percent ?? 0;
  return (explicitN > 0 || p > 0) && cash > 0 && cash !== list;
}

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  });
}

// Pure calendar dates (start dates, completion dates, due dates): display in UTC
// so "Sept 4" never shifts to Sept 3. Only real timestamps use local time.
export function fmtDateOnly(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function fmtDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
}

// Display name for a person, tolerating missing names (address-only prospects).
export function personName(
  first: string | null | undefined,
  last: string | null | undefined,
  fallback = "(No name)"
): string {
  const full = `${first ?? ""} ${last ?? ""}`.trim();
  return full || fallback;
}
