// Which club dates the day view can show and which ones admins can change.
// Pure: dates are club-local "YYYY-MM-DD" strings; the caller passes `today`.
import { addDays, isIsoDate } from "@/shared/lib/time";

/** Dates the day strip can show. `first` is null for admins: past days are open to them. */
export type DayRange = { first: string | null; last: string };

export function viewableRange(p: { today: string; windowDays: number; isAdmin: boolean }): DayRange {
  return { first: p.isAdmin ? null : p.today, last: addDays(p.today, p.windowDays) };
}

const inRange = (date: string, r: DayRange) => (r.first === null || date >= r.first) && date <= r.last;

/** Monday to Sunday of the week holding `date`. */
export function weekOf(date: string): string[] {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  const monday = addDays(date, -((weekday + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/**
 * The day shown without `?date=`: today for admins; otherwise the first
 * active day from today (`activeDates` sorted, within the window), or today.
 */
export function landingDate(p: { today: string; isAdmin: boolean; activeDates: string[] }): string {
  if (p.isAdmin) return p.today;
  return p.activeDates[0] ?? p.today;
}

/** The `?date=` search param → the day to show, or not ok (malformed / out of range). */
export function resolveDayParam(
  param: string | string[] | undefined,
  range: DayRange,
  landing: string,
): { ok: true; date: string } | { ok: false } {
  if (param === undefined) return { ok: true, date: landing };
  if (typeof param !== "string" || !isIsoDate(param) || !inRange(param, range)) return { ok: false };
  return { ok: true, date: param };
}

/** Targets of the ‹ › arrows: a week back / forward, clamped; null at the edge of the range. */
export function stripNav(selected: string, range: DayRange): { prev: string | null; next: string | null } {
  const week = weekOf(selected);
  const prev =
    range.first !== null && week[0]! <= range.first
      ? null
      : maxDate(addDays(selected, -7), range.first);
  const next = week[6]! >= range.last ? null : minDate(addDays(selected, 7), range.last);
  return { prev, next };
}

const maxDate = (a: string, b: string | null) => (b !== null && b > a ? b : a);
const minDate = (a: string, b: string) => (b < a ? b : a);

/** Admins may activate, deactivate or change the hours of today … today + window. */
export function canChangeDay(date: string, today: string, windowDays: number): boolean {
  return isIsoDate(date) && date >= today && date <= addDays(today, windowDays);
}
