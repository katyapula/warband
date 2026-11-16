import type { CSSProperties } from "react";
import type { ShownStatus } from "@/entities/booking/status";
import { brand, tint } from "@/shared/ui/theme";
import { hourTicks, timelineSegments, type Hours, type SegmentKind } from "./timeline";

/**
 * Look per kind, so none relies on hue alone: approved is solid, pending is
 * striped, someone else's booking is a light outlined block.
 */
export const segmentStyle: Record<SegmentKind, CSSProperties> = {
  approved: { background: brand.primary },
  pending: { background: `repeating-linear-gradient(135deg, ${brand.brass} 0 3px, var(--wb-brass-light) 3px 6px)` },
  taken: { background: tint(brand.taken, 30), boxShadow: `inset 0 0 0 1.5px ${brand.taken}` },
};

export const segmentLabel: Record<SegmentKind, string> = {
  approved: "Approved",
  pending: "Pending",
  taken: "Booked",
};

/**
 * One table's open hours as a bar, with booked stretches filled. Decorative
 * summary: the booking list under it carries the same facts as text.
 */
export function TableTimeline({
  hours,
  bookings,
}: {
  hours: Hours;
  bookings: { id: string; time: string; startTime: string; endTime: string; status: ShownStatus | null }[];
}) {
  const segments = timelineSegments(hours, bookings);
  const ticks = hourTicks(hours);

  return (
    <div aria-hidden style={{ padding: "4px 0", marginBottom: 4 }}>
      <div
        style={{
          position: "relative",
          height: 12,
          borderRadius: 6,
          background: tint(brand.text, 6),
          boxShadow: `inset 0 0 0 1px ${brand.line}`,
        }}
      >
        {ticks.map((t) => (
          <span
            key={t.label}
            style={{
              position: "absolute",
              left: `${t.left}%`,
              top: 0,
              bottom: 0,
              width: 1,
              background: brand.line,
            }}
          />
        ))}
        {segments.map((s) => {
          const style: CSSProperties = {
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `calc(${s.left}% + 1px)`,
            width: `calc(${s.width}% - 2px)`,
            minWidth: 2,
            borderRadius: 4,
            ...segmentStyle[s.kind],
          };
          return <span key={s.booking.id} style={style} title={`${s.booking.time} · ${segmentLabel[s.kind]}`} />;
        })}
      </div>
      <div style={{ position: "relative", height: 16, marginTop: 2, fontSize: 11, color: brand.muted }}>
        {ticks.map((t, i) => (
          <span
            key={t.label}
            style={{
              position: "absolute",
              left: `${t.left}%`,
              transform: i === 0 && t.left < 3 ? "none" : t.left > 97 ? "translateX(-100%)" : "translateX(-50%)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}
