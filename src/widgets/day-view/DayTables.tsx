"use client";

import { Card, Empty, Flex, Tag, Typography } from "antd";
import Link from "next/link";
import type { ShownStatus } from "@/entities/booking/status";
import { StatusTag } from "@/entities/booking/ui/StatusTag";

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
};

export type DayTable = {
  id: string;
  name: string;
  description: string | null;
  bookings: DayTableBooking[];
};

/** The selected day's tables, each with its bookings in time order. */
export function DayTables({ tables, isAdmin }: { tables: DayTable[]; isAdmin: boolean }) {
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
          extra={t.description && <Typography.Text type="secondary">{t.description}</Typography.Text>}
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
                  </Flex>
                  {(b.note || b.walkInContact) && (
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                      {[b.walkInContact, b.note].filter(Boolean).join(" · ")}
                    </Typography.Text>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </Flex>
  );
}
