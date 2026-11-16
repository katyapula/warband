import { describe, expect, it } from "vitest";
import {
  bookingErrorMessage,
  checkBooking,
  checkEdit,
  type BookingError,
  type RuleContext,
} from "./rules";

// Now: Friday 20 Nov 2026, 10:00 Kyiv (UTC+2). The request is for Saturday.
const ctx = (over: Partial<RuleContext> = {}): RuleContext => ({
  now: new Date("2026-11-20T08:00:00Z"),
  config: { timeZone: "Europe/Kyiv", bookingWindowDays: 30, slotStepMinutes: 30, minBookingMinutes: 60 },
  table: { id: "t1", isActive: true },
  clubDay: { isActive: true, openTime: "12:00", closeTime: "20:00" },
  existing: [],
  ...over,
});
const request = { tableId: "t1", date: "2026-11-21", startTime: "14:00", endTime: "18:00" };
const errorsOf = (r: ReturnType<typeof checkBooking>) => (r.ok ? [] : r.errors);

// Approved 18:00–20:00 Saturday on the same table.
const evening = {
  id: "b1",
  status: "APPROVED" as const,
  startsAt: new Date("2026-11-21T16:00:00Z"),
  endsAt: new Date("2026-11-21T18:00:00Z"),
};

describe("checkBooking", () => {
  it("accepts a valid request and returns its UTC range", () => {
    expect(checkBooking(request, ctx())).toEqual({
      ok: true,
      startsAt: new Date("2026-11-21T12:00:00Z"),
      endsAt: new Date("2026-11-21T16:00:00Z"),
    });
  });

  it("accepts the whole working day (what the Whole day button sends)", () => {
    expect(checkBooking({ ...request, startTime: "12:00", endTime: "20:00" }, ctx()).ok).toBe(true);
  });

  it.each<[string, object, Partial<RuleContext>, BookingError]>([
    ["missing table", {}, { table: null }, "TABLE_INACTIVE"],
    ["inactive table", {}, { table: { id: "t1", isActive: false } }, "TABLE_INACTIVE"],
    ["start in the past", { date: "2026-11-20", startTime: "09:00", endTime: "11:00" }, { clubDay: { isActive: true, openTime: "08:00", closeTime: "20:00" } }, "IN_PAST"],
    ["start exactly now", { date: "2026-11-20", startTime: "10:00", endTime: "12:00" }, { clubDay: { isActive: true, openTime: "08:00", closeTime: "20:00" } }, "IN_PAST"],
    ["date past the window", { date: "2026-12-21" }, {}, "OUTSIDE_WINDOW"],
    ["no club day", {}, { clubDay: null }, "DAY_INACTIVE"],
    ["deactivated day", {}, { clubDay: { isActive: false, openTime: "12:00", closeTime: "20:00" } }, "DAY_INACTIVE"],
    ["starts before opening", { startTime: "11:30" }, {}, "OUTSIDE_HOURS"],
    ["ends after closing", { endTime: "20:30" }, {}, "OUTSIDE_HOURS"],
    ["off the 30-minute step", { startTime: "14:15" }, {}, "OFF_STEP"],
    ["shorter than an hour", { endTime: "14:30" }, {}, "TOO_SHORT"],
    ["end before start", { startTime: "18:00", endTime: "14:00" }, {}, "END_BEFORE_START"],
    ["overlaps an approved booking", { endTime: "18:30" }, { existing: [evening] }, "OVERLAP"],
    ["malformed date", { date: "2026-02-30" }, {}, "BAD_INPUT"],
    ["malformed time", { endTime: "25:00" }, {}, "BAD_INPUT"],
  ])("rejects %s", (_, req, over, error) => {
    expect(errorsOf(checkBooking({ ...request, ...req }, ctx(over)))).toContain(error);
  });

  it("accepts the last day of the window", () => {
    expect(checkBooking({ ...request, date: "2026-12-20" }, ctx()).ok).toBe(true);
  });

  it("allows bookings that only touch an existing one", () => {
    expect(checkBooking(request, ctx({ existing: [evening] })).ok).toBe(true);
  });

  it("ignores bookings that don't block", () => {
    const overlapping = { ...evening, startsAt: new Date("2026-11-21T13:00:00Z") };
    for (const status of ["REJECTED", "CANCELLED"] as const) {
      expect(checkBooking(request, ctx({ existing: [{ ...overlapping, status }] })).ok).toBe(true);
    }
    // Pending that already expired: started before now.
    const expired = {
      id: "b2",
      status: "PENDING" as const,
      startsAt: new Date("2026-11-20T07:00:00Z"),
      endsAt: new Date("2026-11-20T09:00:00Z"),
    };
    const today = { date: "2026-11-20", startTime: "10:30", endTime: "12:00" };
    const openEarly = { clubDay: { isActive: true, openTime: "08:00", closeTime: "20:00" } };
    expect(checkBooking({ ...request, ...today }, ctx({ ...openEarly, existing: [expired] })).ok).toBe(true);
  });

  it("is blocked by a pending booking that hasn't expired", () => {
    const pending = { ...evening, status: "PENDING" as const };
    expect(errorsOf(checkBooking({ ...request, endTime: "18:30" }, ctx({ existing: [pending] })))).toEqual(["OVERLAP"]);
  });

  it("reports every broken rule, not just the first", () => {
    const r = checkBooking({ ...request, startTime: "11:15" }, ctx({ table: null }));
    expect(errorsOf(r)).toEqual(expect.arrayContaining(["TABLE_INACTIVE", "OUTSIDE_HOURS", "OFF_STEP"]));
  });

  it("doesn't report hours for an inactive day", () => {
    const r = checkBooking({ ...request, startTime: "08:00" }, ctx({ clubDay: null }));
    expect(errorsOf(r)).toEqual(["DAY_INACTIVE"]);
  });
});

describe("checkEdit", () => {
  // The booking being edited: Saturday 14:00–18:00 on t1.
  const current = {
    id: "b0",
    tableId: "t1",
    status: "APPROVED" as const,
    startsAt: new Date("2026-11-21T12:00:00Z"),
    endsAt: new Date("2026-11-21T16:00:00Z"),
  };

  it("skips the checks when table, date and time are unchanged", () => {
    // The day was deactivated after booking: a note-only edit must still go through.
    const r = checkEdit(current, request, ctx({ clubDay: null }));
    expect(r).toEqual({ ok: true, startsAt: current.startsAt, endsAt: current.endsAt });
  });

  it("runs every check when the time changes", () => {
    const r = checkEdit(current, { ...request, endTime: "19:00" }, ctx({ clubDay: null }));
    expect(errorsOf(r)).toEqual(["DAY_INACTIVE"]);
  });

  it("runs the checks when only the table changes", () => {
    const r = checkEdit(current, { ...request, tableId: "t2" }, ctx({ table: { id: "t2", isActive: false } }));
    expect(errorsOf(r)).toEqual(["TABLE_INACTIVE"]);
  });

  it("doesn't count the booking itself as an overlap", () => {
    const r = checkEdit(current, { ...request, endTime: "19:00" }, ctx({ existing: [current] }));
    expect(r.ok).toBe(true);
  });
});

describe("bookingErrorMessage", () => {
  it("states the configured step and minimum", () => {
    const config = ctx().config;
    expect(bookingErrorMessage("OFF_STEP", config)).toContain("30");
    expect(bookingErrorMessage("TOO_SHORT", config)).toContain("60");
  });
});
