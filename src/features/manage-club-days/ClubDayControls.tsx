"use client";

import { App, Button, Flex, Modal, Popconfirm, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { WorkingHours } from "@/entities/club/model";
import { HoursPicker } from "@/entities/club/ui/HoursPicker";
import type { HoursConflict } from "@/entities/booking/repository";
import {
  activateDayAction,
  deactivateDayAction,
  hoursConflictsAction,
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
  /** Bookings the new hours would leave outside; non-null while confirming. */
  const [conflicts, setConflicts] = useState<HoursConflict[] | null>(null);

  /** Save hours: if bookings would fall outside the new hours, confirm first. */
  function saveHours() {
    setError(null);
    startTransition(async () => {
      const check = await hoursConflictsAction({ date, ...draft });
      if (!check.ok) return setError(check.error);
      if (check.conflicts.length) return setConflicts(check.conflicts);
      run(() => updateDayHoursAction({ date, ...draft }), "Hours saved.");
    });
  }

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
            onClick={saveHours}
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
        <Modal
          open={conflicts !== null}
          title="Some bookings fall outside the new hours"
          okText="Save hours anyway"
          onOk={() => {
            setConflicts(null);
            run(() => updateDayHoursAction({ date, ...draft }), "Hours saved.");
          }}
          onCancel={() => setConflicts(null)}
        >
          <Typography.Paragraph>
            New hours {draft.openTime}–{draft.closeTime}. These bookings stay as they are; edit or cancel them
            afterwards if needed:
          </Typography.Paragraph>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {conflicts?.map((c) => (
              <li key={c.id}>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{c.time}</span> · {c.tableName} · {c.booker}
              </li>
            ))}
          </ul>
        </Modal>
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
