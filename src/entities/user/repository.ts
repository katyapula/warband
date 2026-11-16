import "server-only";
import { Prisma } from "@/generated/prisma";
import { prisma } from "@/shared/lib/prisma";
import { roleOnSignIn, type Role } from "@/shared/lib/auth/roles";
import {
  FULL_NAME_MAX,
  sameUsername,
  usernameFromGoogle,
  withSuffix,
  type AdminProfile,
  type Profile,
} from "./model";

export type MemberRow = {
  id: string;
  email: string;
  username: string;
  fullName: string | null;
  phone: string | null;
  telegram: string | null;
  adminNotes: string | null;
  role: Role;
  createdAt: Date;
};

/** Everything except admin notes: what a member sees of their own profile. */
export type OwnProfile = Omit<MemberRow, "adminNotes" | "role" | "createdAt">;

const rowSelect = {
  id: true,
  email: true,
  username: true,
  fullName: true,
  phone: true,
  telegram: true,
  adminNotes: true,
  role: true,
  createdAt: true,
} as const;

/** All members, admins first, then by username. */
export function listMembers(): Promise<MemberRow[]> {
  return prisma.user.findMany({
    select: rowSelect,
    orderBy: [{ role: "desc" }, { username: "asc" }],
  });
}

/** Admins only: full profiles (with admin notes) of the given members. */
export function listMemberProfiles(ids: string[]): Promise<MemberRow[]> {
  if (ids.length === 0) return Promise.resolve([]);
  return prisma.user.findMany({ where: { id: { in: ids } }, select: rowSelect });
}

export function getOwnProfile(id: string): Promise<OwnProfile | null> {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, username: true, fullName: true, phone: true, telegram: true },
  });
}

export function findMemberIdentity(id: string): Promise<{ id: string; email: string } | null> {
  return prisma.user.findUnique({ where: { id }, select: { id: true, email: true } });
}

/** True if another member already has this username (ignoring case). */
export async function isUsernameTaken(username: string, exceptId?: string): Promise<boolean> {
  const all = await prisma.user.findMany({ select: { id: true, username: true } });
  return all.some((u) => u.id !== exceptId && sameUsername(u.username, username));
}

/** Returns false when the member doesn't exist. */
export async function updateProfile(id: string, data: Profile | AdminProfile): Promise<boolean> {
  const { count } = await prisma.user.updateMany({ where: { id }, data });
  return count > 0;
}

/** Returns false when the member doesn't exist. */
export async function setRole(id: string, role: Role): Promise<boolean> {
  const { count } = await prisma.user.updateMany({ where: { id }, data: { role } });
  return count > 0;
}

/**
 * Finds the member by email or creates one, and applies ADMIN_EMAILS.
 * Existing members keep their username and profile; only the Google photo updates.
 * Returns the member's id.
 */
export async function syncMemberOnSignIn(
  google: { email: string; name?: string | null; image?: string | null },
  adminEmails: readonly string[],
): Promise<string> {
  const email = google.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { image: google.image ?? null, role: roleOnSignIn(email, adminEmails, existing.role) },
    });
    return existing.id;
  }

  const base = usernameFromGoogle(google.name, email);
  // Two attempts: a parallel sign-in could take the same username in between.
  for (let attempt = 0; ; attempt++) {
    const taken = await prisma.user.findMany({ select: { username: true } });
    let username = base;
    for (let n = 2; taken.some((u) => sameUsername(u.username, username)); n++) {
      username = withSuffix(base, n);
    }
    try {
      const created = await prisma.user.create({
        data: {
          email,
          username,
          fullName: google.name?.trim().slice(0, FULL_NAME_MAX) || null,
          image: google.image ?? null,
          role: roleOnSignIn(email, adminEmails, null),
        },
        select: { id: true },
      });
      return created.id;
    } catch (e) {
      const clash = e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
      if (!clash || attempt > 0) throw e;
    }
  }
}
