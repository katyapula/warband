import { describe, expect, it } from "vitest";
import { isAdmin, roleForEmail } from "./roles";

describe("roleForEmail", () => {
  const admins = ["admin@example.com"];

  it("gives Admin to listed emails, ignoring case and spaces", () => {
    expect(roleForEmail("admin@example.com", admins)).toBe("ADMIN");
    expect(roleForEmail("  Admin@Example.COM ", admins)).toBe("ADMIN");
  });

  it("gives User to everyone else", () => {
    expect(roleForEmail("member@example.com", admins)).toBe("USER");
    expect(roleForEmail("admin@example.com", [])).toBe("USER");
  });
});

describe("isAdmin", () => {
  it("is true only for ADMIN", () => {
    expect(isAdmin("ADMIN")).toBe(true);
    expect(isAdmin("USER")).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });
});
