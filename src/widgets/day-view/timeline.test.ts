import { describe, expect, it } from "vitest";
import { hourTicks, segmentKind, toMinutes, timelineSegments } from "./timeline";

describe("toMinutes", () => {
  it("parses HH:MM", () => expect(toMinutes("13:30")).toBe(810));
  it("treats a 00:00 close as midnight at the end of the day", () => expect(toMinutes("00:00", true)).toBe(1440));
  it("keeps 00:00 as start of day when not a close", () => expect(toMinutes("00:00")).toBe(0));
});

describe("segmentKind", () => {
  it("pending → pending", () => expect(segmentKind("PENDING")).toBe("pending"));
  it("approved and completed → approved", () => {
    expect(segmentKind("APPROVED")).toBe("approved");
    expect(segmentKind("COMPLETED")).toBe("approved");
  });
  it("hidden status → taken", () => expect(segmentKind(null)).toBe("taken"));
});

describe("timelineSegments", () => {
  const hours = { openTime: "12:00", closeTime: "20:00" }; // 480 min
  it("places bookings as percentages of the day", () => {
    const [s] = timelineSegments(hours, [{ startTime: "14:00", endTime: "16:00", status: "APPROVED" }]);
    expect(s).toMatchObject({ left: 25, width: 25, kind: "approved" });
  });
  it("clips bookings that fall outside the hours", () => {
    const segs = timelineSegments(hours, [
      { startTime: "10:00", endTime: "13:00", status: null },
      { startTime: "19:00", endTime: "21:00", status: "PENDING" },
      { startTime: "08:00", endTime: "09:00", status: null },
    ]);
    expect(segs).toEqual([
      expect.objectContaining({ left: 0, width: 12.5 }),
      expect.objectContaining({ left: 87.5, width: 12.5 }),
    ]);
  });
});

describe("hourTicks", () => {
  it("labels every hour on a short day", () => {
    expect(hourTicks({ openTime: "12:00", closeTime: "16:00" }).map((t) => t.label)).toEqual(["12", "13", "14", "15", "16"]);
  });
  it("labels every second hour on a long day", () => {
    expect(hourTicks({ openTime: "10:00", closeTime: "22:00" }).map((t) => t.label)).toEqual([
      "10", "12", "14", "16", "18", "20", "22",
    ]);
  });
  it("starts at the first whole hour", () => {
    expect(hourTicks({ openTime: "11:30", closeTime: "14:00" })[0]).toMatchObject({ label: "12", left: 20 });
  });
});

describe("timelineSegments skips", () => {
  it("cancelled and expired bookings", () => {
    const hours = { openTime: "12:00", closeTime: "20:00" };
    expect(
      timelineSegments(hours, [
        { startTime: "12:00", endTime: "13:00", status: "CANCELLED" as const },
        { startTime: "13:00", endTime: "14:00", status: "EXPIRED" as const },
      ]),
    ).toEqual([]);
  });
});
