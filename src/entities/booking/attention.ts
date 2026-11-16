// Needs attention and pending counts for admins (docs/DOMAIN.md → "Derived
// statuses and flags"). Pure: the caller loads bookings from today onward
// and the ClubDays of their dates.
import { dateInZone } from "@/shared/lib/time";
import { needsAttention, type DayState, type TimedBooking } from "./status";

/** How many bookings need attention, and the first date that has one. */
export function attentionSummary(
  bookings: TimedBooking[],
  days: Map<string, DayState>,
  now: Date,
  timeZone: string,
): { count: number; nextDate: string | null } {
  let count = 0;
  let nextDate: string | null = null;
  for (const b of bookings) {
    const date = dateInZone(timeZone, b.startsAt);
    if (!needsAttention(b, days.get(date) ?? null, now, timeZone)) continue;
    count++;
    if (nextDate === null || date < nextDate) nextDate = date;
  }
  return { count, nextDate };
}

/** Pending, not expired bookings per club-local date (dates with none are left out). */
export function pendingCountsByDate(bookings: TimedBooking[], now: Date, timeZone: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const b of bookings) {
    if (b.status !== "PENDING" || now >= b.startsAt) continue;
    const date = dateInZone(timeZone, b.startsAt);
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }
  return counts;
}
