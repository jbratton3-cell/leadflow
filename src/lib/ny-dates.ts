/** Calendar stamps in America/New_York (YYYY-MM-DD). */

export function nyStamp(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

function addDays(stamp: string, days: number): string {
  const [y, m, d] = stamp.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return utc.toISOString().slice(0, 10);
}

function weekdayMon0(stamp: string): number {
  const [y, m, d] = stamp.split("-").map(Number);
  // UTC noon so weekday is stable
  const wd = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay(); // 0 Sun
  return wd === 0 ? 6 : wd - 1;
}

export function nyPeriodStarts(now = new Date()) {
  const today = nyStamp(now)!;
  const weekStart = addDays(today, -weekdayMon0(today));
  const monthStart = `${today.slice(0, 7)}-01`;
  const yearStart = `${today.slice(0, 4)}-01-01`;
  return { today, weekStart, monthStart, yearStart };
}

export function inRange(soldAt: Date | string | null | undefined, fromStamp: string) {
  const s = nyStamp(soldAt);
  return Boolean(s && s >= fromStamp);
}

export function weekStamps(count: number, now = new Date()): { start: string; label: string }[] {
  const { weekStart } = nyPeriodStarts(now);
  const out: { start: string; label: string }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const start = addDays(weekStart, -7 * i);
    const [y, m, d] = start.split("-").map(Number);
    out.push({
      start,
      label: `${m}/${d}`,
    });
  }
  return out;
}
