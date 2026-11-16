// A member's own bookings for My bookings: split into upcoming and past, with
// derived statuses and the On inactive day flag. Pure.
import { dateInZone, timeRangeInZone } from "@/shared/lib/time";
import {
  canCancel,
  displayStatus,
  isOnInactiveDay,
  type Actor,
  type DayState,
  type ShownStatus,
  type StoredStatus,
} from "./status";

/** A booking as loaded for My bookings. */
export type MyBookingRow = {
  id: string;
  tableName: string;
  startsAt: Date;
  endsAt: Date;
  status: StoredStatus;
  note: string | null;
  adminComment: string | null;
  userId: string | null;
};

export type MyBooking = {
  id: string;
  tableName: string;
  date: string; // "YYYY-MM-DD", club-local
  time: string; // "12:00–14:00", club-local
  status: ShownStatus;
  note: string | null;
  adminComment: string | null;
  onInactiveDay: boolean;
  canCancel: boolean;
};

/**
 * Upcoming = not yet ended, soonest first; past = ended, latest first.
 * `days` maps club-local dates to their ClubDay (missing = inactive).
 */
export function shapeMyBookings(
  rows: MyBookingRow[],
  days: Map<string, DayState>,
  actor: Actor,
  now: Date,
  timeZone: string,
): { upcoming: MyBooking[]; past: MyBooking[] } {
  const shaped = [...rows]
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
    .map((b) => {
      const date = dateInZone(timeZone, b.startsAt);
      return {
        ended: now >= b.endsAt,
        booking: {
          id: b.id,
          tableName: b.tableName,
          date,
          time: timeRangeInZone(b.startsAt, b.endsAt, timeZone),
          status: displayStatus(b, now),
          note: b.note,
          adminComment: b.adminComment,
          onInactiveDay: !(now >= b.endsAt) && isOnInactiveDay(b, days.get(date) ?? null, now),
          canCancel: canCancel(b, actor, now),
        } satisfies MyBooking,
      };
    });
  return {
    upcoming: shaped.filter((s) => !s.ended).map((s) => s.booking),
    past: shaped
      .filter((s) => s.ended)
      .map((s) => s.booking)
      .reverse(),
  };
}
