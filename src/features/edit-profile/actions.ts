"use server";

import { revalidatePath } from "next/cache";
import { parseProfile, type Profile } from "@/entities/user/model";
import { isUsernameTaken, updateProfile } from "@/entities/user/repository";
import { AuthError, requireMember } from "@/shared/lib/auth/session";

export type ProfileResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof Profile, string>> };

export async function updateOwnProfileAction(raw: unknown): Promise<ProfileResult> {
  let memberId: string;
  try {
    memberId = (await requireMember()).id;
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: e.message };
    throw e;
  }

  const parsed = parseProfile(raw);
  if (!parsed.ok)
    return { ok: false, error: "Check the highlighted fields.", fieldErrors: parsed.fieldErrors };

  if (await isUsernameTaken(parsed.data.username, memberId)) {
    const error = "This username is taken.";
    return { ok: false, error, fieldErrors: { username: error } };
  }

  await updateProfile(memberId, parsed.data);
  revalidatePath("/", "layout"); // the header shows the username everywhere
  return { ok: true };
}
