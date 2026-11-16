"use server";

import { revalidatePath } from "next/cache";
import { parseAdminProfile, type AdminProfile } from "@/entities/user/model";
import {
  findMemberIdentity,
  isUsernameTaken,
  setRole,
  updateProfile,
} from "@/entities/user/repository";
import { getConfig } from "@/shared/config";
import { roleChangeError, type Role } from "@/shared/lib/auth/roles";
import { AuthError, requireAdmin, type Member } from "@/shared/lib/auth/session";

export type MemberActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof AdminProfile, string>> };

const NOT_FOUND = "This member no longer exists. Reload the page.";

async function guard(): Promise<Member | { ok: false; error: string }> {
  try {
    return await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: e.message };
    throw e;
  }
}

function refresh() {
  revalidatePath("/admin/members");
  revalidatePath("/", "layout");
}

export async function updateMemberAction(id: string, raw: unknown): Promise<MemberActionResult> {
  const admin = await guard();
  if ("ok" in admin) return admin;

  const parsed = parseAdminProfile(raw);
  if (!parsed.ok)
    return { ok: false, error: "Check the highlighted fields.", fieldErrors: parsed.fieldErrors };

  if (await isUsernameTaken(parsed.data.username, id)) {
    const error = "This username is taken.";
    return { ok: false, error, fieldErrors: { username: error } };
  }

  if (!(await updateProfile(id, parsed.data))) return { ok: false, error: NOT_FOUND };
  refresh();
  return { ok: true };
}

export async function setMemberRoleAction(id: string, role: Role): Promise<MemberActionResult> {
  const admin = await guard();
  if ("ok" in admin) return admin;
  if (role !== "ADMIN" && role !== "MEMBER") return { ok: false, error: "Unknown role." };

  const target = await findMemberIdentity(id);
  if (!target) return { ok: false, error: NOT_FOUND };

  const error = roleChangeError(admin, target, role, getConfig().adminEmails);
  if (error) return { ok: false, error };

  await setRole(id, role);
  refresh();
  return { ok: true };
}
