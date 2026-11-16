import { describe, expect, it } from "vitest";
import {
  parseAdminProfile,
  parseProfile,
  sameUsername,
  usernameFromGoogle,
  withSuffix,
} from "./model";

const valid = { username: "Katya", fullName: "", phone: "", telegram: "" };
const fieldError = (raw: object, field: string) => {
  const r = parseProfile({ ...valid, ...raw });
  return r.ok ? undefined : r.fieldErrors[field as keyof typeof r.fieldErrors];
};

describe("parseProfile", () => {
  it("trims, collapses spaces in usernames and turns empty optional fields into null", () => {
    expect(
      parseProfile({ username: "  Katya   B ", fullName: " ", phone: "", telegram: null }),
    ).toEqual({
      ok: true,
      data: { username: "Katya B", fullName: null, phone: null, telegram: null },
    });
  });

  it("accepts Cyrillic usernames and the allowed punctuation", () => {
    expect(parseProfile({ ...valid, username: "Катя_b.2-x" }).ok).toBe(true);
  });

  it.each([
    ["", "Username is required."],
    ["K", "Username must be 2–30 characters."],
    ["x".repeat(31), "Username must be 2–30 characters."],
    ["Katya!", "Use letters, digits, spaces and _ . - only."],
  ])("rejects username %j", (username, message) => {
    expect(fieldError({ username }, "username")).toBe(message);
  });

  it("drops a leading @ from Telegram and checks Telegram's rules", () => {
    const r = parseProfile({ ...valid, telegram: " @katya_b " });
    expect(r.ok && r.data.telegram).toBe("katya_b");
    expect(fieldError({ telegram: "kat" }, "telegram")).toBe(
      "Telegram usernames are 5–32 letters, digits or _.",
    );
    expect(fieldError({ telegram: "katya-b" }, "telegram")).toBe(
      "Telegram usernames are 5–32 letters, digits or _.",
    );
  });

  it("accepts common phone formats and rejects letters", () => {
    expect(parseProfile({ ...valid, phone: "+380 (67) 123-45-67" }).ok).toBe(true);
    expect(fieldError({ phone: "call me" }, "phone")).toBe(
      "Use digits, spaces and + - ( ) only.",
    );
  });

  it("ignores admin notes sent by a member", () => {
    const r = parseProfile({ ...valid, adminNotes: "sneaky" });
    expect(r.ok && "adminNotes" in r.data).toBe(false);
  });
});

describe("parseAdminProfile", () => {
  it("adds admin notes", () => {
    const r = parseAdminProfile({ ...valid, adminNotes: "  Pays monthly " });
    expect(r.ok && r.data.adminNotes).toBe("Pays monthly");
  });
});

describe("sameUsername", () => {
  it("ignores case and surrounding spaces", () => {
    expect(sameUsername(" katya ", "KATYA")).toBe(true);
    expect(sameUsername("Катя", "катя")).toBe(true);
    expect(sameUsername("Katya", "Katya B")).toBe(false);
  });
});

describe("usernameFromGoogle", () => {
  it("uses the Google name, cleaned to the username rules", () => {
    expect(usernameFromGoogle("Katya Barinova", "k@example.com")).toBe("Katya Barinova");
    expect(usernameFromGoogle("Katya (Warband) 🎲", "k@example.com")).toBe("Katya Warband");
    expect(usernameFromGoogle("x".repeat(40), "k@example.com")).toBe("x".repeat(30));
  });

  it("falls back to the email's local part, then to 'member'", () => {
    expect(usernameFromGoogle(null, "katya.b@example.com")).toBe("katya.b");
    expect(usernameFromGoogle("🎲", "k@example.com")).toBe("member");
  });
});

describe("withSuffix", () => {
  it("appends a number and stays within 30 characters", () => {
    expect(withSuffix("Katya", 2)).toBe("Katya 2");
    expect(withSuffix("x".repeat(30), 12)).toBe(`${"x".repeat(27)} 12`);
  });
});
