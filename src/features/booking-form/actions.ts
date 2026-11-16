"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminCreateSchema, adminEditSchema } from "@/entities/booking/adminInput";
import type { Gap } from "@/entities/booking/gaps";
import { writeErrorMessage } from "@/entities/booking/messages";
import {
  createBooking,
  getTableAvailability,
  updateBooking,
  type WriteResult,
} from "@/entities/booking/repository";
import { BOOKING_NOTE_MAX, type BookingConfig } from "@/entities/booking/rules";
import { getConfig } from "@/shared/config";
import { AuthError, requireAdmin, requireMember, type Member } from "@/shared/lib/auth/session";
import { isAdmin } from "@/shared/lib/auth/roles";

export type BookingFormResult = { ok: true } | { ok: false; errors: string[] };

function bookingConfig(): BookingConfig {
  const { clubTimeZone, bookingWindowDays, slotStepMinutes, minBookingMinutes } = getConfig();
  return { timeZone: clubTimeZone, bookingWindowDays, slotStepMinutes, minBookingMinutes };
}

async function guard(admin: boolean): Promise<Member | { ok: false; errors: string[] }> {
  try {
    return admin ? await requireAdmin() : await requireMember();
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, errors: [e.message] };
    throw e;
  }
}

function done(result: WriteResult, config: BookingConfig): BookingFormResult {
  if (!result.ok) return { ok: false, errors: result.errors.map((e) => writeErrorMessage(e, config)) };
  revalidatePath("/", "layout"); // day view, My bookings and the Needs attention count
  return { ok: true };
}

const memberSchema = z.object({
  tableId: z.string().min(1),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  note: z
    .string()
    .trim()
    .max(BOOKING_NOTE_MAX, `Keep the note under ${BOOKING_NOTE_MAX} characters.`)
    .nullish()
    .transform((n) => n || null),
});

/** A member books a table for themselves; it starts pending. */
export async function createBookingAction(input: unknown): Promise<BookingFormResult> {
  const member = await guard(false);
  if ("ok" in member) return member;
  const parsed = memberSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.issues.map((i) => i.message) };
  const { note, ...request } = parsed.data;
  const config = bookingConfig();
  const result = await createBooking({
    request,
    note,
    booker: { userId: member.id },
    actor: { id: member.id, isAdmin: isAdmin(member.role) },
    now: new Date(),
    config,
  });
  return done(result, config);
}

/** Admin Add: for themselves, a member or a walk-in; approved from the start. */
export async function adminCreateBookingAction(input: unknown): Promise<BookingFormResult> {
  const admin = await guard(true);
  if ("ok" in admin) return admin;
  const parsed = adminCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.issues.map((i) => i.message) };
  const { note, adminComment, booker, ...request } = parsed.data;
  const config = bookingConfig();
  const result = await createBooking({
    request,
    note,
    adminComment,
    booker:
      booker.kind === "member"
        ? { userId: booker.id }
        : { walkInName: booker.name, walkInContact: booker.contact },
    actor: { id: admin.id, isAdmin: true },
    now: new Date(),
    config,
  });
  return done(result, config);
}

/** Admin Edit: keeps the status and the member. */
export async function adminUpdateBookingAction(input: unknown): Promise<BookingFormResult> {
  const admin = await guard(true);
  if ("ok" in admin) return admin;
  const parsed = adminEditSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.issues.map((i) => i.message) };
  const { id, note, adminComment, walkIn, ...request } = parsed.data;
  const config = bookingConfig();
  const result = await updateBooking({
    id,
    request,
    note,
    walkIn,
    adminComment,
    actor: { id: admin.id, isAdmin: true },
    now: new Date(),
    config,
  });
  return done(result, config);
}

export type Availability = { hours: { openTime: string; closeTime: string } | null; gaps: Gap[] };

/** Admin modal: hours and free gaps of a table on a date, leaving out the booking being edited. */
export async function tableAvailabilityAction(input: {
  tableId?: unknown;
  date?: unknown;
  ignoreId?: unknown;
}): Promise<Availability> {
  const admin = await guard(true);
  if ("ok" in admin || typeof input?.tableId !== "string" || typeof input?.date !== "string")
    return { hours: null, gaps: [] };
  return getTableAvailability({
    tableId: input.tableId,
    date: input.date,
    ignoreId: typeof input.ignoreId === "string" ? input.ignoreId : null,
    now: new Date(),
    config: bookingConfig(),
  });
}
