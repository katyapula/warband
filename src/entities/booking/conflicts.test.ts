import { describe, expect, it } from "vitest";
import { inactiveDatesWithBookings, outsideHours } from "./conflicts";
import type { StoredStatus } from "./status";

const KYIV = "Europe/Kyiv";
// Now: Friday 20 Nov 2026, 10:00 Kyiv (UTC+2).
const now = new Date("2026-11-20T08:00:00Z");
const at = (date: string, time: string) => {
  if (time === "24:00") return at(date === "2026-11-21" ? "2026-11-22" : date, "00:00");
  const [h, m] = time.split(":").map(Number) as [number, number];
  const [y, mo, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, mo - 1, d, h - 2, m));
};
const b = (id: string, from: string, to: string, status: StoredStatus = "APPROVED", date = "2026-11-21") => ({
  id,
  status,
  startsAt: at(date, from),
  endsAt: at(date, to),
});

describe("outsideHours", () => {
  const bookings = [
    b("early", "11:00", "13:00"),
    b("inside", "14:00", "16:00"),
    b("late", "18:00", "21:00"),
    b("cancelled", "10:00", "12:00", "CANCELLED"),
    b("toMidnight", "22:00", "24:00"),
  ];

  it("lists blocking bookings that start before the opening or end after the closing", () => {
    const out = outsideHours(bookings, "2026-11-21", { openTime: "12:00", closeTime: "20:00" }, now, KYIV);
    expect(out.map((x) => x.id)).toEqual(["early", "late", "toMidnight"]);
  });

  it("is empty when the hours still cover every booking", () => {
    expect(outsideHours(bookings, "2026-11-21", { openTime: "11:00", closeTime: "24:00" }, now, KYIV)).toEqual([]);
  });
});

describe("inactiveDatesWithBookings", () => {
  it("finds days with a blocking booking that have no ClubDay or a deactivated one", () => {
    const days = new Map([
      ["2026-11-21", { isActive: true }],
      ["2026-11-22", { isActive: false }],
    ]);
    const bookings = [
      b("a", "12:00", "14:00", "APPROVED", "2026-11-21"),
      b("b", "12:00", "14:00", "PENDING", "2026-11-22"),
      b("c", "12:00", "14:00", "APPROVED", "2026-11-23"),
      b("d", "12:00", "14:00", "CANCELLED", "2026-11-24"),
    ];
    expect([...inactiveDatesWithBookings(bookings, days, now, KYIV)]).toEqual(["2026-11-22", "2026-11-23"]);
  });
});
