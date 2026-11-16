import { describe, expect, it } from "vitest";
import { canChangeDay, landingDate, resolveDayParam, stripNav, viewableRange, weekOf } from "./calendar";

const today = "2026-11-18"; // a Wednesday
const windowDays = 30;
const lastDay = "2026-12-18";

describe("viewableRange", () => {
  it("runs from today to the end of the window for members and visitors", () => {
    expect(viewableRange({ today, windowDays, isAdmin: false })).toEqual({
      first: today,
      last: lastDay,
    });
  });

  it("has no start for admins, who can browse past days", () => {
    expect(viewableRange({ today, windowDays, isAdmin: true })).toEqual({
      first: null,
      last: lastDay,
    });
  });
});

describe("weekOf", () => {
  it("returns Monday to Sunday around the date", () => {
    expect(weekOf(today)).toEqual([
      "2026-11-16",
      "2026-11-17",
      "2026-11-18",
      "2026-11-19",
      "2026-11-20",
      "2026-11-21",
      "2026-11-22",
    ]);
  });

  it("treats Sunday as the end of its week", () => {
    expect(weekOf("2026-11-22")[0]).toBe("2026-11-16");
    expect(weekOf("2026-11-23")[0]).toBe("2026-11-23");
  });
});

describe("landingDate", () => {
  it("is today for admins", () => {
    expect(landingDate({ today, isAdmin: true, activeDates: ["2026-11-20"] })).toBe(today);
  });

  it("is the first active day for members and visitors", () => {
    expect(landingDate({ today, isAdmin: false, activeDates: ["2026-11-20", "2026-11-21"] })).toBe(
      "2026-11-20",
    );
  });

  it("is today when no day is active", () => {
    expect(landingDate({ today, isAdmin: false, activeDates: [] })).toBe(today);
  });
});

describe("resolveDayParam", () => {
  const range = { first: today, last: lastDay };

  it("uses the landing day when no date is given", () => {
    expect(resolveDayParam(undefined, range, "2026-11-20")).toEqual({
      ok: true,
      date: "2026-11-20",
    });
  });

  it("accepts a date inside the range", () => {
    expect(resolveDayParam("2026-12-18", range, today)).toEqual({ ok: true, date: "2026-12-18" });
  });

  it.each(["2026-11-17", "2026-12-19", "2026-02-30", "tomorrow", ["2026-11-20"]])(
    "rejects %s",
    (param) => {
      expect(resolveDayParam(param, range, today)).toEqual({ ok: false });
    },
  );

  it("lets admins open past days", () => {
    expect(resolveDayParam("2020-01-01", { first: null, last: lastDay }, today)).toEqual({
      ok: true,
      date: "2020-01-01",
    });
  });
});

describe("stripNav", () => {
  const member = { first: today, last: lastDay };

  it("has no ‹ in the first week for members", () => {
    expect(stripNav("2026-11-20", member).prev).toBeNull();
  });

  it("moves a week, clamped to the range", () => {
    expect(stripNav("2026-11-23", member).prev).toBe(today); // Monday-7 is before today
    expect(stripNav("2026-11-27", member).prev).toBe("2026-11-20");
    expect(stripNav("2026-12-10", member).next).toBe("2026-12-17");
    expect(stripNav("2026-12-13", member).next).toBe(lastDay); // +7 is past the window
  });

  it("has no › in the week holding the last day", () => {
    expect(stripNav("2026-12-15", member).next).toBeNull();
  });

  it("always has ‹ for admins", () => {
    expect(stripNav("2026-11-18", { first: null, last: lastDay }).prev).toBe("2026-11-11");
  });
});

describe("canChangeDay", () => {
  it("allows today through the end of the window", () => {
    expect(canChangeDay(today, today, windowDays)).toBe(true);
    expect(canChangeDay(lastDay, today, windowDays)).toBe(true);
  });

  it("refuses past days, days past the window and malformed dates", () => {
    expect(canChangeDay("2026-11-17", today, windowDays)).toBe(false);
    expect(canChangeDay("2026-12-19", today, windowDays)).toBe(false);
    expect(canChangeDay("2026-13-01", today, windowDays)).toBe(false);
  });
});
