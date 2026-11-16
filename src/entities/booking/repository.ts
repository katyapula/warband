import "server-only";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/shared/lib/prisma";
import { clubDayKey, listClubDays } from "@/entities/club/repository";
import { dateInZone, isIsoDate, utcRangeOfDate } from "@/shared/lib/time";
import { shapeDayBookings, type DayBooking, type Viewer } from "./dayView";
import { shapeMyBookings, type MyBooking } from "./myBookings";
import { checkBooking, type BookingConfig, type BookingError, type BookingRequest } from "./rules";
import { canCancel, initialStatus, type Actor, type DayState, type TimedBooking } from "./status";

/**
 * `isBlocking` (./status.ts) as a Prisma filter: approved, or pending and
 * not yet started. Keep the two in step (docs/adr/0001).
 */
export function blockingWhere(now: Date): Prisma.BookingWhereInput {
  return {
    OR: [{ status: "APPROVED" }, { status: "PENDING", startsAt: { gt: now } }],
  };
}

/**
 * Bookings on the given tables that start on a club-local date, shaped for
 * the viewer: visitors and members get blocking bookings only, with names
 * and details hidden as `shapeDayBookings` says.
 */
export async function listDayBookings(p: {
  date: string;
  tableIds: string[];
  viewer: Viewer;
  now: Date;
  timeZone: string;
}): Promise<DayBooking[]> {
  const { start, end } = utcRangeOfDate(p.date, p.timeZone);
  const rows = await prisma.booking.findMany({
    where: {
      tableId: { in: p.tableIds },
      startsAt: { gte: start, lt: end },
      ...(p.viewer?.isAdmin ? {} : blockingWhere(p.now)),
    },
    select: {
      id: true,
      tableId: true,
      startsAt: true,
      endsAt: true,
      status: true,
      note: true,
      userId: true,
      walkInName: true,
      walkInContact: true,
      adminComment: true,
      user: { select: { username: true } },
    },
  });
  return shapeDayBookings(
    rows.map(({ user, ...b }) => ({ ...b, username: user?.username ?? null })),
    p.viewer,
    p.now,
  );
}

/** Each table's blocking bookings that start on a club-local date, for free-gap checks. */
export async function listBlockingOnDate(p: {
  date: string;
  tableIds: string[];
  now: Date;
  timeZone: string;
}): Promise<Map<string, TimedBooking[]>> {
  const { start, end } = utcRangeOfDate(p.date, p.timeZone);
  const rows = await prisma.booking.findMany({
    where: { tableId: { in: p.tableIds }, startsAt: { gte: start, lt: end }, ...blockingWhere(p.now) },
    select: { tableId: true, status: true, startsAt: true, endsAt: true },
  });
  const byTable = new Map<string, TimedBooking[]>(p.tableIds.map((id) => [id, []]));
  for (const { tableId, ...b } of rows) byTable.get(tableId)?.push(b);
  return byTable;
}

/** Club-local dates from `first` to `last` on which the member has a blocking booking. */
export async function listOwnBookingDates(p: {
  userId: string;
  first: string;
  last: string;
  now: Date;
  timeZone: string;
}): Promise<Set<string>> {
  const rows = await prisma.booking.findMany({
    where: {
      userId: p.userId,
      startsAt: {
        gte: utcRangeOfDate(p.first, p.timeZone).start,
        lt: utcRangeOfDate(p.last, p.timeZone).end,
      },
      ...blockingWhere(p.now),
    },
    select: { startsAt: true },
  });
  return new Set(rows.map((r) => dateInZone(p.timeZone, r.startsAt)));
}

export type CreateResult = { ok: true; id: string } | { ok: false; errors: BookingError[] };

/**
 * Creates a booking for the actor: runs every booking check and writes in
 * one transaction that first locks the table's row, so concurrent bookings
 * for the same table run one after the other (docs/DOMAIN.md → "Preventing
 * double booking"). Members' bookings start pending, admins' approved.
 */
export async function createOwnBooking(p: {
  request: BookingRequest;
  note: string | null;
  actor: Actor;
  now: Date;
  config: BookingConfig;
}): Promise<CreateResult> {
  const { request, now, config } = p;
  return prisma.$transaction(async (tx) => {
    const [table = null] = await tx.$queryRaw<{ id: string; isActive: boolean }[]>`
      SELECT "id", "isActive" FROM "Table" WHERE "id" = ${request.tableId} FOR UPDATE`;
    if (!isIsoDate(request.date)) return { ok: false, errors: ["BAD_INPUT"] };

    const { start, end } = utcRangeOfDate(request.date, config.timeZone);
    const [clubDay, existing] = await Promise.all([
      tx.clubDay.findUnique({ where: { date: clubDayKey(request.date) } }),
      table
        ? tx.booking.findMany({
            where: { tableId: table.id, startsAt: { lt: end }, endsAt: { gt: start }, ...blockingWhere(now) },
            select: { id: true, status: true, startsAt: true, endsAt: true },
          })
        : [],
    ]);

    const result = checkBooking(request, { now, config, table, clubDay, existing });
    if (!result.ok) return result;

    const { id } = await tx.booking.create({
      data: {
        tableId: request.tableId,
        startsAt: result.startsAt,
        endsAt: result.endsAt,
        note: p.note,
        status: initialStatus(p.actor),
        userId: p.actor.id,
      },
      select: { id: true },
    });
    return { ok: true, id };
  });
}

export type CancelResult = { ok: true } | { ok: false; error: "NOT_FOUND" | "NOT_ALLOWED" };

/** Cancels a pending/approved booking before it starts, if the actor may (`canCancel`). */
export async function cancelBooking(p: { id: string; actor: Actor; now: Date }): Promise<CancelResult> {
  const booking = await prisma.booking.findUnique({
    where: { id: p.id },
    select: { status: true, startsAt: true, endsAt: true, userId: true },
  });
  if (!booking) return { ok: false, error: "NOT_FOUND" };
  if (!canCancel(booking, p.actor, p.now)) return { ok: false, error: "NOT_ALLOWED" };
  // Conditional on the state just checked, so a concurrent change isn't overwritten.
  const { count } = await prisma.booking.updateMany({
    where: { id: p.id, status: booking.status, startsAt: { gt: p.now } },
    data: { status: "CANCELLED" },
  });
  return count ? { ok: true } : { ok: false, error: "NOT_ALLOWED" };
}

/** The member's own bookings (any status, any date), shaped for My bookings. */
export async function listMyBookings(p: {
  actor: Actor;
  now: Date;
  timeZone: string;
}): Promise<{ upcoming: MyBooking[]; past: MyBooking[] }> {
  const rows = await prisma.booking.findMany({
    where: { userId: p.actor.id },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      status: true,
      note: true,
      adminComment: true,
      userId: true,
      table: { select: { name: true } },
    },
  });
  // Club days only matter for the flag on upcoming bookings.
  const upcomingDates = rows
    .filter((r) => r.endsAt > p.now)
    .map((r) => dateInZone(p.timeZone, r.startsAt))
    .sort();
  const days = new Map<string, DayState>();
  if (upcomingDates.length) {
    const clubDays = await listClubDays(upcomingDates[0]!, upcomingDates.at(-1)!);
    for (const d of clubDays) days.set(d.date, { isActive: d.isActive });
  }
  return shapeMyBookings(
    rows.map(({ table, ...b }) => ({ ...b, tableName: table.name })),
    days,
    p.actor,
    p.now,
    p.timeZone,
  );
}
