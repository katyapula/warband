"use server";

import { revalidatePath } from "next/cache";
import { adminCommentSchema } from "@/entities/booking/adminInput";
import { cancelBooking } from "@/entities/booking/repository";
import { AuthError, requireMember } from "@/shared/lib/auth/session";
import { isAdmin } from "@/shared/lib/auth/roles";

export type CancelBookingResult = { ok: true } | { ok: false; error: string };

/**
 * Cancels a pending/approved booking before it starts: members their own,
 * admins any (and may set the admin comment with it).
 */
export async function cancelBookingAction(input: {
  id?: unknown;
  adminComment?: unknown;
}): Promise<CancelBookingResult> {
  let member;
  try {
    member = await requireMember();
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: e.message };
    throw e;
  }
  if (typeof input?.id !== "string") return { ok: false, error: "Booking not found." };
  const admin = isAdmin(member.role);
  let adminComment: string | null | undefined;
  if (admin && input.adminComment !== undefined) {
    const parsed = adminCommentSchema.safeParse(input.adminComment);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]!.message };
    adminComment = parsed.data;
  }

  const result = await cancelBooking({
    id: input.id,
    actor: { id: member.id, isAdmin: admin },
    now: new Date(),
    adminComment,
  });
  if (!result.ok) {
    return {
      ok: false,
      error:
        result.errors[0] === "NOT_FOUND"
          ? "Booking not found."
          : "This booking can't be cancelled any more. Reload the page.",
    };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
