import { describe, expect, it } from "vitest";
import { attentionSummary, pendingCountsByDate } from "./attention";
import type { StoredStatus } from "./status";

const KYIV = "Europe/Kyiv";
// Now: Friday 20 Nov 2026, 15:00 Kyiv (UTC+2).
const now = new Date("2026-11-20T13:00:00Z");
const b = (date: string, hour: number, status: StoredStatus = "PENDING") => ({
  status,
  startsAt: new Date(`${date}T${String(hour - 2).padStart(2, "0")}:00:00Z`),
  endsAt: new Date(`${date}T${String(hour).padStart(2, "0")}:00:00Z`),
});
const active = { isActive: true };

describe("attentionSummary", () => {
  it("counts pending and blocking-on-inactive-day bookings once each, and finds the next day", () => {
    const days = new Map([
      ["2026-11-20", active],
      ["2026-11-22", active],
      ["2026-11-24", { isActive: false }],
    ]);
    const bookings = [
      b("2026-11-22", 12), // pending
      b("2026-11-22", 16, "APPROVED"), // fine
      b("2026-11-24", 12, "APPROVED"), // on inactive day
      b("2026-11-24", 16), // pending AND on inactive day: once
      b("2026-11-25", 12, "APPROVED"), // no ClubDay: inactive
      b("2026-11-21", 12, "CANCELLED"), // not blocking
      b("2026-11-20", 14), // expired
    ];
    expect(attentionSummary(bookings, days, now, KYIV)).toEqual({ count: 4, nextDate: "2026-11-22" });
  });

  it("is zero with no next day when nothing needs attention", () => {
    expect(attentionSummary([b("2026-11-22", 12, "APPROVED")], new Map([["2026-11-22", active]]), now, KYIV)).toEqual({
      count: 0,
      nextDate: null,
    });
  });
});

describe("pendingCountsByDate", () => {
  it("counts pending bookings that haven't expired, per club-local date", () => {
    const counts = pendingCountsByDate(
      [b("2026-11-22", 12), b("2026-11-22", 16), b("2026-11-23", 12, "APPROVED"), b("2026-11-20", 14)],
      now,
      KYIV,
    );
    expect([...counts]).toEqual([["2026-11-22", 2]]);
  });
});
