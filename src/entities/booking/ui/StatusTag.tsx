import { BrandTag, type TagTone } from "@/shared/ui/BrandTag";
import type { ShownStatus } from "../status";

const look: Record<ShownStatus, { label: string; tone: TagTone }> = {
  PENDING: { label: "Pending", tone: "brass" },
  APPROVED: { label: "Approved", tone: "moss" },
  CANCELLED: { label: "Cancelled", tone: "muted" },
  EXPIRED: { label: "Expired", tone: "muted" },
  COMPLETED: { label: "Completed", tone: "text" },
};

export function StatusTag({ status }: { status: ShownStatus }) {
  const { label, tone } = look[status];
  return <BrandTag tone={tone}>{label}</BrandTag>;
}
