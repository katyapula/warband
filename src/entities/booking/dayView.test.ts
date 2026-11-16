import { describe, expect, it } from "vitest";
import { shapeDayBookings, type DayBookingRow } from "./dayView";

const now = new Date("2026-11-18T10:00:00Z");
const later = (h: number) => new Date(`2026-11-20T${String(h).padStart(2, "0")}:00:00Z`);

const row = (over: Partial<DayBookingRow>): DayBookingRow => ({
  id: "b",
  tableId: "t1",
  startsAt: later(12),
  endsAt: later(14),
  status: "APPROVED",
  note: "Kill Team",
  userId: "u-other",
  username: "orkboy",
  walkInName: null,
  walkInContact: null,
  ...over,
});

const memberBooking = row({ id: "member" });
const ownBooking = row({ id: "own", userId: "me", username: "me", status: "PENDING", startsAt: later(10), endsAt: later(11) });
const walkIn = row({ id: "walkin", userId: null, username: null, walkInName: "Bob", walkInContact: "+380…", startsAt: later(15), endsAt: later(17) });
const cancelled = row({ id: "cancelled", status: "CANCELLED" });
const expired = row({ id: "expired", status: "PENDING", startsAt: new Date("2026-11-18T09:00:00Z") });

const all = [walkIn, memberBooking, ownBooking, cancelled, expired];

describe("shapeDayBookings", () => {
  it("shows visitors blocking bookings only, all as Booked, in time order", () => {
    const out = shapeDayBookings(all, null, now);
    expect(out.map((b) => b.id)).toEqual(["own", "member", "walkin"]);
    expect(out.every((b) => b.label === "Booked")).toBe(true);
    expect(out.every((b) => b.status === null && b.note === null && b.walkInContact === null)).toBe(true);
  });

  it("shows members usernames, walk-ins as Booked, and status and note on their own only", () => {
    const out = shapeDayBookings(all, { id: "me", isAdmin: false }, now);
    expect(out.map((b) => [b.id, b.label, b.isOwn, b.status, b.note])).toEqual([
      ["own", "me", true, "PENDING", "Kill Team"],
      ["member", "orkboy", false, null, null],
      ["walkin", "Booked", false, null, null],
    ]);
  });

  it("shows admins every booking with names, statuses and walk-in contact", () => {
    const out = shapeDayBookings(all, { id: "admin", isAdmin: true }, now);
    expect(out.map((b) => b.id)).toEqual(["expired", "own", "member", "cancelled", "walkin"]);
    const w = out.find((b) => b.id === "walkin")!;
    expect([w.label, w.isWalkIn, w.walkInContact, w.status]).toEqual(["Bob", true, "+380…", "APPROVED"]);
    expect(out.find((b) => b.id === "expired")!.status).toBe("EXPIRED");
  });
});
