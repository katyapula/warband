import { z } from "zod";

export const CLUB_NAME_MAX = 80;
export const CLUB_LOCATION_MAX = 200;
export const CLUB_DESCRIPTION_MAX = 2000;

type FieldErrors<T> = Partial<Record<keyof T, string>>;

function firstErrors<T>(issues: z.core.$ZodIssue[], fields: (keyof T)[]): FieldErrors<T> {
  const out: FieldErrors<T> = {};
  for (const issue of issues) {
    const field = issue.path[0] as keyof T;
    if (fields.includes(field) && !out[field]) out[field] = issue.message;
  }
  return out;
}

// ---------- Club info ----------

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, { error: `${label} must be at most ${max} characters.` })
    .nullish()
    .transform((v) => v ?? "");

export const clubInfoSchema = z.object({
  name: z
    .string({ error: "Name is required." })
    .trim()
    .min(1, { error: "Name is required." })
    .max(CLUB_NAME_MAX, { error: `Name must be at most ${CLUB_NAME_MAX} characters.` }),
  location: optionalText(CLUB_LOCATION_MAX, "Location"),
  description: optionalText(CLUB_DESCRIPTION_MAX, "Description"),
});

export type ClubInfo = z.infer<typeof clubInfoSchema>;

export function parseClubInfo(
  raw: unknown,
): { ok: true; data: ClubInfo } | { ok: false; fieldErrors: FieldErrors<ClubInfo> } {
  const result = clubInfoSchema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };
  return {
    ok: false,
    fieldErrors: firstErrors<ClubInfo>(result.error.issues, ["name", "location", "description"]),
  };
}

// ---------- Working hours ----------

/** A day's working hours. "HH:mm" in the club time zone; closing may be "24:00" (midnight). */
export type WorkingHours = { openTime: string; closeTime: string };

const TIME = /^([01]\d|2[0-3]):[0-5]\d$|^24:00$/;

/** "HH:mm" → minutes since midnight; null if malformed. "24:00" → 1440. */
export function toMinutes(time: string): number | null {
  if (!TIME.test(time)) return null;
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
}

/** Minutes since midnight → "HH:mm" (1440 → "24:00"). */
export function fromMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Times an admin can pick: opening 00:00 … last step, closing first step … 24:00. */
export function timeChoices(slotStepMinutes: number): { open: string[]; close: string[] } {
  const all: string[] = [];
  for (let m = 0; m <= 24 * 60; m += slotStepMinutes) all.push(fromMinutes(m));
  return { open: all.slice(0, -1), close: all.slice(1) };
}

export type HoursRules = { slotStepMinutes: number; minBookingMinutes: number };

const hoursInputSchema = z.object({
  openTime: z.string().nullish(),
  closeTime: z.string().nullish(),
});

/**
 * Checks one day's working hours (the club default, or an activated day):
 * times on the step, opening before closing, closing by midnight, and room
 * for at least one minimum-length booking.
 */
export function validateWorkingHours(
  raw: unknown,
  rules: HoursRules,
): { ok: true; data: WorkingHours } | { ok: false; error: string } {
  const parsed = hoursInputSchema.safeParse(raw);
  const open = parsed.success && parsed.data.openTime ? toMinutes(parsed.data.openTime) : null;
  const close = parsed.success && parsed.data.closeTime ? toMinutes(parsed.data.closeTime) : null;

  if (open === null || close === null || open === 24 * 60) {
    return { ok: false, error: "Pick an opening and a closing time." };
  }
  if (open % rules.slotStepMinutes || close % rules.slotStepMinutes) {
    return { ok: false, error: `Times must be on a ${rules.slotStepMinutes}-minute step.` };
  }
  if (close <= open) {
    return { ok: false, error: "Closing must be after opening (midnight at the latest)." };
  }
  if (close - open < rules.minBookingMinutes) {
    return { ok: false, error: `Open for at least ${rules.minBookingMinutes} minutes.` };
  }
  return { ok: true, data: { openTime: fromMinutes(open), closeTime: fromMinutes(close) } };
}
