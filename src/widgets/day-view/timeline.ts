import type { ShownStatus } from "@/entities/booking/status";

export type Hours = { openTime: string; closeTime: string };
export type SegmentKind = "approved" | "pending" | "taken";
type Timed = { startTime: string; endTime: string; status: ShownStatus | null };
export type Segment<T extends Timed = Timed> = { left: number; width: number; kind: SegmentKind; booking: T };

/** "HH:MM" → minutes from midnight. A closing "00:00" means the end of the day. */
export function toMinutes(time: string, isClose = false): number {
  const [h = 0, m = 0] = time.split(":").map(Number);
  const minutes = h * 60 + m;
  return isClose && minutes === 0 ? 1440 : minutes;
}

/** Status shown to the viewer → how the bar draws it. Null = someone else's booking. */
export function segmentKind(status: ShownStatus | null): SegmentKind {
  if (status === "PENDING") return "pending";
  if (status === null) return "taken";
  return "approved";
}

const span = (hours: Hours) => {
  const open = toMinutes(hours.openTime);
  const close = toMinutes(hours.closeTime, true);
  return { open, close, length: close - open };
};

/**
 * Bookings as left/width percentages of the open hours, clipped to them.
 * Cancelled and expired bookings don't take time.
 */
export function timelineSegments<T extends Timed>(hours: Hours, bookings: T[]): Segment<T>[] {
  const { open, close, length } = span(hours);
  if (length <= 0) return [];
  return bookings.flatMap((booking) => {
    if (booking.status === "CANCELLED" || booking.status === "EXPIRED") return [];
    const start = Math.max(toMinutes(booking.startTime), open);
    const end = Math.min(toMinutes(booking.endTime, true), close);
    if (end <= start) return [];
    return [
      {
        left: ((start - open) / length) * 100,
        width: ((end - start) / length) * 100,
        kind: segmentKind(booking.status),
        booking,
      },
    ];
  });
}

/** Whole-hour ticks across the open hours: every hour, or every second hour past 8 hours. */
export function hourTicks(hours: Hours): { label: string; left: number }[] {
  const { open, close, length } = span(hours);
  if (length <= 0) return [];
  const step = length > 8 * 60 ? 120 : 60;
  const ticks = [];
  for (let t = Math.ceil(open / 60) * 60; t <= close; t += step) {
    ticks.push({ label: String((t / 60) % 24).padStart(2, "0"), left: ((t - open) / length) * 100 });
  }
  return ticks;
}
