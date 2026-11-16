// What each role may see of a day's bookings (docs/ARCHITECTURE.md → "Data
// visibility"). The repository calls this before anything reaches the UI.
import { canCancel, displayStatus, isBlocking, type ShownStatus, type StoredStatus } from "./status";

/** A booking as loaded for the day view, before shaping. */
export type DayBookingRow = {
  id: string;
  tableId: string;
  startsAt: Date;
  endsAt: Date;
  status: StoredStatus;
  note: string | null;
  userId: string | null;
  username: string | null;
  walkInName: string | null;
  walkInContact: string | null;
  adminComment: string | null;
};

/** null for a visitor. */
export type Viewer = { id: string; isAdmin: boolean } | null;

/** A booking as one viewer may see it. Hidden fields are null. */
export type DayBooking = {
  id: string;
  tableId: string;
  startsAt: Date;
  endsAt: Date;
  /** "Booked", a username, or (admins) a walk-in name. */
  label: string;
  isOwn: boolean;
  isWalkIn: boolean;
  /** Own bookings and admins only. */
  status: ShownStatus | null;
  /** Own bookings and admins only. */
  note: string | null;
  /** Admins only. */
  walkInContact: string | null;
  /** Own bookings and admins only. */
  adminComment: string | null;
  /** The viewer may cancel it now (see `canCancel`). */
  canCancel: boolean;
};

/**
 * Visitors and members see blocking bookings only; admins see all. Visitors
 * see every booking as "Booked"; members see usernames (walk-ins stay
 * "Booked"); admins also see walk-in names and contacts.
 */
export function shapeDayBookings(rows: DayBookingRow[], viewer: Viewer, now: Date): DayBooking[] {
  const isAdmin = viewer?.isAdmin ?? false;
  return rows
    .filter((b) => isAdmin || isBlocking(b, now))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
    .map((b) => {
      const isOwn = viewer !== null && b.userId === viewer.id;
      const isWalkIn = b.userId === null;
      const seesDetails = isAdmin || isOwn;
      let label = "Booked";
      if (isAdmin) label = (isWalkIn ? b.walkInName : b.username) ?? "Booked";
      else if (viewer && !isWalkIn && b.username) label = b.username;
      return {
        id: b.id,
        tableId: b.tableId,
        startsAt: b.startsAt,
        endsAt: b.endsAt,
        label,
        isOwn,
        isWalkIn,
        status: seesDetails ? displayStatus(b, now) : null,
        note: seesDetails ? b.note : null,
        walkInContact: isAdmin ? b.walkInContact : null,
        adminComment: seesDetails ? b.adminComment : null,
        canCancel: viewer !== null && canCancel(b, viewer, now),
      };
    });
}
