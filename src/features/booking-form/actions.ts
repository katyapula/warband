"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createOwnBooking } from "@/entities/booking/repository";
import { BOOKING_NOTE_MAX as NOTE_MAX, bookingErrorMessage } from "@/entities/booking/rules";
import { getConfig } from "@/shared/config";
import { AuthError, requireMember } from "@/shared/lib/auth/session";
import { isAdmin } from "@/shared/lib/auth/roles";

const inputSchema = z.object({
  tableId: z.string().min(1),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  note: z
    .string()
    .trim()
    .max(NOTE_MAX, `Keep the note under ${NOTE_MAX} characters.`)
    .nullish()
    .transform((n) => n || null),
});

export type CreateBookingResult = { ok: true } | { ok: false; errors: string[] };

/** A member books a table for themselves; it starts pending (admins: approved). */
export async function createBookingAction(input: unknown): Promise<CreateBookingResult> {
  let member;
  try {
    member = await requireMember();
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, errors: [e.message] };
    throw e;
  }
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.issues.map((i) => i.message) };
  const { note, ...request } = parsed.data;

  const { clubTimeZone, bookingWindowDays, slotStepMinutes, minBookingMinutes } = getConfig();
  const config = { timeZone: clubTimeZone, bookingWindowDays, slotStepMinutes, minBookingMinutes };
  const result = await createOwnBooking({
    request,
    note,
    actor: { id: member.id, isAdmin: isAdmin(member.role) },
    now: new Date(),
    config,
  });
  if (!result.ok) return { ok: false, errors: result.errors.map((e) => bookingErrorMessage(e, config)) };

  revalidatePath("/");
  return { ok: true };
}
