"use server";

import { revalidatePath } from "next/cache";
import { canChangeDay } from "@/entities/club/calendar";
import { validateWorkingHours, type WorkingHours } from "@/entities/club/model";
import {
  activateClubDay,
  deactivateClubDay,
  updateClubDayHours,
} from "@/entities/club/repository";
import { getConfig } from "@/shared/config";
import { AuthError, requireAdmin } from "@/shared/lib/auth/session";
import { dateInZone } from "@/shared/lib/time";

export type ClubDayResult = { ok: true } | { ok: false; error: string };

/** Admin, and a date from today to the end of the booking window. */
async function guard(date: unknown): Promise<{ ok: true; date: string } | { ok: false; error: string }> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: e.message };
    throw e;
  }
  const { clubTimeZone, bookingWindowDays } = getConfig();
  const today = dateInZone(clubTimeZone);
  if (typeof date !== "string" || !canChangeDay(date, today, bookingWindowDays)) {
    return {
      ok: false,
      error: `Only days from today to ${bookingWindowDays} days ahead can be changed.`,
    };
  }
  return { ok: true, date };
}

function hours(raw: unknown): { ok: true; data: WorkingHours } | { ok: false; error: string } {
  const { slotStepMinutes, minBookingMinutes } = getConfig();
  return validateWorkingHours(raw, { slotStepMinutes, minBookingMinutes });
}

type DayInput = { date?: unknown; openTime?: unknown; closeTime?: unknown };

/** Opens a day for booking with the given hours. */
export async function activateDayAction(input: DayInput): Promise<ClubDayResult> {
  const day = await guard(input?.date);
  if (!day.ok) return day;
  const h = hours(input);
  if (!h.ok) return h;

  await activateClubDay(day.date, h.data);
  revalidatePath("/");
  return { ok: true };
}

/** Changes an active day's hours. Bookings are never changed (docs/adr/0002). */
export async function updateDayHoursAction(input: DayInput): Promise<ClubDayResult> {
  const day = await guard(input?.date);
  if (!day.ok) return day;
  const h = hours(input);
  if (!h.ok) return h;

  if (!(await updateClubDayHours(day.date, h.data)))
    return { ok: false, error: "This day isn't active any more. Reload the page." };
  revalidatePath("/");
  return { ok: true };
}

/** Closes a day for booking; keeps its hours and never changes bookings. */
export async function deactivateDayAction(input: { date?: unknown }): Promise<ClubDayResult> {
  const day = await guard(input?.date);
  if (!day.ok) return day;

  if (!(await deactivateClubDay(day.date)))
    return { ok: false, error: "This day is already inactive. Reload the page." };
  revalidatePath("/");
  return { ok: true };
}
