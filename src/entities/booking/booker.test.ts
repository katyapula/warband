import { describe, expect, it } from "vitest";
import { matchMembers, resolveBooker, type BookerOption } from "./booker";

const members: BookerOption[] = [
  { id: "1", username: "orkboy", fullName: "Taras Shevchenko" },
  { id: "2", username: "Katya", fullName: null },
  { id: "3", username: "eldar", fullName: "Olena Orlova" },
];

describe("matchMembers", () => {
  it("finds members by username or full name, ignoring case, usernames starting with the text first", () => {
    expect(matchMembers("or", members).map((m) => m.id)).toEqual(["1", "3"]);
    expect(matchMembers("KAT", members).map((m) => m.id)).toEqual(["2"]);
    expect(matchMembers("  ", members)).toEqual([]);
  });
});

describe("resolveBooker", () => {
  it("uses the picked member", () => {
    expect(resolveBooker({ text: "orkboy", pickedId: "1", contact: "" }, members)).toEqual({ kind: "member", id: "1" });
  });

  it("links a typed username to its member, ignoring case", () => {
    expect(resolveBooker({ text: " katya ", pickedId: null, contact: "x" }, members)).toEqual({ kind: "member", id: "2" });
  });

  it("makes a walk-in from a name that matches no member", () => {
    expect(resolveBooker({ text: " Bob ", pickedId: null, contact: " +380 50 " }, members)).toEqual({
      kind: "walkIn",
      name: "Bob",
      contact: "+380 50",
    });
    expect(resolveBooker({ text: "Bob", pickedId: null, contact: "" }, members)).toEqual({
      kind: "walkIn",
      name: "Bob",
      contact: null,
    });
  });

  it("is null when nothing is typed", () => {
    expect(resolveBooker({ text: "  ", pickedId: null, contact: "" }, members)).toBeNull();
  });
});
