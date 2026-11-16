import { describe, expect, it } from "vitest";
import { parseTableInput, sameTableName, TABLE_DESCRIPTION_MAX, TABLE_NAME_MAX } from "./model";

describe("parseTableInput", () => {
  it("trims the name and description", () => {
    expect(parseTableInput({ name: "  Table 1 ", description: " 6x4 " })).toEqual({
      ok: true,
      data: { name: "Table 1", description: "6x4" },
    });
  });

  it("treats a missing or blank description as none", () => {
    expect(parseTableInput({ name: "A" })).toEqual({
      ok: true,
      data: { name: "A", description: null },
    });
    expect(parseTableInput({ name: "A", description: "   " })).toEqual({
      ok: true,
      data: { name: "A", description: null },
    });
    expect(parseTableInput({ name: "A", description: null })).toEqual({
      ok: true,
      data: { name: "A", description: null },
    });
  });

  it("requires a name", () => {
    for (const raw of [{}, { name: "" }, { name: "   " }]) {
      const result = parseTableInput(raw);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.fieldErrors.name).toBe("Name is required.");
    }
  });

  it("limits name and description length", () => {
    const result = parseTableInput({
      name: "x".repeat(TABLE_NAME_MAX + 1),
      description: "y".repeat(TABLE_DESCRIPTION_MAX + 1),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.name).toMatch(/at most/);
      expect(result.fieldErrors.description).toMatch(/at most/);
    }
  });

  it("accepts names at the length limit", () => {
    expect(parseTableInput({ name: "x".repeat(TABLE_NAME_MAX) }).ok).toBe(true);
  });
});

describe("sameTableName", () => {
  it("ignores case and surrounding spaces", () => {
    expect(sameTableName("Table 1", "  table 1 ")).toBe(true);
    expect(sameTableName("Table 1", "Table 2")).toBe(false);
  });
});
