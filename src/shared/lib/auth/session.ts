import "server-only";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/shared/lib/prisma";
import { authOptions } from "./options";
import { isAdmin, type Role } from "./roles";

export class AuthError extends Error {
  constructor(public readonly reason: "unauthenticated" | "forbidden") {
    super(reason === "unauthenticated" ? "Please sign in first." : "Admins only.");
  }
}

export type Member = {
  id: string;
  email: string;
  username: string;
  image: string | null;
  role: Role;
};

/**
 * The signed-in member, read fresh from the database (once per request), or
 * null for a visitor. Role changes and profile edits apply on the next request.
 */
export const getMember = cache(async (): Promise<Member | null> => {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) return null;
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, username: true, image: true, role: true },
  });
});

/** For server actions that need a signed-in member. */
export async function requireMember(): Promise<Member> {
  const member = await getMember();
  if (!member) throw new AuthError("unauthenticated");
  return member;
}

/** For server actions that need an admin. */
export async function requireAdmin(): Promise<Member> {
  const member = await requireMember();
  if (!isAdmin(member.role)) throw new AuthError("forbidden");
  return member;
}

/** For pages: visitors go to sign-in and come back to `path`. */
export async function requireMemberPage(path: string): Promise<Member> {
  const member = await getMember();
  if (!member) redirect(`/signin?callbackUrl=${encodeURIComponent(path)}`);
  return member;
}

/** For admin pages: visitors go to sign-in, members go home. */
export async function requireAdminPage(path: string): Promise<Member> {
  const member = await requireMemberPage(path);
  if (!isAdmin(member.role)) redirect("/");
  return member;
}
