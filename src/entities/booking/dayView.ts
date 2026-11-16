// What each role may see of a day's bookings (docs/ARCHITECTURE.md → "Data
// visibility"). The repository calls this before anything reaches the UI.
import {
  canApprove,
  canCancel,
  canEdit,
  displayStatus,
  isBlocking,
  isOnInactiveDay,
  type DayState,
  type ShownStatus,
  type StoredStatus,
} from "./status";

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
  /** Admins only: the member who booked (null for walk-ins). */
  memberId: string | null;
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
  /** Admins: approve now. */
  canApprove: boolean;
  /** Admins: edit now. */
  canEdit: boolean;
  /** Admins and the booker: blocking, but the day isn't active (⚠). */
  onInactiveDay: boolean;
};

/**
 * Visitors and members see blocking bookings only; admins see all. Visitors
 * see every booking as "Booked"; members see usernames (walk-ins stay
 * "Booked"); admins also see walk-in names and contacts.
 */
export function shapeDayBookings(
  rows: DayBookingRow[],
  viewer: Viewer,
  now: Date,
  /** The date's ClubDay (null = none, inactive). */
  day: DayState = { isActive: true },
): DayBooking[] {
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
        memberId: isAdmin ? b.userId : null,
        status: seesDetails ? displayStatus(b, now) : null,
        note: seesDetails ? b.note : null,
        walkInContact: isAdmin ? b.walkInContact : null,
        adminComment: seesDetails ? b.adminComment : null,
        canCancel: viewer !== null && canCancel(b, viewer, now),
        canApprove: viewer !== null && canApprove(b, viewer, now),
        canEdit: viewer !== null && canEdit(b, viewer, now),
        onInactiveDay: seesDetails && isOnInactiveDay(b, day, now),
      };
    });
}
