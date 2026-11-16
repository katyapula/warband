import { z } from "zod";

export const USERNAME_MIN = 2;
export const USERNAME_MAX = 30;
export const FULL_NAME_MAX = 100;
export const PHONE_MAX = 30;
export const ADMIN_NOTES_MAX = 2000;

const USERNAME_CHARS = /^[\p{L}\p{N} _.-]+$/u;
const NOT_USERNAME_CHARS = /[^\p{L}\p{N} _.-]/gu;
const TELEGRAM = /^[A-Za-z0-9_]{5,32}$/;
const PHONE = /^[0-9 +()-]+$/;

const collapse = (s: string) => s.replace(/\s+/g, " ").trim();

/** Empty or missing → null; otherwise trimmed. */
const optional = (inner: z.ZodString) =>
  z
    .string()
    .nullish()
    .transform((v) => v?.trim() || null)
    .pipe(inner.nullable());

const usernameSchema = z
  .string({ error: "Username is required." })
  .transform(collapse)
  .pipe(
    z
      .string()
      .min(1, { error: "Username is required." })
      .min(USERNAME_MIN, { error: `Username must be ${USERNAME_MIN}–${USERNAME_MAX} characters.` })
      .max(USERNAME_MAX, { error: `Username must be ${USERNAME_MIN}–${USERNAME_MAX} characters.` })
      .regex(USERNAME_CHARS, { error: "Use letters, digits, spaces and _ . - only." }),
  );

export const profileSchema = z.object({
  username: usernameSchema,
  fullName: optional(
    z.string().max(FULL_NAME_MAX, { error: `Full name must be at most ${FULL_NAME_MAX} characters.` }),
  ),
  phone: optional(
    z
      .string()
      .max(PHONE_MAX, { error: `Phone must be at most ${PHONE_MAX} characters.` })
      .regex(PHONE, { error: "Use digits, spaces and + - ( ) only." }),
  ),
  telegram: z
    .string()
    .nullish()
    .transform((v) => v?.trim().replace(/^@/, "") || null)
    .pipe(
      z
        .string()
        .regex(TELEGRAM, { error: "Telegram usernames are 5–32 letters, digits or _." })
        .nullable(),
    ),
});

export const adminProfileSchema = profileSchema.extend({
  adminNotes: optional(
    z.string().max(ADMIN_NOTES_MAX, {
      error: `Admin notes must be at most ${ADMIN_NOTES_MAX} characters.`,
    }),
  ),
});

/** What a member edits on /profile. Email is never editable. */
export type Profile = z.infer<typeof profileSchema>;
/** What an admin edits on the Members page. */
export type AdminProfile = z.infer<typeof adminProfileSchema>;

type Parsed<T> = { ok: true; data: T } | { ok: false; fieldErrors: Partial<Record<keyof T, string>> };

function parseWith<T>(schema: z.ZodType<T>, raw: unknown): Parsed<T> {
  const result = schema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };
  const fieldErrors: Partial<Record<keyof T, string>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof T;
    fieldErrors[field] ??= issue.message;
  }
  return { ok: false, fieldErrors };
}

export const parseProfile = (raw: unknown) => parseWith(profileSchema, raw);
export const parseAdminProfile = (raw: unknown) => parseWith(adminProfileSchema, raw);

/** Usernames are unique ignoring case and surrounding spaces. */
export function sameUsername(a: string, b: string): boolean {
  return collapse(a).toLocaleLowerCase() === collapse(b).toLocaleLowerCase();
}

/** Starting username for a new account: the Google name cleaned up, else the email's local part. */
export function usernameFromGoogle(googleName: string | null | undefined, email: string): string {
  for (const source of [googleName ?? "", email.split("@")[0] ?? ""]) {
    const cleaned = collapse(source.replace(NOT_USERNAME_CHARS, " ")).slice(0, USERNAME_MAX).trim();
    if (cleaned.length >= USERNAME_MIN) return cleaned;
  }
  return "member";
}

/** "Katya" + 2 → "Katya 2", trimming the base so the result stays within the maximum. */
export function withSuffix(base: string, n: number): string {
  const suffix = ` ${n}`;
  return base.slice(0, USERNAME_MAX - suffix.length).trimEnd() + suffix;
}
