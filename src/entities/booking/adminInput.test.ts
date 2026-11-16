import { describe, expect, it } from "vitest";
import { adminCreateSchema, adminEditSchema } from "./adminInput";

const slot = { tableId: "t1", date: "2026-11-21", startTime: "12:00", endTime: "14:00" };

describe("adminCreateSchema", () => {
  it("trims text and turns empty text into null", () => {
    const r = adminCreateSchema.parse({
      ...slot,
      note: "  ",
      adminComment: " ok ",
      booker: { kind: "walkIn", name: " Bob ", contact: "" },
    });
    expect(r).toMatchObject({ note: null, adminComment: "ok", booker: { kind: "walkIn", name: "Bob", contact: null } });
  });

  it("needs a walk-in name and a member id", () => {
    expect(adminCreateSchema.safeParse({ ...slot, booker: { kind: "walkIn", name: " " } }).success).toBe(false);
    expect(adminCreateSchema.safeParse({ ...slot, booker: { kind: "member", id: "" } }).success).toBe(false);
    expect(adminCreateSchema.safeParse({ ...slot, booker: { kind: "member", id: "u1" } }).success).toBe(true);
  });

  it("bounds the note", () => {
    const r = adminCreateSchema.safeParse({ ...slot, note: "x".repeat(501), booker: { kind: "member", id: "u1" } });
    expect(r.success).toBe(false);
  });
});

describe("adminEditSchema", () => {
  it("takes walk-in details only as an optional block", () => {
    expect(adminEditSchema.parse({ ...slot, id: "b1" }).walkIn).toBeUndefined();
    expect(adminEditSchema.parse({ ...slot, id: "b1", walkIn: { name: "Bob", contact: " 050 " } }).walkIn).toEqual({
      name: "Bob",
      contact: "050",
    });
  });
});
