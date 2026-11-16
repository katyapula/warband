"use client";

import { Button, Card, Flex, Typography } from "antd";
import { useState } from "react";
import type { Gap, SlotRules } from "@/entities/booking/gaps";
import type { ShownStatus } from "@/entities/booking/status";
import { StatusTag } from "@/entities/booking/ui/StatusTag";
import { MemberCardModal, type MemberCard } from "@/entities/user/ui/MemberCardModal";
import type { BookerOption } from "@/entities/booking/booker";
import { AdminBookingModal, type AdminBookingTarget } from "@/features/booking-form/AdminBookingModal";
import { BookingModal } from "@/features/booking-form/BookingModal";
import { CancelBookingButton } from "@/features/cancel-booking/CancelBookingButton";
import { AdminBookingActions } from "@/features/review-booking/AdminBookingActions";
import { BrandTag } from "@/shared/ui/BrandTag";
import { EmptyState } from "@/shared/ui/EmptyState";
import { brand } from "@/shared/ui/theme";
import { segmentFill, segmentLabel, TableTimeline } from "./TableTimeline";
import { segmentKind, type Hours, type SegmentKind } from "./timeline";

/** A booking row, already shaped for the viewer (entities/booking/dayView). */
export type DayTableBooking = {
  id: string;
  time: string; // "12:00–14:00", club-local
  startTime: string;
  endTime: string;
  label: string;
  isOwn: boolean;
  isWalkIn: boolean;
  /** Admins only: the member who booked (null for walk-ins). */
  memberId: string | null;
  status: ShownStatus | null;
  note: string | null;
  walkInContact: string | null;
  adminComment: string | null;
  canCancel: boolean;
  canApprove: boolean;
  canEdit: boolean;
  /** Blocking on a day that isn't active (admins and the booker see ⚠). */
  onInactiveDay: boolean;
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

/** What the admin Add / Edit modal needs. Null for non-admins. */
export type AdminContext = {
  date: string;
  /** Add is offered on days from today to the end of the window. */
  canAdd: boolean;
  /** Active dates from today to the end of the window. */
  dates: string[];
  bookers: BookerOption[];
  rules: SlotRules;
} | null;

/** The selected day's tables, each with its bookings in time order. */
export function DayTables({
  tables,
  isAdmin,
  add,
  admin = null,
  members = {},
  hours = null,
}: {
  tables: DayTable[];
  /** The day's open hours; null on an inactive day (no timeline then). */
  hours?: Hours | null;
  isAdmin: boolean;
  add: AddContext;
  admin?: AdminContext;
  /** Admins only: profiles of the members booked on this day, by id. */
  members?: Record<string, MemberCard>;
}) {
  const [adding, setAdding] = useState<DayTable | null>(null);
  const [viewing, setViewing] = useState<MemberCard | null>(null);
  const [adminTarget, setAdminTarget] = useState<AdminBookingTarget | null>(null);

  if (tables.length === 0) {
    return (
      <EmptyState
        title="No tables yet"
        action={isAdmin ? { href: "/admin/tables", label: "Add tables" } : undefined}
      >
        {isAdmin ? "Add the club's tables so members can book them." : undefined}
      </EmptyState>
    );
  }

  const kinds = new Set<SegmentKind>(
    hours ? tables.flatMap((t) => t.bookings.map((b) => segmentKind(b.status))) : [],
  );

  return (
    <Flex vertical gap={12}>
      {kinds.size > 1 && <TimelineLegend kinds={kinds} />}
      {tables.map((t) => (
        <Card
          key={t.id}
          size="small"
          title={t.name}
          extra={
            <Flex gap={12} align="center">
              {t.description && <Typography.Text type="secondary">{t.description}</Typography.Text>}
              {admin?.canAdd && (
                <Button
                  size="small"
                  type="primary"
                  onClick={() => setAdminTarget({ mode: "add", tableId: t.id, date: admin.date })}
                  aria-label={`Add booking on ${t.name}`}
                >
                  Add
                </Button>
              )}
              {add && t.gaps.length > 0 && (
                <Button size="small" type="primary" onClick={() => setAdding(t)} aria-label={`Add booking on ${t.name}`}>
                  Add
                </Button>
              )}
            </Flex>
          }
        >
          {hours && <TableTimeline hours={hours} bookings={t.bookings} />}
          {t.bookings.length === 0 ? (
            <Typography.Text type="secondary">No bookings yet.</Typography.Text>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {t.bookings.map((b, i) => (
                <li
                  key={b.id}
                  style={{
                    padding: "6px 0",
                    borderTop: i ? `1px solid ${brand.line}` : undefined,
                  }}
                >
                  <Flex gap={8} align="center" wrap>
                    <Typography.Text strong style={{ fontVariantNumeric: "tabular-nums" }}>
                      {b.time}
                    </Typography.Text>
                    {b.memberId && members[b.memberId] ? (
                      <Button
                        type="link"
                        size="small"
                        style={{ padding: 0, height: "auto" }}
                        onClick={() => setViewing(members[b.memberId!]!)}
                        aria-label={`Show ${b.label}'s profile`}
                      >
                        {b.label}
                      </Button>
                    ) : (
                      <span>{b.label}</span>
                    )}
                    {isAdmin && b.isWalkIn && <BrandTag tone="muted">Walk-in</BrandTag>}
                    {b.isOwn && !isAdmin && <BrandTag tone="text">You</BrandTag>}
                    {b.status && <StatusTag status={b.status} />}
                    {b.onInactiveDay && (
                      <BrandTag tone="brass" title="The day was deactivated after this booking was made.">
                        ⚠ On inactive day
                      </BrandTag>
                    )}
                    {admin && (
                      <AdminBookingActions
                        booking={b}
                        onEdit={() =>
                          setAdminTarget({
                            mode: "edit",
                            booking: {
                              id: b.id,
                              tableId: t.id,
                              date: admin.date,
                              startTime: b.startTime,
                              endTime: b.endTime,
                              note: b.note,
                              adminComment: b.adminComment,
                              isWalkIn: b.isWalkIn,
                              label: b.label,
                              walkInContact: b.walkInContact,
                            },
                          })
                        }
                      />
                    )}
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
      {isAdmin && <MemberCardModal member={viewing} onClose={() => setViewing(null)} />}
      {admin && adminTarget && (
        <AdminBookingModal
          target={adminTarget}
          onClose={() => setAdminTarget(null)}
          tables={tables}
          dates={admin.dates}
          members={admin.bookers}
          rules={admin.rules}
        />
      )}
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

const LEGEND_ORDER: SegmentKind[] = ["approved", "pending", "taken"];

function TimelineLegend({ kinds }: { kinds: Set<SegmentKind> }) {
  return (
    <Flex gap={16} wrap style={{ fontSize: 13 }} aria-hidden>
      {LEGEND_ORDER.filter((k) => kinds.has(k)).map((k) => (
        <Flex key={k} gap={6} align="center">
          <span style={{ width: 16, height: 10, borderRadius: 3, background: segmentFill[k] }} />
          {segmentLabel[k]}
        </Flex>
      ))}
    </Flex>
  );
}
