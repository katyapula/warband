"use client";

import { Card, Flex, Tabs, Typography } from "antd";
import type { ComponentProps } from "react";
import Link from "next/link";
import type { MyBooking } from "@/entities/booking/myBookings";
import { StatusTag } from "@/entities/booking/ui/StatusTag";
import { CancelBookingButton } from "@/features/cancel-booking/CancelBookingButton";
import { formatDate } from "@/shared/lib/time";
import { BrandTag } from "@/shared/ui/BrandTag";
import { EmptyState } from "@/shared/ui/EmptyState";
import { brand } from "@/shared/ui/theme";

function BookingRow({ b }: { b: MyBooking }) {
  const day = formatDate(b.date, { weekday: "short", day: "numeric", month: "short" });
  return (
    <li style={{ padding: "10px 0", borderTop: `1px solid ${brand.line}` }}>
      <Flex gap={8} align="center" wrap>
        <Link href={`/?date=${b.date}`}>
          <Typography.Text strong style={{ fontVariantNumeric: "tabular-nums" }}>
            {day} · {b.time}
          </Typography.Text>
        </Link>
        <span>{b.tableName}</span>
        <StatusTag status={b.status} />
        {b.onInactiveDay && (
          <BrandTag tone="brass" title="The club deactivated this day after you booked. An admin will sort it out.">
            ⚠ On inactive day
          </BrandTag>
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

function List({ bookings, empty }: { bookings: MyBooking[]; empty: ComponentProps<typeof EmptyState> }) {
  if (bookings.length === 0) return <EmptyState {...empty} />;
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
                empty={{ title: "No upcoming bookings", action: { href: "/", label: "Book a table" } }}
              />
            ),
          },
          {
            key: "past",
            label: `Past (${past.length})`,
            children: <List bookings={past} empty={{ title: "No past bookings yet" }} />,
          },
        ]}
      />
    </Card>
  );
}
