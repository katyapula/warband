"use client";

import { App, Button, Flex } from "antd";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelBookingAction } from "@/features/cancel-booking/actions";
import { approveBookingAction, setAdminCommentAction } from "./actions";
import { CommentPrompt } from "./CommentPrompt";

type Prompt = "cancel" | "comment" | null;

/**
 * An admin's buttons on one booking row, without overlaps: Approve (pending),
 * Edit (open, not started; its modal holds the admin comment), Cancel (open,
 * not started; also how a pending booking is declined), and Comment only
 * where Edit isn't offered (past, cancelled, expired, completed).
 */
export function AdminBookingActions({
  booking,
  onEdit,
}: {
  booking: {
    id: string;
    time: string;
    label: string;
    adminComment: string | null;
    canApprove: boolean;
    canEdit: boolean;
    canCancel: boolean;
  };
  onEdit: () => void;
}) {
  const { message } = App.useApp();
  const router = useRouter();
  const [prompt, setPrompt] = useState<Prompt>(null);
  const [approving, startApprove] = useTransition();
  const who = `${booking.label}, ${booking.time}`;

  async function after<T extends { ok: boolean }>(
    result: T,
    done: string,
  ): Promise<T> {
    if (result.ok) {
      message.success(done);
      router.refresh();
    }
    return result;
  }

  return (
    <Flex gap={4} wrap style={{ marginLeft: "auto" }}>
      {booking.canApprove && (
        <Button
          size="small"
          type="primary"
          loading={approving}
          aria-label={`Approve ${who}`}
          onClick={() =>
            startApprove(async () => {
              const r = await approveBookingAction({ id: booking.id });
              if (!r.ok) message.error(r.error);
              else await after(r, "Booking approved.");
            })
          }
        >
          Approve
        </Button>
      )}
      {booking.canEdit && (
        <Button size="small" aria-label={`Edit ${who}`} onClick={onEdit}>
          Edit
        </Button>
      )}
      {booking.canCancel && (
        <Button
          size="small"
          danger
          type="text"
          aria-label={`Cancel ${who}`}
          onClick={() => setPrompt("cancel")}
        >
          Cancel
        </Button>
      )}
      {!booking.canEdit && (
        <Button
          size="small"
          type="text"
          aria-label={`Admin comment on ${who}`}
          onClick={() => setPrompt("comment")}
        >
          {booking.adminComment ? "Edit comment" : "Comment"}
        </Button>
      )}

      {prompt === "cancel" && (
        <CommentPrompt
          title="Cancel this booking?"
          description={`${who}. The table becomes free for others.`}
          okText="Cancel booking"
          danger
          initialComment={booking.adminComment}
          onClose={() => setPrompt(null)}
          onSubmit={async (adminComment) =>
            after(
              await cancelBookingAction({ id: booking.id, adminComment }),
              "Booking cancelled.",
            )
          }
        />
      )}
      {prompt === "comment" && (
        <CommentPrompt
          title="Admin comment"
          description={who}
          okText="Save"
          initialComment={booking.adminComment}
          onClose={() => setPrompt(null)}
          onSubmit={async (adminComment) =>
            after(
              await setAdminCommentAction({ id: booking.id, adminComment }),
              "Comment saved.",
            )
          }
        />
      )}
    </Flex>
  );
}
