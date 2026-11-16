import { describe, expect, it } from "vitest";
import {
  canCancel,
  canEdit,
  canReview,
  displayStatus,
  initialStatus,
  isBlocking,
  isOnInactiveDay,
  needsAttention,
  type StoredStatus,
} from "./status";

const KYIV = "Europe/Kyiv";
// Saturday 21 Nov 2026, 14:00–18:00 Kyiv (UTC+2).
const booking = (status: StoredStatus, userId: string | null = "m1") => ({
  status,
  userId,
  startsAt: new Date("2026-11-21T12:00:00Z"),
  endsAt: new Date("2026-11-21T16:00:00Z"),
});
const before = new Date("2026-11-21T11:59:00Z");
const during = new Date("2026-11-21T13:00:00Z");
const after = new Date("2026-11-21T16:00:00Z");

const member = { id: "m1", isAdmin: false };
const otherMember = { id: "m2", isAdmin: false };
const admin = { id: "a1", isAdmin: true };

describe("displayStatus", () => {
  it.each([
    ["PENDING", before, "PENDING"],
    ["PENDING", during, "EXPIRED"],
    ["APPROVED", during, "APPROVED"],
    ["APPROVED", after, "COMPLETED"],
    ["REJECTED", after, "REJECTED"],
    ["CANCELLED", after, "CANCELLED"],
  ] as const)("%s at %s → %s", (status, now, shown) => {
    expect(displayStatus(booking(status), now)).toBe(shown);
  });
});

describe("isBlocking", () => {
  it.each([
    ["PENDING", before, true],
    ["PENDING", during, false], // expired
    ["APPROVED", during, true],
    ["REJECTED", before, false],
    ["CANCELLED", before, false],
  ] as const)("%s at %s → %s", (status, now, blocking) => {
    expect(isBlocking(booking(status), now)).toBe(blocking);
  });
});

describe("isOnInactiveDay", () => {
  it("flags a blocking booking on a missing or deactivated day", () => {
    expect(isOnInactiveDay(booking("APPROVED"), null, before)).toBe(true);
    expect(isOnInactiveDay(booking("APPROVED"), { isActive: false }, before)).toBe(true);
    expect(isOnInactiveDay(booking("APPROVED"), { isActive: true }, before)).toBe(false);
  });

  it("never flags a booking that doesn't block", () => {
    expect(isOnInactiveDay(booking("CANCELLED"), null, before)).toBe(false);
    expect(isOnInactiveDay(booking("PENDING"), null, during)).toBe(false); // expired
  });
});

describe("needsAttention", () => {
  const active = { isActive: true };
  const inactive = { isActive: false };

  it("counts pending bookings that haven't expired", () => {
    expect(needsAttention(booking("PENDING"), active, before, KYIV)).toBe(true);
    expect(needsAttention(booking("PENDING"), active, during, KYIV)).toBe(false);
  });

  it("counts blocking bookings on an inactive day, from today onward", () => {
    expect(needsAttention(booking("APPROVED"), inactive, before, KYIV)).toBe(true);
    // Later the same day, after it ended: still today, still counts.
    expect(needsAttention(booking("APPROVED"), inactive, after, KYIV)).toBe(true);
    // The next day it's in the past.
    const nextDay = new Date("2026-11-22T08:00:00Z");
    expect(needsAttention(booking("APPROVED"), inactive, nextDay, KYIV)).toBe(false);
  });

  it("ignores approved bookings on active days", () => {
    expect(needsAttention(booking("APPROVED"), active, before, KYIV)).toBe(false);
  });
});

describe("initialStatus", () => {
  it("is Pending for members and Approved for admins", () => {
    expect(initialStatus(member)).toBe("PENDING");
    expect(initialStatus(admin)).toBe("APPROVED");
  });
});

describe("canCancel", () => {
  it("lets the owner or an admin cancel a pending/approved booking before it starts", () => {
    expect(canCancel(booking("PENDING"), member, before)).toBe(true);
    expect(canCancel(booking("APPROVED"), member, before)).toBe(true);
    expect(canCancel(booking("APPROVED"), admin, before)).toBe(true);
  });

  it("refuses other members, walk-in bookings for members, started and final bookings", () => {
    expect(canCancel(booking("APPROVED"), otherMember, before)).toBe(false);
    expect(canCancel(booking("APPROVED", null), member, before)).toBe(false);
    expect(canCancel(booking("APPROVED", null), admin, before)).toBe(true);
    expect(canCancel(booking("APPROVED"), admin, during)).toBe(false);
    expect(canCancel(booking("REJECTED"), admin, before)).toBe(false);
    expect(canCancel(booking("CANCELLED"), member, before)).toBe(false);
  });
});

describe("canEdit", () => {
  it("is admin-only, for pending/approved bookings before they start", () => {
    expect(canEdit(booking("PENDING"), admin, before)).toBe(true);
    expect(canEdit(booking("APPROVED"), admin, before)).toBe(true);
    expect(canEdit(booking("APPROVED"), member, before)).toBe(false); // even the owner
    expect(canEdit(booking("APPROVED"), admin, during)).toBe(false);
    expect(canEdit(booking("CANCELLED"), admin, before)).toBe(false);
  });
});

describe("canReview", () => {
  it("is admin-only, for pending bookings that haven't expired", () => {
    expect(canReview(booking("PENDING"), admin, before)).toBe(true);
    expect(canReview(booking("PENDING"), admin, during)).toBe(false);
    expect(canReview(booking("APPROVED"), admin, before)).toBe(false);
    expect(canReview(booking("PENDING"), member, before)).toBe(false);
  });
});
