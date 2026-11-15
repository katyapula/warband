import { describe, expect, it } from "vitest";
import { loadConfig } from "./index";

describe("loadConfig", () => {
  it("uses defaults when nothing is set", () => {
    expect(loadConfig({})).toEqual({
      clubTimeZone: "Europe/Kyiv",
      bookingWindowDays: 30,
      slotStepMinutes: 30,
      minBookingMinutes: 60,
      adminEmails: [],
    });
  });

  it("treats empty strings as unset", () => {
    expect(loadConfig({ CLUB_TIMEZONE: "", BOOKING_WINDOW_DAYS: " " }).clubTimeZone).toBe(
      "Europe/Kyiv",
    );
  });

  it("parses numbers and normalises admin emails", () => {
    const config = loadConfig({
      BOOKING_WINDOW_DAYS: "14",
      SLOT_STEP_MINUTES: "15",
      MIN_BOOKING_MINUTES: "45",
      ADMIN_EMAILS: " Alice@Example.com, ,bob@example.com ",
    });
    expect(config.bookingWindowDays).toBe(14);
    expect(config.slotStepMinutes).toBe(15);
    expect(config.minBookingMinutes).toBe(45);
    expect(config.adminEmails).toEqual(["alice@example.com", "bob@example.com"]);
  });

  it("rejects an unknown time zone", () => {
    expect(() => loadConfig({ CLUB_TIMEZONE: "Mars/Olympus" })).toThrow(/IANA/);
  });

  it("rejects non-positive numbers", () => {
    expect(() => loadConfig({ SLOT_STEP_MINUTES: "0" })).toThrow();
    expect(() => loadConfig({ BOOKING_WINDOW_DAYS: "abc" })).toThrow();
  });

  it("rejects a minimum duration that is not a multiple of the step", () => {
    expect(() => loadConfig({ SLOT_STEP_MINUTES: "30", MIN_BOOKING_MINUTES: "45" })).toThrow(
      /multiple/,
    );
  });
});
