import "server-only";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/shared/lib/prisma";
import { clubDayKey, listClubDays } from "@/entities/club/repository";
import { dateInZone, isIsoDate, utcRangeOfDate } from "@/shared/lib/time";
import { shapeDayBookings, type DayBooking, type Viewer } from "./dayView";
import { shapeMyBookings, type MyBooking } from "./myBookings";
import { attentionSummary, pendingCountsByDate } from "./attention";
import type { WriteErrorCode } from "./messages";
import { freeGaps, type Gap } from "./gaps";
import { checkBooking, checkEdit, type BookingConfig, type BookingRequest } from "./rules";
import {
  canCancel,
  canApprove,
  canEdit,
  initialStatus,
  type Actor,
  type DayState,
  type TimedBooking,
} from "./status";

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
  /** A booking to leave out (the one being edited). */
  ignoreId?: string | null;
}): Promise<Map<string, TimedBooking[]>> {
  const { start, end } = utcRangeOfDate(p.date, p.timeZone);
  const rows = await prisma.booking.findMany({
    where: {
      tableId: { in: p.tableIds },
      startsAt: { gte: start, lt: end },
      ...blockingWhere(p.now),
      ...(p.ignoreId ? { id: { not: p.ignoreId } } : {}),
    },
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

/** Why a write was refused: a failed booking check, or a state problem. */
export type WriteError = WriteErrorCode;
export type WriteResult = { ok: true } | { ok: false; errors: WriteError[] };

type Tx = Prisma.TransactionClient;

/**
 * Locks the table's row, then loads what the booking checks need. Every
 * create and every edit that moves a booking goes through here, inside its
 * transaction, so bookings for one table are written one after the other
 * (docs/DOMAIN.md → "Preventing double booking").
 */
async function lockAndCheck(tx: Tx, request: BookingRequest, now: Date, config: BookingConfig) {
  const [table = null] = await tx.$queryRaw<{ id: string; isActive: boolean }[]>`
    SELECT "id", "isActive" FROM "Table" WHERE "id" = ${request.tableId} FOR UPDATE`;
  if (!isIsoDate(request.date)) return { table, clubDay: null, existing: [] };
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
  return { table, clubDay, existing };
}

/** Who a booking is for: a member's id, or a walk-in's name and contact. */
export type BookerData = { userId: string } | { walkInName: string; walkInContact: string | null };

/**
 * Creates a booking after every booking check. Members' bookings start
 * pending, admins' approved (for themselves, a member or a walk-in).
 */
export async function createBooking(p: {
  request: BookingRequest;
  note: string | null;
  booker: BookerData;
  adminComment?: string | null;
  actor: Actor;
  now: Date;
  config: BookingConfig;
}): Promise<WriteResult> {
  const { request, now, config } = p;
  return prisma.$transaction(async (tx): Promise<WriteResult> => {
    const ctx = await lockAndCheck(tx, request, now, config);
    const result = checkBooking(request, { now, config, ...ctx });
    if (!result.ok) return result;
    if ("userId" in p.booker) {
      const exists = await tx.user.findUnique({ where: { id: p.booker.userId }, select: { id: true } });
      if (!exists) return { ok: false, errors: ["MEMBER_NOT_FOUND"] };
    }
    await tx.booking.create({
      data: {
        tableId: request.tableId,
        startsAt: result.startsAt,
        endsAt: result.endsAt,
        note: p.note,
        adminComment: p.adminComment ?? null,
        status: initialStatus(p.actor),
        ...p.booker,
      },
    });
    return { ok: true };
  });
}

/**
 * Admin edit. Moving it (table, date, time) re-runs every check, ignoring
 * the booking itself; a note, walk-in or comment change skips them
 * (`checkEdit`). The status and the member never change.
 */
export async function updateBooking(p: {
  id: string;
  request: BookingRequest;
  note: string | null;
  walkIn: { name: string; contact: string | null } | null | undefined;
  adminComment: string | null;
  actor: Actor;
  now: Date;
  config: BookingConfig;
}): Promise<WriteResult> {
  const { request, now, config } = p;
  return prisma.$transaction(async (tx): Promise<WriteResult> => {
    const ctx = await lockAndCheck(tx, request, now, config);
    const current = await tx.booking.findUnique({
      where: { id: p.id },
      select: { id: true, tableId: true, startsAt: true, endsAt: true, status: true, userId: true },
    });
    if (!current) return { ok: false, errors: ["NOT_FOUND"] };
    if (!canEdit(current, p.actor, now)) return { ok: false, errors: ["NOT_ALLOWED"] };
    const result = checkEdit(current, request, { now, config, ...ctx });
    if (!result.ok) return result;
    const isWalkIn = current.userId === null;
    await tx.booking.update({
      where: { id: p.id },
      data: {
        tableId: request.tableId,
        startsAt: result.startsAt,
        endsAt: result.endsAt,
        note: p.note,
        adminComment: p.adminComment,
        ...(isWalkIn && p.walkIn ? { walkInName: p.walkIn.name, walkInContact: p.walkIn.contact } : {}),
      },
    });
    return { ok: true };
  });
}

/**
 * Cancels a pending/approved booking before it starts, if the actor may
 * (`canCancel`). An admin may set the admin comment at the same time.
 */
export async function cancelBooking(p: {
  id: string;
  actor: Actor;
  now: Date;
  adminComment?: string | null;
}): Promise<WriteResult> {
  const booking = await prisma.booking.findUnique({
    where: { id: p.id },
    select: { status: true, startsAt: true, endsAt: true, userId: true },
  });
  if (!booking) return { ok: false, errors: ["NOT_FOUND"] };
  if (!canCancel(booking, p.actor, p.now)) return { ok: false, errors: ["NOT_ALLOWED"] };
  // Conditional on the state just checked, so a concurrent change isn't overwritten.
  const { count } = await prisma.booking.updateMany({
    where: { id: p.id, status: booking.status, startsAt: { gt: p.now } },
    data: {
      status: "CANCELLED",
      ...(p.actor.isAdmin && p.adminComment !== undefined ? { adminComment: p.adminComment } : {}),
    },
  });
  return count ? { ok: true } : { ok: false, errors: ["NOT_ALLOWED"] };
}

/** Approves a pending booking that hasn't expired. Declining one is a cancel. */
export async function approveBooking(p: { id: string; actor: Actor; now: Date }): Promise<WriteResult> {
  const booking = await prisma.booking.findUnique({
    where: { id: p.id },
    select: { status: true, startsAt: true, endsAt: true },
  });
  if (!booking) return { ok: false, errors: ["NOT_FOUND"] };
  if (!canApprove(booking, p.actor, p.now)) return { ok: false, errors: ["NOT_ALLOWED"] };
  const { count } = await prisma.booking.updateMany({
    where: { id: p.id, status: "PENDING", startsAt: { gt: p.now } },
    data: { status: "APPROVED" },
  });
  return count ? { ok: true } : { ok: false, errors: ["NOT_ALLOWED"] };
}

/** Admins may set the comment on any booking at any time. False if it doesn't exist. */
export async function setAdminComment(id: string, adminComment: string | null): Promise<boolean> {
  const { count } = await prisma.booking.updateMany({ where: { id }, data: { adminComment } });
  return count > 0;
}

/** Bookings from today onward that could need attention, with their days' state. */
async function loadAttentionCandidates(now: Date, timeZone: string) {
  const today = dateInZone(timeZone, now);
  const rows = await prisma.booking.findMany({
    where: { startsAt: { gte: utcRangeOfDate(today, timeZone).start }, ...blockingWhere(now) },
    select: { status: true, startsAt: true, endsAt: true },
  });
  const dates = rows.map((r) => dateInZone(timeZone, r.startsAt)).sort();
  const days = new Map<string, DayState>();
  if (dates.length) {
    for (const d of await listClubDays(dates[0]!, dates.at(-1)!)) days.set(d.date, { isActive: d.isActive });
  }
  return { rows, days };
}

/** Needs attention (N) for the admin nav: the count and the next day with one. */
export async function getAttentionSummary(now: Date, timeZone: string) {
  const { rows, days } = await loadAttentionCandidates(now, timeZone);
  return attentionSummary(rows, days, now, timeZone);
}

/** Pending (not expired) bookings per club-local date from `first` to `last`. */
export async function listPendingCounts(p: {
  first: string;
  last: string;
  now: Date;
  timeZone: string;
}): Promise<Map<string, number>> {
  const rows = await prisma.booking.findMany({
    where: {
      status: "PENDING",
      startsAt: {
        gt: p.now,
        gte: utcRangeOfDate(p.first, p.timeZone).start,
        lt: utcRangeOfDate(p.last, p.timeZone).end,
      },
    },
    select: { status: true, startsAt: true, endsAt: true },
  });
  return pendingCountsByDate(rows, p.now, p.timeZone);
}

/**
 * Admin modal: a table's working hours and free gaps on a date, ignoring
 * the booking being edited. `hours` is null when the day isn't active.
 */
export async function getTableAvailability(p: {
  tableId: string;
  date: string;
  ignoreId: string | null;
  now: Date;
  config: BookingConfig;
}): Promise<{ hours: { openTime: string; closeTime: string } | null; gaps: Gap[] }> {
  if (!isIsoDate(p.date)) return { hours: null, gaps: [] };
  const [day] = await listClubDays(p.date, p.date);
  if (!day?.isActive) return { hours: null, gaps: [] };
  const blocking = await listBlockingOnDate({
    date: p.date,
    tableIds: [p.tableId],
    now: p.now,
    timeZone: p.config.timeZone,
    ignoreId: p.ignoreId,
  });
  const hours = { openTime: day.openTime, closeTime: day.closeTime };
  return { hours, gaps: freeGaps({ date: p.date, hours, bookings: blocking.get(p.tableId) ?? [], now: p.now, config: p.config }) };
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
