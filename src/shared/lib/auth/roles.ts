export type Role = "USER" | "ADMIN";

/** Role a member gets at sign-in: Admin if their email is in ADMIN_EMAILS. */
export function roleForEmail(email: string, adminEmails: readonly string[]): Role {
  return adminEmails.includes(email.trim().toLowerCase()) ? "ADMIN" : "USER";
}

export function isAdmin(role: Role | undefined | null): boolean {
  return role === "ADMIN";
}
