import "server-only";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/shared/lib/prisma";
import { utcRangeOfDate } from "@/shared/lib/time";
import { shapeDayBookings, type DayBooking, type Viewer } from "./dayView";

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
      walkInPhone: true,
      user: { select: { username: true } },
    },
  });
  return shapeDayBookings(
    rows.map(({ user, walkInPhone, ...b }) => ({
      ...b,
      username: user?.username ?? null,
      walkInContact: walkInPhone, // renamed to walkInContact in slice 6
    })),
    p.viewer,
    p.now,
  );
}
