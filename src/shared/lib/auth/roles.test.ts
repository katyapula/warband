import { describe, expect, it } from "vitest";
import { isAdmin, isForcedAdmin, roleChangeError, roleOnSignIn } from "./roles";

const admins = ["boss@example.com"];

describe("isForcedAdmin", () => {
  it("matches ADMIN_EMAILS ignoring case and spaces", () => {
    expect(isForcedAdmin("  Boss@Example.COM ", admins)).toBe(true);
    expect(isForcedAdmin("member@example.com", admins)).toBe(false);
  });
});

describe("roleOnSignIn", () => {
  it("makes ADMIN_EMAILS admins, even if the database says member", () => {
    expect(roleOnSignIn("boss@example.com", admins, null)).toBe("ADMIN");
    expect(roleOnSignIn("boss@example.com", admins, "MEMBER")).toBe("ADMIN");
  });

  it("keeps the stored role for everyone else", () => {
    // A member promoted on the Members page stays admin after signing in again.
    expect(roleOnSignIn("promoted@example.com", admins, "ADMIN")).toBe("ADMIN");
    expect(roleOnSignIn("member@example.com", admins, "MEMBER")).toBe("MEMBER");
  });

  it("makes new accounts members", () => {
    expect(roleOnSignIn("new@example.com", admins, null)).toBe("MEMBER");
  });
});

describe("roleChangeError", () => {
  const actor = { id: "a1" };

  it("allows promoting and demoting other members", () => {
    expect(roleChangeError(actor, { id: "m1", email: "m@example.com" }, "ADMIN", admins)).toBeNull();
    expect(roleChangeError(actor, { id: "m1", email: "m@example.com" }, "MEMBER", admins)).toBeNull();
  });

  it("refuses changing your own role", () => {
    expect(roleChangeError(actor, { id: "a1", email: "a@example.com" }, "MEMBER", admins)).toBe(
      "You can't change your own role.",
    );
  });

  it("refuses demoting an ADMIN_EMAILS admin", () => {
    expect(
      roleChangeError(actor, { id: "b1", email: "Boss@example.com" }, "MEMBER", admins),
    ).toBe("This admin is set in ADMIN_EMAILS and can't be demoted.");
  });
});

describe("isAdmin", () => {
  it("is true only for ADMIN", () => {
    expect(isAdmin("ADMIN")).toBe(true);
    expect(isAdmin("MEMBER")).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });
});
