/** Matches the Prisma `Role` enum. */
export type Role = "MEMBER" | "ADMIN";

/** Emails in ADMIN_EMAILS are always admins: a recovery path. */
export function isForcedAdmin(email: string, adminEmails: readonly string[]): boolean {
  return adminEmails.includes(email.trim().toLowerCase());
}

/** Role after a Google sign-in: ADMIN_EMAILS → admin; otherwise keep the stored role (new → member). */
export function roleOnSignIn(
  email: string,
  adminEmails: readonly string[],
  storedRole: Role | null,
): Role {
  if (isForcedAdmin(email, adminEmails)) return "ADMIN";
  return storedRole ?? "MEMBER";
}

/** Why an admin can't give `target` the role `to`, or null if they can. */
export function roleChangeError(
  actor: { id: string },
  target: { id: string; email: string },
  to: Role,
  adminEmails: readonly string[],
): string | null {
  if (actor.id === target.id) return "You can't change your own role.";
  if (to !== "ADMIN" && isForcedAdmin(target.email, adminEmails))
    return "This admin is set in ADMIN_EMAILS and can't be demoted.";
  return null;
}

export function isAdmin(role: Role | undefined | null): boolean {
  return role === "ADMIN";
}
