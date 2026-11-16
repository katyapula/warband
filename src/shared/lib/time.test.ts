import { describe, expect, it } from "vitest";
import { dateInZone } from "./time";

describe("dateInZone", () => {
  it("uses the club's calendar date, not UTC", () => {
    // 22:30 UTC on 14 Nov is already 15 Nov in Kyiv (UTC+2).
    expect(dateInZone("Europe/Kyiv", new Date("2026-11-14T22:30:00Z"))).toBe("2026-11-15");
    expect(dateInZone("UTC", new Date("2026-11-14T22:30:00Z"))).toBe("2026-11-14");
  });
});
