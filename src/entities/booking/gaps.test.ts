import { describe, expect, it } from "vitest";
import { endChoices, freeGaps, startChoices, type GapInput } from "./gaps";

// Kyiv is UTC+2 in November. Saturday 21 Nov 2026, open 12:00–20:00.
const config = { timeZone: "Europe/Kyiv", bookingWindowDays: 30, slotStepMinutes: 30, minBookingMinutes: 60 };
const kyiv = (date: string, time: string) => {
  const [h, m] = time.split(":").map(Number) as [number, number];
  const [y, mo, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, mo - 1, d, h - 2, m));
};
const booking = (from: string, to: string, status: "PENDING" | "APPROVED" | "CANCELLED" = "APPROVED") => ({
  status,
  startsAt: kyiv("2026-11-21", from),
  endsAt: to === "24:00" ? kyiv("2026-11-22", "00:00") : kyiv("2026-11-21", to),
});
const input = (over: Partial<GapInput> = {}): GapInput => ({
  date: "2026-11-21",
  hours: { openTime: "12:00", closeTime: "20:00" },
  bookings: [],
  now: kyiv("2026-11-20", "10:00"),
  config,
  ...over,
});
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const gapsOf = (i: GapInput) => freeGaps(i).map((g) => `${hhmm(g.start)}–${hhmm(g.end)}`);

describe("freeGaps", () => {
  it("is the whole of the working hours when the table has no bookings", () => {
    expect(gapsOf(input())).toEqual(["12:00–20:00"]);
  });

  it("leaves out blocking bookings", () => {
    const bookings = [booking("14:00", "16:00"), booking("18:00", "19:00", "PENDING")];
    expect(gapsOf(input({ bookings }))).toEqual(["12:00–14:00", "16:00–18:00", "19:00–20:00"]);
  });

  it("ignores bookings that don't block", () => {
    expect(gapsOf(input({ bookings: [booking("12:00", "20:00", "CANCELLED")] }))).toEqual(["12:00–20:00"]);
  });

  it("drops gaps shorter than the minimum duration", () => {
    const bookings = [booking("12:30", "16:00"), booking("16:30", "20:00")];
    expect(gapsOf(input({ bookings }))).toEqual([]);
  });

  it("merges overlapping bookings", () => {
    const bookings = [booking("13:00", "16:00"), booking("15:00", "17:00")];
    expect(gapsOf(input({ bookings }))).toEqual(["12:00–13:00", "17:00–20:00"]);
  });

  it("today: starts at the first step after now", () => {
    const today = { date: "2026-11-21", now: kyiv("2026-11-21", "14:10") };
    expect(gapsOf(input(today))).toEqual(["14:30–20:00"]);
    expect(gapsOf(input({ ...today, now: kyiv("2026-11-21", "14:00") }))).toEqual(["14:30–20:00"]);
    expect(gapsOf(input({ ...today, now: kyiv("2026-11-21", "19:01") }))).toEqual([]);
  });

  it("handles hours that end at midnight", () => {
    const hours = { openTime: "18:00", closeTime: "24:00" };
    expect(gapsOf(input({ hours, bookings: [booking("22:00", "24:00")] }))).toEqual(["18:00–22:00"]);
  });

  it("is empty for past days and days beyond the booking window", () => {
    expect(gapsOf(input({ now: kyiv("2026-11-22", "10:00") }))).toEqual([]);
    expect(gapsOf(input({ date: "2026-12-21" }))).toEqual([]);
  });
});

describe("startChoices / endChoices", () => {
  const gaps = [
    { start: 12 * 60, end: 14 * 60 },
    { start: 16 * 60, end: 18 * 60 + 30 },
  ];

  it("offers starts that leave room for the minimum duration", () => {
    expect(startChoices(gaps, config)).toEqual(["12:00", "12:30", "13:00", "16:00", "16:30", "17:00", "17:30"]);
  });

  it("offers ends after the minimum, up to the end of the start's gap", () => {
    expect(endChoices(gaps, "16:30", config)).toEqual(["17:30", "18:00", "18:30"]);
    expect(endChoices(gaps, "15:00", config)).toEqual([]);
  });
});
