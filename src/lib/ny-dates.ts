/** Calendar stamps and boundaries in America/New_York. */

const NY_TIME_ZONE = "America/New_York";

export function nyStamp(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-CA", { timeZone: NY_TIME_ZONE });
}

function addDays(stamp: string, days: number): string {
  const [y, m, d] = stamp.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return utc.toISOString().slice(0, 10);
}

function addMonths(monthStartStamp: string, months: number): string {
  const [y, m] = monthStartStamp.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + months, 1)).toISOString().slice(0, 10);
}

function weekdayMon0(stamp: string): number {
  const [y, m, d] = stamp.split("-").map(Number);
  // UTC noon so weekday is stable.
  const wd = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay(); // 0 Sun
  return wd === 0 ? 6 : wd - 1;
}

const nyDateTimeParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: NY_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/**
 * Convert a New York calendar date at 12:00 AM to its real UTC instant.
 * The short iteration handles EST/EDT correctly, including DST transition days.
 */
export function nyStartOfDay(stamp: string): Date {
  const [year, month, day] = stamp.split("-").map(Number);
  const targetLocalAsUtc = Date.UTC(year, month - 1, day, 0, 0, 0);
  let instant = targetLocalAsUtc;

  for (let i = 0; i < 4; i++) {
    const values: Record<string, number> = {};
    for (const part of nyDateTimeParts.formatToParts(new Date(instant))) {
      if (part.type !== "literal") values[part.type] = Number(part.value);
    }
    const representedLocalAsUtc = Date.UTC(
      values.year,
      values.month - 1,
      values.day,
      values.hour,
      values.minute,
      values.second,
    );
    const correction = targetLocalAsUtc - representedLocalAsUtc;
    if (correction === 0) break;
    instant += correction;
  }

  return new Date(instant);
}

/** Exact start and exclusive end of the current New York calendar month. */
export function nyMonthBounds(now = new Date()) {
  const today = nyStamp(now)!;
  const startStamp = `${today.slice(0, 7)}-01`;
  const endStamp = addMonths(startStamp, 1);
  return {
    startStamp,
    endStamp,
    start: nyStartOfDay(startStamp),
    end: nyStartOfDay(endStamp),
  };
}

/** Exact start and exclusive end of the current New York calendar year. */
export function nyYearBounds(now = new Date()) {
  const today = nyStamp(now)!;
  const year = Number(today.slice(0, 4));
  const startStamp = `${year}-01-01`;
  const endStamp = `${year + 1}-01-01`;
  return {
    startStamp,
    endStamp,
    start: nyStartOfDay(startStamp),
    end: nyStartOfDay(endStamp),
  };
}

export function nyMonthLabel(now = new Date()): string {
  return now.toLocaleDateString("en-US", {
    timeZone: NY_TIME_ZONE,
    month: "long",
    year: "numeric",
  });
}

export function nyPeriodStarts(now = new Date()) {
  const today = nyStamp(now)!;
  const weekStart = addDays(today, -weekdayMon0(today));
  const monthStart = `${today.slice(0, 7)}-01`;
  const yearStart = `${today.slice(0, 4)}-01-01`;
  return { today, weekStart, monthStart, yearStart };
}

/** True when a timestamp falls inside [fromStamp, toStamp) in New York. */
export function inPeriod(
  value: Date | string | null | undefined,
  fromStamp: string,
  toStamp: string,
): boolean {
  const stamp = nyStamp(value);
  return Boolean(stamp && stamp >= fromStamp && stamp < toStamp);
}

/** True when a timestamp is on or after a New York calendar date. */
export function inRange(value: Date | string | null | undefined, fromStamp: string) {
  const stamp = nyStamp(value);
  return Boolean(stamp && stamp >= fromStamp);
}

export function weekStamps(count: number, now = new Date()): { start: string; label: string }[] {
  const { weekStart } = nyPeriodStarts(now);
  const out: { start: string; label: string }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const start = addDays(weekStart, -7 * i);
    const [, m, d] = start.split("-").map(Number);
    out.push({
      start,
      label: `${m}/${d}`,
    });
  }
  return out;
}
