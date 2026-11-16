"use server";

import { revalidatePath } from "next/cache";
import { parseClubInfo, validateWorkingHours, type ClubInfo } from "@/entities/club/model";
import { updateClubInfo, updateDefaultHours } from "@/entities/club/repository";
import { getConfig } from "@/shared/config";
import { AuthError, requireAdmin } from "@/shared/lib/auth/session";

type Failure<F = never> = { ok: false; error: string; fieldErrors?: F };
export type ClubInfoResult = { ok: true } | Failure<Partial<Record<keyof ClubInfo, string>>>;
export type DefaultHoursResult = { ok: true } | Failure;

async function guard(): Promise<Failure | null> {
  try {
    await requireAdmin();
    return null;
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: e.message };
    throw e;
  }
}

export async function updateClubInfoAction(raw: unknown): Promise<ClubInfoResult> {
  const denied = await guard();
  if (denied) return denied;

  const parsed = parseClubInfo(raw);
  if (!parsed.ok)
    return { ok: false, error: "Check the highlighted fields.", fieldErrors: parsed.fieldErrors };

  await updateClubInfo(parsed.data);
  revalidatePath("/admin/settings");
  revalidatePath("/about");
  revalidatePath("/");
  return { ok: true };
}

export async function updateDefaultHoursAction(raw: unknown): Promise<DefaultHoursResult> {
  const denied = await guard();
  if (denied) return denied;

  const { slotStepMinutes, minBookingMinutes } = getConfig();
  const result = validateWorkingHours(raw, { slotStepMinutes, minBookingMinutes });
  if (!result.ok) return result;

  await updateDefaultHours(result.data);
  revalidatePath("/admin/settings");
  return { ok: true };
}
