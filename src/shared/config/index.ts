import { z } from "zod";

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const positiveInt = (fallback: number) =>
  z.coerce.number().int().positive().default(fallback);

const configSchema = z
  .object({
    CLUB_TIMEZONE: z
      .string()
      .default("Europe/Kyiv")
      .refine(isValidTimeZone, "CLUB_TIMEZONE must be an IANA time zone, e.g. Europe/Kyiv"),
    BOOKING_WINDOW_DAYS: positiveInt(30),
    SLOT_STEP_MINUTES: positiveInt(30),
    MIN_BOOKING_MINUTES: positiveInt(60),
    ADMIN_EMAILS: z.string().default(""),
  })
  .refine((c) => c.MIN_BOOKING_MINUTES % c.SLOT_STEP_MINUTES === 0, {
    message: "MIN_BOOKING_MINUTES must be a multiple of SLOT_STEP_MINUTES",
  });

export type AppConfig = {
  clubTimeZone: string;
  bookingWindowDays: number;
  slotStepMinutes: number;
  minBookingMinutes: number;
  adminEmails: string[];
};

/** Parses club rules from environment variables. Throws on invalid values. */
export function loadConfig(env: Record<string, string | undefined>): AppConfig {
  // Treat empty strings as "not set" so defaults apply.
  const cleaned = Object.fromEntries(
    Object.entries(env).filter(([, v]) => v !== undefined && v.trim() !== ""),
  );
  const parsed = configSchema.parse(cleaned);
  return {
    clubTimeZone: parsed.CLUB_TIMEZONE,
    bookingWindowDays: parsed.BOOKING_WINDOW_DAYS,
    slotStepMinutes: parsed.SLOT_STEP_MINUTES,
    minBookingMinutes: parsed.MIN_BOOKING_MINUTES,
    adminEmails: parsed.ADMIN_EMAILS.split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  };
}

let cached: AppConfig | undefined;

/** App config from `process.env`, parsed once on first use. */
export function getConfig(): AppConfig {
  cached ??= loadConfig(process.env);
  return cached;
}
