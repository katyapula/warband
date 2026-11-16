"use server";

import { revalidatePath } from "next/cache";
import { adminCommentSchema } from "@/entities/booking/adminInput";
import { reviewBooking, setAdminComment } from "@/entities/booking/repository";
import { AuthError, requireAdmin } from "@/shared/lib/auth/session";

export type ReviewResult = { ok: true } | { ok: false; error: string };

async function guard() {
  try {
    return await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return { ok: false as const, error: e.message };
    throw e;
  }
}

function comment(raw: unknown): { ok: true; value: string | null | undefined } | { ok: false; error: string } {
  if (raw === undefined) return { ok: true, value: undefined };
  const parsed = adminCommentSchema.safeParse(raw);
  return parsed.success ? { ok: true, value: parsed.data } : { ok: false, error: parsed.error.issues[0]!.message };
}

/** Approve or reject a pending booking that hasn't expired; optionally set the admin comment. */
export async function reviewBookingAction(input: {
  id?: unknown;
  decision?: unknown;
  adminComment?: unknown;
}): Promise<ReviewResult> {
  const admin = await guard();
  if ("ok" in admin) return admin;
  if (typeof input?.id !== "string" || (input.decision !== "APPROVED" && input.decision !== "REJECTED"))
    return { ok: false, error: "Booking not found." };
  const c = comment(input.adminComment);
  if (!c.ok) return c;

  const result = await reviewBooking({
    id: input.id,
    decision: input.decision,
    adminComment: c.value,
    actor: { id: admin.id, isAdmin: true },
    now: new Date(),
  });
  if (!result.ok)
    return {
      ok: false,
      error:
        result.errors[0] === "NOT_FOUND"
          ? "Booking not found."
          : "This booking isn't pending any more (it may have expired). Reload the page.",
    };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Sets or clears the admin comment on any booking, at any time. */
export async function setAdminCommentAction(input: { id?: unknown; adminComment?: unknown }): Promise<ReviewResult> {
  const admin = await guard();
  if ("ok" in admin) return admin;
  if (typeof input?.id !== "string") return { ok: false, error: "Booking not found." };
  const c = comment(input.adminComment ?? null);
  if (!c.ok) return c;
  if (!(await setAdminComment(input.id, c.value ?? null))) return { ok: false, error: "Booking not found." };
  revalidatePath("/", "layout");
  return { ok: true };
}
