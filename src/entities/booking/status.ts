// Derived statuses, the On inactive day flag, Needs attention and who may do
// what to a booking. Pure: everything time-dependent takes `now`.
// See docs/DOMAIN.md and docs/adr/0001.
import { dateInZone } from "@/shared/lib/time";

/** Matches the Prisma `BookingStatus` enum. */
export type StoredStatus = "PENDING" | "APPROVED" | "CANCELLED";
/** What the UI shows: stored statuses plus the two derived from time. */
export type ShownStatus = StoredStatus | "EXPIRED" | "COMPLETED";

export type TimedBooking = { status: StoredStatus; startsAt: Date; endsAt: Date };
export type OwnedBooking = TimedBooking & { userId: string | null };
export type Actor = { id: string; isAdmin: boolean };
/** The booking's `ClubDay`, or null when the date has none (inactive). */
export type DayState = { isActive: boolean } | null;

const isExpired = (b: TimedBooking, now: Date) => b.status === "PENDING" && now >= b.startsAt;
const isOpen = (b: TimedBooking) => b.status === "PENDING" || b.status === "APPROVED";
const hasStarted = (b: TimedBooking, now: Date) => now >= b.startsAt;

export function displayStatus(b: TimedBooking, now: Date): ShownStatus {
  if (isExpired(b, now)) return "EXPIRED";
  if (b.status === "APPROVED" && now >= b.endsAt) return "COMPLETED";
  return b.status;
}

/** Approved, or pending and not expired: it keeps others off the table. */
export function isBlocking(b: TimedBooking, now: Date): boolean {
  return b.status === "APPROVED" || (b.status === "PENDING" && !isExpired(b, now));
}

export function isOnInactiveDay(b: TimedBooking, day: DayState, now: Date): boolean {
  return isBlocking(b, now) && !day?.isActive;
}

/** Pending (not expired), or blocking on an inactive day — from today onward. */
export function needsAttention(
  b: TimedBooking,
  day: DayState,
  now: Date,
  timeZone: string,
): boolean {
  if (dateInZone(timeZone, b.startsAt) < dateInZone(timeZone, now)) return false;
  return (b.status === "PENDING" && !isExpired(b, now)) || isOnInactiveDay(b, day, now);
}

export function initialStatus(actor: Actor): StoredStatus {
  return actor.isAdmin ? "APPROVED" : "PENDING";
}

/** Owner or admin, pending/approved, before it starts. Walk-in bookings: admins only. */
export function canCancel(b: OwnedBooking, actor: Actor, now: Date): boolean {
  const mayAct = actor.isAdmin || (b.userId !== null && b.userId === actor.id);
  return mayAct && isOpen(b) && !hasStarted(b, now);
}

/** Admins only (members cancel and book again), pending/approved, before it starts. */
export function canEdit(b: TimedBooking, actor: Actor, now: Date): boolean {
  return actor.isAdmin && isOpen(b) && !hasStarted(b, now);
}

/** Approve: admins only, pending and not expired. (Declining is Cancel.) */
export function canApprove(b: TimedBooking, actor: Actor, now: Date): boolean {
  return actor.isAdmin && b.status === "PENDING" && !isExpired(b, now);
}
