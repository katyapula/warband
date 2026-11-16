"use client";

import { App, Button, Flex, Popconfirm, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { WorkingHours } from "@/entities/club/model";
import { HoursPicker } from "@/entities/club/ui/HoursPicker";
import {
  activateDayAction,
  deactivateDayAction,
  updateDayHoursAction,
  type ClubDayResult,
} from "./actions";

/**
 * Admin controls in the day header, for days from today to the end of the
 * window. Inactive day: hours + Activate. Active day: Edit hours, Deactivate.
 */
export function ClubDayControls({
  date,
  isActive,
  hours,
  slotStepMinutes,
}: {
  date: string;
  isActive: boolean;
  /** The day's hours if it has any (also kept when deactivated), else the club defaults. */
  hours: WorkingHours;
  slotStepMinutes: number;
}) {
  const { message } = App.useApp();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(hours);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<ClubDayResult>, done: string) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      message.success(done);
      setEditing(false);
      router.refresh();
    });
  }

  const picker = (
    <HoursPicker
      value={draft}
      onChange={(next) => {
        setDraft(next);
        setError(null);
      }}
      slotStepMinutes={slotStepMinutes}
      invalid={Boolean(error)}
    />
  );
  const errorLine = error && (
    <Typography.Text type="danger" role="alert">
      {error}
    </Typography.Text>
  );

  if (!isActive) {
    return (
      <Flex vertical gap={8}>
        <Flex gap={12} align="center" wrap>
          {picker}
          <Button
            type="primary"
            loading={pending}
            onClick={() => run(() => activateDayAction({ date, ...draft }), "Day activated.")}
          >
            Activate
          </Button>
        </Flex>
        {errorLine}
      </Flex>
    );
  }

  if (editing) {
    return (
      <Flex vertical gap={8}>
        <Flex gap={12} align="center" wrap>
          {picker}
          <Button
            type="primary"
            loading={pending}
            onClick={() => run(() => updateDayHoursAction({ date, ...draft }), "Hours saved.")}
          >
            Save hours
          </Button>
          <Button
            disabled={pending}
            onClick={() => {
              setEditing(false);
              setDraft(hours);
              setError(null);
            }}
          >
            Cancel
          </Button>
        </Flex>
        {errorLine}
      </Flex>
    );
  }

  return (
    <Flex vertical gap={8}>
      <Flex gap={8} wrap>
        <Button onClick={() => setEditing(true)}>Edit hours</Button>
        <Popconfirm
          title="Deactivate this day?"
          description="Members can no longer book it. Existing bookings stay as they are."
          okText="Deactivate"
          okButtonProps={{ danger: true }}
          onConfirm={() => run(() => deactivateDayAction({ date }), "Day deactivated.")}
        >
          <Button danger loading={pending}>
            Deactivate
          </Button>
        </Popconfirm>
      </Flex>
      {errorLine}
    </Flex>
  );
}
