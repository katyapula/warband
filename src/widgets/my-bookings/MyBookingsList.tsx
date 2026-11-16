"use client";

import { Card, Empty, Flex, Tabs, Tag, Typography } from "antd";
import Link from "next/link";
import type { MyBooking } from "@/entities/booking/myBookings";
import { StatusTag } from "@/entities/booking/ui/StatusTag";
import { CancelBookingButton } from "@/features/cancel-booking/CancelBookingButton";
import { formatDate } from "@/shared/lib/time";

function BookingRow({ b }: { b: MyBooking }) {
  const day = formatDate(b.date, { weekday: "short", day: "numeric", month: "short" });
  return (
    <li style={{ padding: "10px 0", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
      <Flex gap={8} align="center" wrap>
        <Link href={`/?date=${b.date}`}>
          <Typography.Text strong style={{ fontVariantNumeric: "tabular-nums" }}>
            {day} · {b.time}
          </Typography.Text>
        </Link>
        <span>{b.tableName}</span>
        <StatusTag status={b.status} />
        {b.onInactiveDay && (
          <Tag color="orange" title="The club deactivated this day after you booked. An admin will sort it out.">
            ⚠ On inactive day
          </Tag>
        )}
        {b.canCancel && (
          <span style={{ marginLeft: "auto" }}>
            <CancelBookingButton bookingId={b.id} time={`${day}, ${b.time}`} />
          </span>
        )}
      </Flex>
      {b.note && (
        <Typography.Text type="secondary" style={{ display: "block", fontSize: 13 }}>
          {b.note}
        </Typography.Text>
      )}
      {b.adminComment && (
        <Typography.Text style={{ display: "block", fontSize: 13 }}>
          <Typography.Text type="secondary">Admin:</Typography.Text> {b.adminComment}
        </Typography.Text>
      )}
    </li>
  );
}

function List({ bookings, empty }: { bookings: MyBooking[]; empty: React.ReactNode }) {
  if (bookings.length === 0) return <Empty description={empty} />;
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {bookings.map((b) => (
        <BookingRow key={b.id} b={b} />
      ))}
    </ul>
  );
}

/** Own bookings: Upcoming (not yet ended) and Past, with status and admin comment. */
export function MyBookingsList({ upcoming, past }: { upcoming: MyBooking[]; past: MyBooking[] }) {
  return (
    <Card title={<h1 style={{ margin: 0, fontSize: 20 }}>My bookings</h1>}>
      <Tabs
        items={[
          {
            key: "upcoming",
            label: `Upcoming (${upcoming.length})`,
            children: (
              <List
                bookings={upcoming}
                empty={
                  <>
                    No upcoming bookings. <Link href="/">Book a table</Link>
                  </>
                }
              />
            ),
          },
          {
            key: "past",
            label: `Past (${past.length})`,
            children: <List bookings={past} empty="No past bookings yet." />,
          },
        ]}
      />
    </Card>
  );
}
