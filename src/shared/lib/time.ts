// Club-time helpers. Dates are "YYYY-MM-DD" calendar dates in the club time
// zone; times are "HH:mm" (or "24:00" for the end of the day). Everything
// stored is UTC. Use the IANA zone name (Europe/Kyiv), never a fixed offset.

/** Calendar date ("YYYY-MM-DD") of `now` in the given IANA time zone. */
export function dateInZone(timeZone: string, now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$|^24:00$/;

/** "HH:mm" → minutes since midnight; null if malformed. "24:00" → 1440. */
export function toMinutes(time: string): number | null {
  if (!TIME.test(time)) return null;
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
}

/** Minutes since midnight → "HH:mm" (1440 → "24:00"). */
export function fromMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** True for a real calendar date written "YYYY-MM-DD". */
export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value);
}

/** "YYYY-MM-DD" + n days (n may be negative). */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Minutes the zone is ahead of UTC at `instant` (Kyiv: 120 or 180). */
function offsetMinutes(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant));
  const n = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(n("year"), n("month") - 1, n("day"), n("hour"), n("minute"), n("second"));
  return Math.round((asUtc - instant) / 60_000);
}

/**
 * The UTC instant of a club-local date and time. "24:00" is the next local
 * midnight. Uses the offset in force at that moment, so DST days work.
 */
export function localTimeToUtc(date: string, time: string, timeZone: string): Date {
  if (time === "24:00") return localTimeToUtc(addDays(date, 1), "00:00", timeZone);
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const [h, min] = time.split(":").map(Number) as [number, number];
  const naive = Date.UTC(y, m - 1, d, h, min);
  // Two passes: the first guess may sit on the other side of a DST change.
  const first = naive - offsetMinutes(naive, timeZone) * 60_000;
  return new Date(naive - offsetMinutes(first, timeZone) * 60_000);
}

/** [local 00:00, next local 00:00) of a club date, in UTC. 23 or 25 hours on DST days. */
export function utcRangeOfDate(date: string, timeZone: string): { start: Date; end: Date } {
  return {
    start: localTimeToUtc(date, "00:00", timeZone),
    end: localTimeToUtc(date, "24:00", timeZone),
  };
}
