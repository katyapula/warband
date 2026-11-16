// Free time on one table on one day: where a new booking could go. Drives the
// day view's Add button and the times the booking modal offers. Pure; times
// are club-local minutes since midnight (1440 = midnight at the end).
// The server still runs the full checks in ./rules when the booking is made.
import { addDays, dateInZone, fromMinutes, toMinutes } from "@/shared/lib/time";
import type { BookingConfig } from "./rules";
import { isBlocking, type TimedBooking } from "./status";

export type Gap = { start: number; end: number };
/** What the modal's time choices need. */
export type SlotRules = Pick<BookingConfig, "slotStepMinutes" | "minBookingMinutes">;

export type GapInput = {
  date: string; // "YYYY-MM-DD", club-local
  /** The active day's working hours. */
  hours: { openTime: string; closeTime: string };
  /** The table's bookings on that date (any status). */
  bookings: TimedBooking[];
  now: Date;
  config: BookingConfig;
};

/** Minutes since local midnight of `date` for an instant, clamped to [0, 1440]. */
export function minutesOnDate(instant: Date, date: string, timeZone: string): number {
  const day = dateInZone(timeZone, instant);
  if (day < date) return 0;
  if (day > date) return 1440;
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  }).format(instant);
  return toMinutes(time)!;
}

/**
 * Stretches of at least the minimum duration, on the slot step, between the
 * blocking bookings, within the hours, starting after `now`. Empty for past
 * days and days beyond the booking window.
 */
export function freeGaps({ date, hours, bookings, now, config }: GapInput): Gap[] {
  const { timeZone, slotStepMinutes: step, minBookingMinutes: min } = config;
  const today = dateInZone(timeZone, now);
  if (date < today || date > addDays(today, config.bookingWindowDays)) return [];

  let from = toMinutes(hours.openTime)!;
  const close = toMinutes(hours.closeTime)!;
  if (date === today) {
    // The first step strictly after now: a booking may not start at or before now.
    const nowMinutes = minutesOnDate(now, date, timeZone);
    from = Math.max(from, (Math.floor(nowMinutes / step) + 1) * step);
  }

  const taken = bookings
    .filter((b) => isBlocking(b, now))
    .map((b) => ({
      start: minutesOnDate(b.startsAt, date, timeZone),
      end: minutesOnDate(b.endsAt, date, timeZone),
    }))
    .sort((a, b) => a.start - b.start);

  const gaps: Gap[] = [];
  const push = (start: number, end: number) => {
    const s = Math.ceil(start / step) * step;
    const e = Math.floor(end / step) * step;
    if (e - s >= min) gaps.push({ start: s, end: e });
  };
  for (const t of taken) {
    if (t.start > from) push(from, Math.min(t.start, close));
    from = Math.max(from, t.end);
    if (from >= close) break;
  }
  if (from < close) push(from, close);
  return gaps;
}

/** Start times ("HH:mm") that leave room for the minimum duration in their gap. */
export function startChoices(gaps: Gap[], config: SlotRules): string[] {
  const { slotStepMinutes: step, minBookingMinutes: min } = config;
  return gaps.flatMap((g) => {
    const out: string[] = [];
    for (let t = g.start; t + min <= g.end; t += step) out.push(fromMinutes(t));
    return out;
  });
}

/** End times for a start: from start + minimum to the end of the start's gap. */
export function endChoices(gaps: Gap[], startTime: string, config: SlotRules): string[] {
  const start = toMinutes(startTime);
  const gap = start === null ? undefined : gaps.find((g) => g.start <= start && start < g.end);
  if (!gap || start === null) return [];
  const out: string[] = [];
  for (let t = start + config.minBookingMinutes; t <= gap.end; t += config.slotStepMinutes) out.push(fromMinutes(t));
  return out;
}
