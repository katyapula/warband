"use client";

import { Alert, App, AutoComplete, Button, Flex, Form, Input, Modal, Select, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ADMIN_COMMENT_MAX } from "@/entities/booking/adminInput";
import {
  matchMembers,
  resolveBooker,
  WALK_IN_CONTACT_MAX,
  WALK_IN_NAME_MAX,
  type BookerOption,
} from "@/entities/booking/booker";
import { endChoices, startChoices, type SlotRules } from "@/entities/booking/gaps";
import { BOOKING_NOTE_MAX } from "@/entities/booking/rules";
import { formatDate, toMinutes } from "@/shared/lib/time";
import {
  adminCreateBookingAction,
  adminUpdateBookingAction,
  tableAvailabilityAction,
  type Availability,
  type BookingFormResult,
} from "./actions";

/** The booking being edited, as the admin day view has it. */
export type EditableBooking = {
  id: string;
  tableId: string;
  date: string;
  startTime: string;
  endTime: string;
  note: string | null;
  adminComment: string | null;
  isWalkIn: boolean;
  /** Member's username or walk-in's name. */
  label: string;
  walkInContact: string | null;
};

export type AdminBookingTarget = { mode: "add"; tableId: string; date: string } | { mode: "edit"; booking: EditableBooking };

const timeLabel = (t: string) => (t === "24:00" ? "24:00 (midnight)" : t);
const toOptions = (times: string[]) => times.map((t) => ({ value: t, label: timeLabel(t) }));
const withValue = (times: string[], value: string | null) =>
  value && !times.includes(value) ? [value, ...times].sort() : times;

/**
 * Admin Add / Edit. Add: booker (a member from the autocomplete, or a typed
 * name that makes a walk-in booking), approved from the start. Edit: the
 * member can't change; walk-in details can; the status is kept.
 */
