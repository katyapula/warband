import Link from "next/link";
import type { CSSProperties } from "react";
import { formatDate } from "@/shared/lib/time";

const ACCENT = "#8b1e1e"; // AppShell colorPrimary

const dayHref = (date: string) => `/?date=${date}`;

const parts = (date: string) => ({
  weekday: formatDate(date, { weekday: "short" }),
  day: formatDate(date, { day: "numeric" }),
  full: formatDate(date, { weekday: "long", day: "numeric", month: "long" }),
});

const arrow: CSSProperties = {
  flex: "0 0 32px",
  display: "grid",
  placeItems: "center",
  fontSize: 22,
  lineHeight: 1,
  textDecoration: "none",
  color: "inherit",
  borderRadius: 6,
};

const todayButton: CSSProperties = {
  justifySelf: "start",
  padding: "2px 10px",
  fontSize: 13,
  border: `1px solid ${ACCENT}`,
  borderRadius: 6,
  color: ACCENT,
  textDecoration: "none",
};

/**
 * One week (Mon–Sun) of dates with ‹ › arrows. Dates outside the viewable
 * range are shown but not linked. Marks under a date: a dot = active day,
 * a ring = the member has a booking that day.
 */
export function DayStrip({
  week,
  selected,
  today,
  isViewable,
  activeDates,
  ownDates,
  pendingCounts,
  warnDates,
  prev,
  next,
}: {
  week: string[];
  selected: string;
  today: string;
  isViewable: (date: string) => boolean;
  activeDates: Set<string>;
  /** Days with the member's own blocking bookings (members only). */
  ownDates: Set<string>;
  /** Admins only: pending (not expired) bookings per date. */
  pendingCounts: Map<string, number>;
  /** Admins only: inactive days that still have bookings (⚠). */
  warnDates: Set<string>;
  prev: string | null;
  next: string | null;
}) {
  const month = formatDate(selected, { month: "long", year: "numeric" });

  return (
    <nav aria-label="Days" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center" }}>
        {selected === today ? (
          <span aria-disabled style={{ ...todayButton, opacity: 0.35 }}>
            Today
          </span>
        ) : (
          <Link href={dayHref(today)} style={todayButton}>
            Today
          </Link>
        )}
        <span style={{ fontSize: 13, opacity: 0.65 }}>{month}</span>
      </div>
      <div style={{ display: "flex", alignItems: "stretch", gap: 4 }}>
        {prev ? (
          <Link href={dayHref(prev)} aria-label="Previous week" style={arrow}>
            ‹
          </Link>
        ) : (
          <span aria-hidden style={{ ...arrow, opacity: 0.2 }}>
            ‹
          </span>
        )}
        <ol
          style={{
            display: "flex",
            flex: 1,
            gap: 4,
            listStyle: "none",
            margin: 0,
            padding: 0,
            minWidth: 0,
          }}
        >
          {week.map((date) => {
            const p = parts(date);
            const isSelected = date === selected;
            const isActive = activeDates.has(date);
            const hasOwn = ownDates.has(date);
            const markColor = isSelected ? "#fff" : ACCENT;
            const pending = pendingCounts.get(date) ?? 0;
            const warn = warnDates.has(date);
            const viewable = isViewable(date);
            const cell: CSSProperties = {
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: "6px 0",
              borderRadius: 8,
              textDecoration: "none",
              color: isSelected ? "#fff" : "inherit",
              background: isSelected ? ACCENT : "transparent",
              border: `1px solid ${date === today && !isSelected ? ACCENT : "transparent"}`,
              opacity: viewable ? 1 : 0.35,
            };
            const content = (
              <>
                {pending > 0 && (
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      top: 2,
                      right: 2,
                      minWidth: 16,
                      height: 16,
                      padding: "0 4px",
                      boxSizing: "border-box",
                      borderRadius: 8,
                      background: "#d48806",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 600,
                      lineHeight: "16px",
                      textAlign: "center",
                    }}
                  >
                    {pending}
                  </span>
                )}
                {warn && (
                  <span aria-hidden style={{ position: "absolute", top: 1, left: 3, fontSize: 12, lineHeight: 1 }}>
                    ⚠
                  </span>
                )}
                <span style={{ fontSize: 12 }}>{p.weekday}</span>
                <span style={{ fontSize: 18, fontWeight: 600 }}>{p.day}</span>
                <span aria-hidden style={{ display: "flex", gap: 3, height: 6 }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: isActive ? markColor : "transparent",
                    }}
                  />
                  {hasOwn && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        boxSizing: "border-box",
                        borderRadius: "50%",
                        border: `1.5px solid ${markColor}`,
                      }}
                    />
                  )}
                </span>
              </>
            );
            const label = `${p.full}${date === today ? ", today" : ""}${isActive ? ", open for booking" : ""}${hasOwn ? ", you have a booking" : ""}${pending ? `, ${pending} pending` : ""}${warn ? ", inactive with bookings" : ""}`;
            return (
              <li key={date} style={{ flex: 1, minWidth: 0 }}>
                {viewable ? (
                  <Link
                    href={dayHref(date)}
                    aria-label={label}
                    aria-current={isSelected ? "date" : undefined}
                    style={cell}
                  >
                    {content}
                  </Link>
                ) : (
                  <span aria-label={label} style={cell}>
                    {content}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        {next ? (
          <Link href={dayHref(next)} aria-label="Next week" style={arrow}>
            ›
          </Link>
        ) : (
          <span aria-hidden style={{ ...arrow, opacity: 0.2 }}>
            ›
          </span>
        )}
      </div>
    </nav>
  );
}
