"use client";

import { Button, Card, Empty, Flex, Tag, Typography } from "antd";
import Link from "next/link";
import { useState } from "react";
import type { Gap, SlotRules } from "@/entities/booking/gaps";
import type { ShownStatus } from "@/entities/booking/status";
import { StatusTag } from "@/entities/booking/ui/StatusTag";
import { BookingModal } from "@/features/booking-form/BookingModal";
import { CancelBookingButton } from "@/features/cancel-booking/CancelBookingButton";

/** A booking row, already shaped for the viewer (entities/booking/dayView). */
export type DayTableBooking = {
  id: string;
  time: string; // "12:00–14:00", club-local
  label: string;
  isOwn: boolean;
  isWalkIn: boolean;
  status: ShownStatus | null;
  note: string | null;
  walkInContact: string | null;
  adminComment: string | null;
  canCancel: boolean;
};

export type DayTable = {
  id: string;
  name: string;
  description: string | null;
  bookings: DayTableBooking[];
  /** Free stretches a new booking could take; empty when nothing fits. */
  gaps: Gap[];
};

/** What the Add modal needs about the day. Null when the viewer can't add. */
export type AddContext = {
  date: string;
  dateLabel: string;
  hours: { openTime: string; closeTime: string };
  rules: SlotRules;
} | null;

/** The selected day's tables, each with its bookings in time order. */
export function DayTables({
  tables,
  isAdmin,
  add,
}: {
  tables: DayTable[];
  isAdmin: boolean;
  add: AddContext;
}) {
  const [adding, setAdding] = useState<DayTable | null>(null);

  if (tables.length === 0) {
    return (
      <Empty
        description={
          isAdmin ? (
            <>
              No tables yet. Add them in <Link href="/admin/tables">Admin → Tables</Link>.
            </>
          ) : (
            "No tables yet."
          )
        }
      />
    );
  }

  return (
    <Flex vertical gap={12}>
      {tables.map((t) => (
        <Card
          key={t.id}
          size="small"
          title={t.name}
          extra={
            <Flex gap={12} align="center">
              {t.description && <Typography.Text type="secondary">{t.description}</Typography.Text>}
              {add && t.gaps.length > 0 && (
                <Button size="small" type="primary" onClick={() => setAdding(t)} aria-label={`Add booking on ${t.name}`}>
                  Add
                </Button>
              )}
            </Flex>
          }
        >
          {t.bookings.length === 0 ? (
            <Typography.Text type="secondary">No bookings yet.</Typography.Text>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {t.bookings.map((b, i) => (
                <li
                  key={b.id}
                  style={{
                    padding: "6px 0",
                    borderTop: i ? "1px solid rgba(0,0,0,0.06)" : undefined,
                  }}
                >
                  <Flex gap={8} align="center" wrap>
                    <Typography.Text strong style={{ fontVariantNumeric: "tabular-nums" }}>
                      {b.time}
                    </Typography.Text>
                    <span>{b.label}</span>
                    {isAdmin && b.isWalkIn && <Tag>Walk-in</Tag>}
                    {b.isOwn && !isAdmin && <Tag color="purple">You</Tag>}
                    {b.status && <StatusTag status={b.status} />}
                    {b.canCancel && !isAdmin && (
                      <span style={{ marginLeft: "auto" }}>
                        <CancelBookingButton bookingId={b.id} time={b.time} />
                      </span>
                    )}
                  </Flex>
                  {(b.note || b.walkInContact) && (
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                      {[b.walkInContact, b.note].filter(Boolean).join(" · ")}
                    </Typography.Text>
                  )}
                  {b.adminComment && (
                    <Typography.Text style={{ display: "block", fontSize: 13 }}>
                      <Typography.Text type="secondary">Admin:</Typography.Text> {b.adminComment}
                    </Typography.Text>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
      {add && adding && (
        <BookingModal
          open
          onClose={() => setAdding(null)}
          table={adding}
          date={add.date}
          dateLabel={add.dateLabel}
          hours={add.hours}
          gaps={adding.gaps}
          rules={add.rules}
        />
      )}
    </Flex>
  );
}
