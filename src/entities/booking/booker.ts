// Who an admin books for (docs/DOMAIN.md → "Booker autocomplete"): a member
// picked from the autocomplete or typed by username, otherwise a walk-in.
// Pure.

export type BookerOption = { id: string; username: string; fullName: string | null };

export type Booker = { kind: "member"; id: string } | { kind: "walkIn"; name: string; contact: string | null };

export const WALK_IN_NAME_MAX = 100;
export const WALK_IN_CONTACT_MAX = 100;

/** Members whose username or full name contains the text, usernames starting with it first. */
export function matchMembers(text: string, members: BookerOption[], limit = 8): BookerOption[] {
  const q = text.trim().toLowerCase();
  if (!q) return [];
  const rank = (m: BookerOption) => (m.username.toLowerCase().startsWith(q) ? 0 : 1);
  return members
    .filter((m) => m.username.toLowerCase().includes(q) || m.fullName?.toLowerCase().includes(q))
    .sort((a, b) => rank(a) - rank(b) || a.username.localeCompare(b.username))
    .slice(0, limit);
}

/** The picked member, else a member whose username is the typed text, else a walk-in. */
export function resolveBooker(
  input: { text: string; pickedId: string | null; contact: string },
  members: BookerOption[],
): Booker | null {
  if (input.pickedId && members.some((m) => m.id === input.pickedId)) return { kind: "member", id: input.pickedId };
  const name = input.text.trim();
  if (!name) return null;
  const match = members.find((m) => m.username.toLowerCase() === name.toLowerCase());
  if (match) return { kind: "member", id: match.id };
  return { kind: "walkIn", name, contact: input.contact.trim() || null };
}
