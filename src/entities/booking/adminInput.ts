// What the admin Add / Edit modal sends, parsed on the server. Times are
// checked by ./rules; this only shapes and bounds the fields.
import { z } from "zod";
import { WALK_IN_CONTACT_MAX, WALK_IN_NAME_MAX } from "./booker";
import { BOOKING_NOTE_MAX } from "./rules";

export const ADMIN_COMMENT_MAX = 1000;

/** Trimmed text, empty → null, at most `max` characters. */
const optionalText = (max: number, what: string) =>
  z
    .string()
    .trim()
    .max(max, `${what} must be at most ${max} characters.`)
    .nullish()
    .transform((v) => v || null);

const walkInName = z
  .string()
  .trim()
  .min(1, "Enter the walk-in's name.")
  .max(WALK_IN_NAME_MAX, `Name must be at most ${WALK_IN_NAME_MAX} characters.`);
const walkInContact = optionalText(WALK_IN_CONTACT_MAX, "Contact");

export const adminCommentSchema = optionalText(ADMIN_COMMENT_MAX, "Admin comment");

const slot = {
  tableId: z.string().min(1, "Pick a table."),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  note: optionalText(BOOKING_NOTE_MAX, "Note"),
  adminComment: adminCommentSchema,
};

export const adminCreateSchema = z.object({
  ...slot,
  booker: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("member"), id: z.string().min(1) }),
    z.object({ kind: z.literal("walkIn"), name: walkInName, contact: walkInContact }),
  ]),
});
export type AdminCreateInput = z.infer<typeof adminCreateSchema>;

export const adminEditSchema = z.object({
  ...slot,
  id: z.string().min(1),
  /** Only for walk-in bookings; the member of a booking can't change. */
  walkIn: z.object({ name: walkInName, contact: walkInContact }).nullish(),
});
export type AdminEditInput = z.infer<typeof adminEditSchema>;
