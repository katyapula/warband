// Booking checks (docs/DOMAIN.md → "Booking checks"). Pure: the caller loads
// the table, the date's ClubDay and the table's bookings around that date,
// then persists inside a transaction that locks the table row.
import { addDays, dateInZone, isIsoDate, localTimeToUtc, toMinutes } from "@/shared/lib/time";
import { isBlocking, type TimedBooking } from "./status";

/** Longest note a booking may carry. */
export const BOOKING_NOTE_MAX = 500;

export type BookingConfig = {
  timeZone: string;
  bookingWindowDays: number;
  slotStepMinutes: number;
  minBookingMinutes: number;
};

/** What the booking modal sends. Date and times are club-local. */
export type BookingRequest = {
  tableId: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm" or "24:00"
};

export type RuleContext = {
  now: Date;
  config: BookingConfig;
  /** The requested table, or null if it doesn't exist. */
  table: { id: string; isActive: boolean } | null;
  /** The requested date's ClubDay, or null if it has none. */
  clubDay: { isActive: boolean; openTime: string; closeTime: string } | null;
  /** Other bookings on the requested table that may overlap (any status). */
  existing: (TimedBooking & { id: string })[];
};

export type BookingError =
  | "BAD_INPUT"
  | "TABLE_INACTIVE"
  | "IN_PAST"
  | "OUTSIDE_WINDOW"
  | "DAY_INACTIVE"
  | "OUTSIDE_HOURS"
  | "OFF_STEP"
  | "END_BEFORE_START"
  | "TOO_SHORT"
  | "OVERLAP";

export type CheckResult =
  { ok: true; startsAt: Date; endsAt: Date } | { ok: false; errors: BookingError[] };

/** Checks a new booking against every rule and returns all that fail. */
export function checkBooking(req: BookingRequest, ctx: RuleContext): CheckResult {
  return check(req, ctx, null);
}

/**
 * Checks an admin edit. If table, date and time are unchanged (a note or
 * walk-in edit) nothing is re-checked, so a flagged booking can still be
 * annotated. Otherwise every rule applies, ignoring the booking itself.
 */
export function checkEdit(
  current: { id: string; tableId: string; startsAt: Date; endsAt: Date },
  req: BookingRequest,
  ctx: RuleContext,
): CheckResult {
  const range = toUtcRange(req, ctx.config.timeZone);
  const unchanged =
    range !== null &&
    req.tableId === current.tableId &&
    range.startsAt.getTime() === current.startsAt.getTime() &&
    range.endsAt.getTime() === current.endsAt.getTime();
  if (unchanged) return { ok: true, startsAt: current.startsAt, endsAt: current.endsAt };
  return check(req, ctx, current.id);
}

function toUtcRange(req: BookingRequest, timeZone: string) {
  if (!isIsoDate(req.date) || toMinutes(req.startTime) === null || toMinutes(req.endTime) === null)
    return null;
  return {
    startsAt: localTimeToUtc(req.date, req.startTime, timeZone),
    endsAt: localTimeToUtc(req.date, req.endTime, timeZone),
  };
}

function check(req: BookingRequest, ctx: RuleContext, ignoreId: string | null): CheckResult {
  const { now, config } = ctx;
  const range = toUtcRange(req, config.timeZone);
  if (!range) return { ok: false, errors: ["BAD_INPUT"] };
  const { startsAt, endsAt } = range;
  const start = toMinutes(req.startTime)!;
  const end = toMinutes(req.endTime)!;
  const errors: BookingError[] = [];

  // 1. Table exists and is active.
  if (!ctx.table?.isActive) errors.push("TABLE_INACTIVE");

  // 2. Start is not in the past.
  if (startsAt <= now) errors.push("IN_PAST");

  // 3. Date within today … today + window.
  const today = dateInZone(config.timeZone, now);
  if (req.date < today || req.date > addDays(today, config.bookingWindowDays))
    errors.push("OUTSIDE_WINDOW");

  // 4. Day is active. 5. Within its current hours (only meaningful if active).
  const day = ctx.clubDay;
  if (!day?.isActive) errors.push("DAY_INACTIVE");
  else if (start < toMinutes(day.openTime)! || end > toMinutes(day.closeTime)!)
    errors.push("OUTSIDE_HOURS");

  // 6. On the step; long enough.
  if (start % config.slotStepMinutes || end % config.slotStepMinutes) errors.push("OFF_STEP");
  if (end <= start) errors.push("END_BEFORE_START");
  else if (end - start < config.minBookingMinutes) errors.push("TOO_SHORT");

  // 7. No overlap with another blocking booking on this table.
  const overlaps = ctx.existing.some(
    (b) => b.id !== ignoreId && isBlocking(b, now) && b.startsAt < endsAt && startsAt < b.endsAt,
  );
  if (overlaps) errors.push("OVERLAP");

  return errors.length ? { ok: false, errors } : { ok: true, startsAt, endsAt };
}

export function bookingErrorMessage(error: BookingError, config: BookingConfig): string {
  switch (error) {
    case "BAD_INPUT":
      return "Pick a date, a start and an end time.";
    case "TABLE_INACTIVE":
      return "This table isn't available for booking.";
    case "IN_PAST":
      return "The start time has already passed.";
    case "OUTSIDE_WINDOW":
      return `Bookings can be made from today up to ${config.bookingWindowDays} days ahead.`;
    case "DAY_INACTIVE":
      return "The club isn't open for booking on this day.";
    case "OUTSIDE_HOURS":
      return "The booking must fit within the day's working hours.";
    case "OFF_STEP":
      return `Start and end must be on a ${config.slotStepMinutes}-minute step.`;
    case "END_BEFORE_START":
      return "The end must be after the start.";
    case "TOO_SHORT":
      return `Book at least ${config.minBookingMinutes} minutes.`;
    case "OVERLAP":
      return "This table is already booked for part of that time.";
  }
}
