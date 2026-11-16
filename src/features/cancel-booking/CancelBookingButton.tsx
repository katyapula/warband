"use client";

import { App, Button, Popconfirm } from "antd";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cancelBookingAction } from "./actions";

/** Cancel with a confirmation. The booking is kept, as Cancelled. */
export function CancelBookingButton({ bookingId, time }: { bookingId: string; time: string }) {
  const { message } = App.useApp();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Popconfirm
      title="Cancel this booking?"
      description={`${time}. The table becomes free for others.`}
      okText="Cancel booking"
      cancelText="Keep it"
      okButtonProps={{ danger: true }}
      onConfirm={() =>
        startTransition(async () => {
          const result = await cancelBookingAction({ id: bookingId });
          if (!result.ok) {
            message.error(result.error);
            return;
          }
          message.success("Booking cancelled.");
          router.refresh();
        })
      }
    >
      <Button size="small" danger loading={pending} aria-label={`Cancel booking ${time}`}>
        Cancel
      </Button>
    </Popconfirm>
  );
}
