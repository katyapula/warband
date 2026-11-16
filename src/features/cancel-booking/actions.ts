"use server";

import { revalidatePath } from "next/cache";
import { cancelBooking } from "@/entities/booking/repository";
import { AuthError, requireMember } from "@/shared/lib/auth/session";
import { isAdmin } from "@/shared/lib/auth/roles";

export type CancelBookingResult = { ok: true } | { ok: false; error: string };

/** Cancels the member's own pending/approved booking before it starts (admins: any). */
export async function cancelBookingAction(input: { id?: unknown }): Promise<CancelBookingResult> {
  let member;
  try {
    member = await requireMember();
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: e.message };
    throw e;
  }
  if (typeof input?.id !== "string") return { ok: false, error: "Booking not found." };

  const result = await cancelBooking({
    id: input.id,
    actor: { id: member.id, isAdmin: isAdmin(member.role) },
    now: new Date(),
  });
  if (!result.ok) {
    return {
      ok: false,
      error:
        result.error === "NOT_FOUND"
          ? "Booking not found."
          : "This booking can't be cancelled any more. Reload the page.",
    };
  }
  revalidatePath("/");
  return { ok: true };
}