export function AdminBookingModal({
  target,
  onClose,
  tables,
  dates,
  members,
  rules,
}: {
  target: AdminBookingTarget;
  onClose: () => void;
  tables: { id: string; name: string }[];
  /** Active dates from today to the end of the window. */
  dates: string[];
  members: BookerOption[];
  rules: SlotRules;
}) {
  const { message } = App.useApp();
  const router = useRouter();
  const editing = target.mode === "edit" ? target.booking : null;

  const [bookerText, setBookerText] = useState(editing?.label ?? "");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [contact, setContact] = useState(editing?.walkInContact ?? "");
  const [tableId, setTableId] = useState(editing?.tableId ?? (target.mode === "add" ? target.tableId : ""));
  const [date, setDate] = useState(editing?.date ?? (target.mode === "add" ? target.date : ""));
  const [startTime, setStartTime] = useState<string | null>(editing?.startTime ?? null);
  const [endTime, setEndTime] = useState<string | null>(editing?.endTime ?? null);
  const [note, setNote] = useState(editing?.note ?? "");
  const [adminComment, setAdminComment] = useState(editing?.adminComment ?? "");
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, startLoading] = useTransition();
  const [saving, startSaving] = useTransition();

  /** Loads free times for a table and date; keeps the chosen times if they still fit. */
  function load(nextTable: string, nextDate: string, keepTimes: boolean) {
    startLoading(async () => {
      const a = await tableAvailabilityAction({ tableId: nextTable, date: nextDate, ignoreId: editing?.id ?? null });
      setAvailability(a);
      if (keepTimes) return;
      const starts = startChoices(a.gaps, rules);
      const start = startTime && starts.includes(startTime) ? startTime : (starts[0] ?? null);
      const ends = start ? endChoices(a.gaps, start, rules) : [];
      setStartTime(start);
      setEndTime(endTime && ends.includes(endTime) ? endTime : (ends[0] ?? null));
    });
  }

  useEffect(() => {
    // Edit keeps the booking's own times; Add starts at the first free time.
    load(tableId, date, editing !== null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on open
  }, []);

  const gaps = availability?.gaps ?? [];
  const starts = withValue(startChoices(gaps, rules), startTime);
  const ends = withValue(startTime ? endChoices(gaps, startTime, rules) : [], endTime);
  const hours = availability?.hours ?? null;
  const wholeDayFree = hours !== null && gaps.some((g) => g.start === toMinutes(hours.openTime) && g.end === toMinutes(hours.closeTime));

  const booker = editing ? null : resolveBooker({ text: bookerText, pickedId, contact }, members);
  const bookerMember = booker?.kind === "member" ? members.find((m) => m.id === booker.id) : undefined;
  const dateOptions = (editing && !dates.includes(editing.date) ? [editing.date, ...dates] : dates).map((d) => ({
    value: d,
    label: `${formatDate(d, { weekday: "short", day: "numeric", month: "short" })}${dates.includes(d) ? "" : " (inactive)"}`,
  }));

  function submit() {
    setErrors([]);
    if (!startTime || !endTime) return setErrors(["Pick a start and an end time."]);
    if (!editing && !booker) return setErrors(["Enter who the booking is for."]);
    startSaving(async () => {
      const slot = { tableId, date, startTime, endTime, note, adminComment };
      let result: BookingFormResult;
      if (editing) {
        result = await adminUpdateBookingAction({
          ...slot,
          id: editing.id,
          walkIn: editing.isWalkIn ? { name: bookerText, contact } : undefined,
        });
      } else {
        result = await adminCreateBookingAction({ ...slot, booker });
      }
      if (!result.ok) return setErrors(result.errors);
      message.success(editing ? "Booking saved." : "Booked and approved.");
      onClose();
      router.refresh();
    });
  }

  const tableName = tables.find((t) => t.id === tableId)?.name;
  return (
    <Modal
      open
      onCancel={onClose}
      title={editing ? `Edit booking · ${editing.label}` : `Add booking${tableName ? ` · ${tableName}` : ""}`}
      okText={editing ? "Save" : "Book"}
      onOk={submit}
      okButtonProps={{ loading: saving }}
      cancelButtonProps={{ disabled: saving }}
    >
      <Form layout="vertical" component="div">
        {editing && !editing.isWalkIn ? (
          <Form.Item label="Booker">
            <Typography.Text strong>{editing.label}</Typography.Text>{" "}
            <Typography.Text type="secondary">(member; can&apos;t be changed)</Typography.Text>
          </Form.Item>
        ) : (
          <>
            <Form.Item
              label={editing ? "Walk-in name" : "Booker"}
              htmlFor="booker"
              extra={
                editing
                  ? undefined
                  : bookerMember
                    ? `Member: ${bookerMember.username}${bookerMember.fullName ? ` (${bookerMember.fullName})` : ""}`
                    : booker
                      ? "Not a member: this makes a walk-in booking."
                      : "Type a member's username or name, or a walk-in's name."
              }
              style={{ marginBottom: 12 }}
            >
              {editing ? (
                <Input id="booker" value={bookerText} maxLength={WALK_IN_NAME_MAX} onChange={(e) => setBookerText(e.target.value)} />
              ) : (
                <AutoComplete
                  id="booker"
                  value={bookerText}
                  options={matchMembers(bookerText, members).map((m) => ({
                    value: m.id,
                    label: m.fullName ? `${m.username} · ${m.fullName}` : m.username,
                  }))}
                  onSelect={(id: string) => {
                    setPickedId(id);
                    setBookerText(members.find((m) => m.id === id)?.username ?? "");
                  }}
                  onChange={(text: string) => {
                    // Selecting fires onChange with the id first; onSelect then sets the username.
                    if (members.some((m) => m.id === text)) return;
                    setBookerText(text);
                    setPickedId(null);
                  }}
                  maxLength={WALK_IN_NAME_MAX}
                  autoFocus
                />
              )}
            </Form.Item>
            {(editing?.isWalkIn || booker?.kind === "walkIn") && (
              <Form.Item label="Walk-in contact" htmlFor="walkin-contact" extra="Optional. Only admins see it." style={{ marginBottom: 12 }}>
                <Input
                  id="walkin-contact"
                  value={contact}
                  maxLength={WALK_IN_CONTACT_MAX}
                  placeholder="Phone, Telegram…"
                  onChange={(e) => setContact(e.target.value)}
                />
              </Form.Item>
            )}
          </>
        )}

        <Flex gap={12} wrap>
          <Form.Item label="Table" style={{ marginBottom: 12, minWidth: 160, flex: 1 }}>
            <Select
              aria-label="Table"
              value={tableId}
              options={tables.map((t) => ({ value: t.id, label: t.name }))}
              onChange={(t: string) => {
                setTableId(t);
                load(t, date, false);
              }}
            />
          </Form.Item>
          <Form.Item label="Date" style={{ marginBottom: 12, minWidth: 160, flex: 1 }}>
            <Select
              aria-label="Date"
              value={date}
              options={dateOptions}
              onChange={(d: string) => {
                setDate(d);
                load(tableId, d, false);
              }}
            />
          </Form.Item>
        </Flex>

        <Form.Item
          label="Time"
          style={{ marginBottom: 12 }}
          extra={hours ? `Open ${hours.openTime}–${hours.closeTime}` : availability && "This day isn't active: pick another date to move the booking."}
        >
          <Flex gap={12} align="center" wrap>
            <Select
              aria-label="Start time"
              style={{ width: 110 }}
              loading={loading}
              value={startTime}
              options={toOptions(starts)}
              onChange={(t: string) => {
                setStartTime(t);
                const next = endChoices(gaps, t, rules);
                if (!endTime || !next.includes(endTime)) setEndTime(next[0] ?? null);
              }}
            />
            <span aria-hidden>–</span>
            <Select
              aria-label="End time"
              style={{ width: 160 }}
              loading={loading}
              value={endTime}
              options={toOptions(ends)}
              onChange={setEndTime}
            />
            <Button
              disabled={!wholeDayFree}
              title={wholeDayFree ? undefined : "Part of the day is already booked or has passed."}
              onClick={() => {
                if (!hours) return;
                setStartTime(hours.openTime);
                setEndTime(hours.closeTime);
              }}
            >
              Whole day
            </Button>
          </Flex>
        </Form.Item>

        <Form.Item label="Note" htmlFor="admin-booking-note" style={{ marginBottom: 12 }}>
          <Input.TextArea
            id="admin-booking-note"
            value={note}
            maxLength={BOOKING_NOTE_MAX}
            autoSize={{ minRows: 1, maxRows: 4 }}
            onChange={(e) => setNote(e.target.value)}
          />
        </Form.Item>
        <Form.Item label="Admin comment" htmlFor="admin-booking-comment" extra="The booker and admins see it." style={{ marginBottom: 0 }}>
          <Input.TextArea
            id="admin-booking-comment"
            value={adminComment}
            maxLength={ADMIN_COMMENT_MAX}
            autoSize={{ minRows: 1, maxRows: 4 }}
            onChange={(e) => setAdminComment(e.target.value)}
          />
        </Form.Item>
      </Form>
      {errors.length > 0 && (
        <Alert
          style={{ marginTop: 12 }}
          type="error"
          role="alert"
          message={
            errors.length === 1 ? (
              errors[0]
            ) : (
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )
          }
        />
      )}
    </Modal>
  );
}

