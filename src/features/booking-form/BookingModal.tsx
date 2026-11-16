"use client";

import { Alert, App, Button, Flex, Form, Input, Modal, Select, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { endChoices, startChoices, type Gap, type SlotRules } from "@/entities/booking/gaps";
import { BOOKING_NOTE_MAX } from "@/entities/booking/rules";
import { fromMinutes, toMinutes } from "@/shared/lib/time";
import { createBookingAction } from "./actions";

const label = (t: string) => (t === "24:00" ? "24:00 (midnight)" : t);
const options = (times: string[]) => times.map((t) => ({ value: t, label: label(t) }));

/**
 * The member's Add modal for one table on one day: start and end (only free
 * times are offered), Whole day, and a note. The booking starts pending.
 */
export function BookingModal({
  open,
  onClose,
  table,
  date,
  dateLabel,
  hours,
  gaps,
  rules,
}: {
  open: boolean;
  onClose: () => void;
  table: { id: string; name: string };
  date: string;
  dateLabel: string;
  hours: { openTime: string; closeTime: string };
  gaps: Gap[];
  rules: SlotRules;
}) {
  const { message } = App.useApp();
  const router = useRouter();
  const starts = startChoices(gaps, rules);
  const firstStart = starts[0] ?? null;
  const [startTime, setStartTime] = useState<string | null>(firstStart);
  const [endTime, setEndTime] = useState<string | null>(
    firstStart ? fromMinutes(toMinutes(firstStart)! + rules.minBookingMinutes) : null,
  );
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const ends = startTime ? endChoices(gaps, startTime, rules) : [];
  const open_ = toMinutes(hours.openTime)!;
  const close = toMinutes(hours.closeTime)!;
  const wholeDayFree = gaps.some((g) => g.start === open_ && g.end === close);

  function pickStart(next: string) {
    setStartTime(next);
    setErrors([]);
    const nextEnds = endChoices(gaps, next, rules);
    if (!endTime || !nextEnds.includes(endTime)) setEndTime(nextEnds[0] ?? null);
  }

  function submit() {
    if (!startTime || !endTime) return;
    setErrors([]);
    startTransition(async () => {
      const result = await createBookingAction({ tableId: table.id, date, startTime, endTime, note });
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      message.success("Booked. An admin will review it.");
      onClose();
      router.refresh();
    });
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={`Book ${table.name}`}
      okText="Book"
      onOk={submit}
      okButtonProps={{ loading: pending, disabled: !startTime || !endTime }}
      cancelButtonProps={{ disabled: pending }}
      destroyOnHidden
    >
      <Flex vertical gap={12}>
        <Typography.Text type="secondary">
          {dateLabel} · open {hours.openTime}–{hours.closeTime}
        </Typography.Text>
        <Form layout="vertical" component="div">
          <Form.Item label="Time" style={{ marginBottom: 12 }}>
            <Flex gap={12} align="center" wrap>
              <Select
                aria-label="Start time"
                style={{ width: 110 }}
                value={startTime}
                options={options(starts)}
                onChange={pickStart}
              />
              <span aria-hidden>–</span>
              <Select
                aria-label="End time"
                style={{ width: 160 }}
                value={endTime}
                options={options(ends)}
                onChange={(t) => {
                  setEndTime(t);
                  setErrors([]);
                }}
              />
              <Button
                disabled={!wholeDayFree}
                title={wholeDayFree ? undefined : "Part of the day is already booked or has passed."}
                onClick={() => {
                  setStartTime(hours.openTime);
                  setEndTime(hours.closeTime);
                  setErrors([]);
                }}
              >
                Whole day
              </Button>
            </Flex>
          </Form.Item>
          <Form.Item label="Note" htmlFor="booking-note" extra="Optional: game system, number of players…" style={{ marginBottom: 0 }}>
            <Input.TextArea
              id="booking-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={BOOKING_NOTE_MAX}
              autoSize={{ minRows: 2, maxRows: 5 }}
            />
          </Form.Item>
        </Form>
        <Typography.Text type="secondary">Your booking stays pending until an admin approves it.</Typography.Text>
        {errors.length > 0 && (
          <Alert type="error" role="alert" message={errors.length === 1 ? errors[0] : <ul style={{ margin: 0, paddingLeft: 16 }}>{errors.map((e) => <li key={e}>{e}</li>)}</ul>} />
        )}
      </Flex>
    </Modal>
  );
}
