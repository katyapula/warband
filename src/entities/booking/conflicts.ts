// Bookings in conflict with the club's schedule (docs/DOMAIN.md → "Club day
// changes"): outside a day's new hours, or on a day that isn't active. Pure.
import { dateInZone, toMinutes } from "@/shared/lib/time";
import { minutesOnDate } from "./gaps";
import { isBlocking, isOnInactiveDay, type DayState, type TimedBooking } from "./status";

/** Blocking bookings on `date` that start before `openTime` or end after `closeTime`. */
export function outsideHours<T extends TimedBooking>(
  bookings: T[],
  date: string,
  hours: { openTime: string; closeTime: string },
  now: Date,
  timeZone: string,
): T[] {
  const open = toMinutes(hours.openTime)!;
  const close = toMinutes(hours.closeTime)!;
  return bookings
    .filter((b) => isBlocking(b, now))
    .filter((b) => minutesOnDate(b.startsAt, date, timeZone) < open || minutesOnDate(b.endsAt, date, timeZone) > close)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

/** Dates (sorted) that have a blocking booking but no active ClubDay: ⚠ in the strip. */
export function inactiveDatesWithBookings(
  bookings: TimedBooking[],
  days: Map<string, DayState>,
  now: Date,
  timeZone: string,
): Set<string> {
  const dates = bookings
    .map((b) => ({ b, date: dateInZone(timeZone, b.startsAt) }))
    .filter(({ b, date }) => isOnInactiveDay(b, days.get(date) ?? null, now))
    .map(({ date }) => date)
    .sort();
  return new Set(dates);
}
