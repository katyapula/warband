import { describe, expect, it } from "vitest";
import {
  addDays,
  dateInZone,
  fromMinutes,
  localTimeToUtc,
  timeRangeInZone,
  toMinutes,
  utcRangeOfDate,
} from "./time";

const KYIV = "Europe/Kyiv";

describe("dateInZone", () => {
  it("uses the club's calendar date, not UTC", () => {
    // 22:30 UTC on 14 Nov is already 15 Nov in Kyiv (UTC+2).
    expect(dateInZone(KYIV, new Date("2026-11-14T22:30:00Z"))).toBe("2026-11-15");
    expect(dateInZone("UTC", new Date("2026-11-14T22:30:00Z"))).toBe("2026-11-14");
  });
});

describe("localTimeToUtc", () => {
  it("applies winter (UTC+2) and summer (UTC+3) offsets", () => {
    expect(localTimeToUtc("2026-11-20", "12:00", KYIV).toISOString()).toBe(
      "2026-11-20T10:00:00.000Z",
    );
    expect(localTimeToUtc("2026-07-01", "12:00", KYIV).toISOString()).toBe(
      "2026-07-01T09:00:00.000Z",
    );
  });

  it("reads 24:00 as the next local midnight", () => {
    expect(localTimeToUtc("2026-11-20", "24:00", KYIV).toISOString()).toBe(
      "2026-11-20T22:00:00.000Z",
    );
  });

  it("uses the offset in force at that time on DST change days", () => {
    // 29 Mar 2026: clocks go 03:00 → 04:00. 12:00 is already summer time.
    expect(localTimeToUtc("2026-03-29", "12:00", KYIV).toISOString()).toBe(
      "2026-03-29T09:00:00.000Z",
    );
    // 25 Oct 2026: clocks go 04:00 → 03:00. 12:00 is already winter time.
    expect(localTimeToUtc("2026-10-25", "12:00", KYIV).toISOString()).toBe(
      "2026-10-25T10:00:00.000Z",
    );
  });
});

describe("utcRangeOfDate", () => {
  it("spans local midnight to the next local midnight", () => {
    const { start, end } = utcRangeOfDate("2026-11-20", KYIV);
    expect(start.toISOString()).toBe("2026-11-19T22:00:00.000Z");
    expect(end.toISOString()).toBe("2026-11-20T22:00:00.000Z");
  });

  it("is 23 hours on the spring change and 25 on the autumn one", () => {
    const spring = utcRangeOfDate("2026-03-29", KYIV);
    expect(spring.start.toISOString()).toBe("2026-03-28T22:00:00.000Z");
    expect(spring.end.toISOString()).toBe("2026-03-29T21:00:00.000Z");
    const autumn = utcRangeOfDate("2026-10-25", KYIV);
    expect(autumn.start.toISOString()).toBe("2026-10-24T21:00:00.000Z");
    expect(autumn.end.toISOString()).toBe("2026-10-25T22:00:00.000Z");
  });
});

describe("addDays", () => {
  it("moves across month and year ends", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-11-16", 30)).toBe("2026-12-16");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("toMinutes / fromMinutes", () => {
  it("reads HH:mm and midnight, rejects malformed times", () => {
    expect(toMinutes("09:30")).toBe(570);
    expect(toMinutes("24:00")).toBe(1440);
    expect(toMinutes("24:30")).toBeNull();
    expect(toMinutes("9:30")).toBeNull();
  });

  it("writes minutes back as HH:mm", () => {
    expect(fromMinutes(570)).toBe("09:30");
    expect(fromMinutes(1440)).toBe("24:00");
  });
});

describe("timeRangeInZone", () => {
  it("shows club-local times", () => {
    expect(
      timeRangeInZone(new Date("2026-11-20T10:00:00Z"), new Date("2026-11-20T12:30:00Z"), KYIV),
    ).toBe("12:00–14:30");
  });

  it("shows an end at the next local midnight as 24:00", () => {
    expect(
      timeRangeInZone(new Date("2026-11-20T20:00:00Z"), new Date("2026-11-20T22:00:00Z"), KYIV),
    ).toBe("22:00–24:00");
  });
});
