import { describe, expect, it } from "vitest";
import { shapeMyBookings, type MyBookingRow } from "./myBookings";

const KYIV = "Europe/Kyiv";
// Now: Friday 20 Nov 2026, 15:00 Kyiv (UTC+2).
const now = new Date("2026-11-20T13:00:00Z");
const at = (date: string, hour: number) => new Date(`${date}T${String(hour - 2).padStart(2, "0")}:00:00Z`);

const row = (over: Partial<MyBookingRow>): MyBookingRow => ({
  id: "b",
  tableName: "Table 1",
  startsAt: at("2026-11-21", 14),
  endsAt: at("2026-11-21", 18),
  status: "APPROVED",
  note: null,
  adminComment: null,
  userId: "me",
  ...over,
});

const me = { id: "me", isAdmin: false };
const active = new Map([
  ["2026-11-21", { isActive: true }],
  ["2026-11-22", { isActive: true }],
  ["2026-11-19", { isActive: true }],
]);

describe("shapeMyBookings", () => {
  it("splits on the end time: upcoming soonest first, past latest first", () => {
    const rows = [
      row({ id: "sun", startsAt: at("2026-11-22", 12), endsAt: at("2026-11-22", 14) }),
      row({ id: "sat" }),
      row({ id: "wed", startsAt: at("2026-11-18", 12), endsAt: at("2026-11-18", 14) }),
      row({ id: "thu", startsAt: at("2026-11-19", 12), endsAt: at("2026-11-19", 14) }),
      row({ id: "now", startsAt: at("2026-11-20", 14), endsAt: at("2026-11-20", 16) }),
    ];
    const { upcoming, past } = shapeMyBookings(rows, active, me, now, KYIV);
    expect(upcoming.map((b) => b.id)).toEqual(["now", "sat", "sun"]);
    expect(past.map((b) => b.id)).toEqual(["thu", "wed"]);
  });

  it("gives club-local date and time, shown status, note and admin comment", () => {
    const rows = [
      row({ id: "x", status: "CANCELLED", note: "40k", adminComment: "Tournament that day" }),
      row({ id: "old", status: "APPROVED", startsAt: at("2026-11-19", 12), endsAt: at("2026-11-19", 14) }),
    ];
    const { upcoming, past } = shapeMyBookings(rows, active, me, now, KYIV);
    expect(upcoming[0]).toMatchObject({
      date: "2026-11-21",
      time: "14:00–18:00",
      tableName: "Table 1",
      status: "CANCELLED",
      note: "40k",
      adminComment: "Tournament that day",
      canCancel: false,
    });
    expect(past[0]!.status).toBe("COMPLETED");
  });

  it("allows Cancel on pending/approved bookings that haven't started", () => {
    const rows = [
      row({ id: "pending", status: "PENDING" }),
      row({ id: "started", startsAt: at("2026-11-20", 14), endsAt: at("2026-11-20", 16) }),
      row({ id: "cancelled", status: "CANCELLED" }),
    ];
    const { upcoming } = shapeMyBookings(rows, active, me, now, KYIV);
    expect(upcoming.filter((b) => b.canCancel).map((b) => b.id)).toEqual(["pending"]);
  });

  it("flags blocking bookings on a day that isn't active", () => {
    const rows = [
      row({ id: "deactivated", startsAt: at("2026-11-23", 12), endsAt: at("2026-11-23", 14) }),
      row({ id: "cancelled", status: "CANCELLED", startsAt: at("2026-11-23", 14), endsAt: at("2026-11-23", 16) }),
      row({ id: "fine" }),
    ];
    const days = new Map([...active, ["2026-11-23", { isActive: false }]]);
    const { upcoming } = shapeMyBookings(rows, days, me, now, KYIV);
    expect(upcoming.map((b) => [b.id, b.onInactiveDay])).toEqual([
      ["fine", false],
      ["deactivated", true],
      ["cancelled", false],
    ]);
  });
});
