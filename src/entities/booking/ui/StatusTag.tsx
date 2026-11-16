"use client";

import { Tag } from "antd";
import type { ShownStatus } from "../status";

const look: Record<ShownStatus, { label: string; color?: string }> = {
  PENDING: { label: "Pending", color: "gold" },
  APPROVED: { label: "Approved", color: "green" },
  REJECTED: { label: "Rejected", color: "red" },
  CANCELLED: { label: "Cancelled" },
  EXPIRED: { label: "Expired" },
  COMPLETED: { label: "Completed", color: "blue" },
};

export function StatusTag({ status }: { status: ShownStatus }) {
  const { label, color } = look[status];
  return <Tag color={color}>{label}</Tag>;
}
