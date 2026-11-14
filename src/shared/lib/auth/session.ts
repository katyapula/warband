import "server-only";
import { getServerSession } from "next-auth";
import { authOptions } from "./options";
import { isAdmin } from "./roles";

export class AuthError extends Error {
  constructor(public readonly reason: "unauthenticated" | "forbidden") {
    super(reason === "unauthenticated" ? "Please sign in first." : "Admins only.");
  }
}

/** The signed-in member, or null for a visitor. */
export async function getMember() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

/** For server actions that need a signed-in member. */
export async function requireMember() {
  const member = await getMember();
  if (!member) throw new AuthError("unauthenticated");
  return member;
}

/** For server actions that need an admin. Middleware also guards /admin pages. */
export async function requireAdmin() {
  const member = await requireMember();
  if (!isAdmin(member.role)) throw new AuthError("forbidden");
  return member;
}
