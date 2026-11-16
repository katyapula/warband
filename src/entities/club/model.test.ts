import { describe, expect, it } from "vitest";
import { parseClubInfo, timeChoices, toMinutes, validateWorkingHours } from "./model";

const rules = { slotStepMinutes: 30, minBookingMinutes: 60 };

describe("parseClubInfo", () => {
  it("trims and defaults optional fields to empty", () => {
    expect(parseClubInfo({ name: "  Warband ", location: null })).toEqual({
      ok: true,
      data: { name: "Warband", location: "", description: "" },
    });
  });

  it("requires a name", () => {
    const r = parseClubInfo({ name: "   " });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.fieldErrors.name).toBe("Name is required.");
  });
});

describe("validateWorkingHours", () => {
  it("accepts hours on the step, closing up to midnight", () => {
    expect(validateWorkingHours({ openTime: "12:00", closeTime: "20:00" }, rules)).toEqual({
      ok: true,
      data: { openTime: "12:00", closeTime: "20:00" },
    });
    expect(validateWorkingHours({ openTime: "18:30", closeTime: "24:00" }, rules).ok).toBe(true);
  });

  it.each([
    [{ openTime: null, closeTime: "20:00" }, "Pick an opening and a closing time."],
    [{ openTime: "12:00" }, "Pick an opening and a closing time."],
    [{ openTime: "12:00", closeTime: "25:00" }, "Pick an opening and a closing time."],
    [{ openTime: "24:00", closeTime: "24:00" }, "Pick an opening and a closing time."],
    [{ openTime: "12:15", closeTime: "20:00" }, "Times must be on a 30-minute step."],
    [
      { openTime: "20:00", closeTime: "12:00" },
      "Closing must be after opening (midnight at the latest).",
    ],
    [{ openTime: "19:30", closeTime: "20:00" }, "Open for at least 60 minutes."],
    ["nonsense", "Pick an opening and a closing time."],
  ])("rejects %o", (raw, error) => {
    expect(validateWorkingHours(raw, rules)).toEqual({ ok: false, error });
  });
});

describe("time-of-day helpers", () => {
  it("reads HH:mm and midnight", () => {
    expect(toMinutes("09:30")).toBe(570);
    expect(toMinutes("24:00")).toBe(1440);
    expect(toMinutes("24:30")).toBeNull();
  });

  it("offers opening up to the last step and closing up to midnight", () => {
    const { open, close } = timeChoices(30);
    expect(open[0]).toBe("00:00");
    expect(open.at(-1)).toBe("23:30");
    expect(close[0]).toBe("00:30");
    expect(close.at(-1)).toBe("24:00");
  });
});
