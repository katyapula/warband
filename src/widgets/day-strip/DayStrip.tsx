import Link from "next/link";
import { formatDate } from "@/shared/lib/time";

const dayHref = (date: string) => `/?date=${date}`;

const parts = (date: string) => ({
  weekday: formatDate(date, { weekday: "short" }),
  day: formatDate(date, { day: "numeric" }),
  full: formatDate(date, { weekday: "long", day: "numeric", month: "long" }),
});

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
    <nav aria-label="Days" className="wb-strip">
      <div className="wb-strip-top">
        {selected === today ? (
          <span aria-disabled className="wb-strip-today" data-disabled>
            Today
          </span>
        ) : (
          <Link href={dayHref(today)} className="wb-strip-today">
            Today
          </Link>
        )}
        <span className="wb-strip-month">{month}</span>
      </div>
      <div className="wb-strip-row">
        {prev ? (
          <Link href={dayHref(prev)} aria-label="Previous week" className="wb-strip-arrow">
            ‹
          </Link>
        ) : (
          <span aria-hidden className="wb-strip-arrow" data-disabled>
            ‹
          </span>
        )}
        <ol className="wb-strip-days">
          {week.map((date) => {
            const p = parts(date);
            const isSelected = date === selected;
            const isToday = date === today;
            const isActive = activeDates.has(date);
            const hasOwn = ownDates.has(date);
            const pending = pendingCounts.get(date) ?? 0;
            const warn = warnDates.has(date);
            const viewable = isViewable(date);
            const content = (
              <>
                {pending > 0 && (
                  <span aria-hidden className="wb-day-badge">
                    {pending}
                  </span>
                )}
                {warn && (
                  <span aria-hidden className="wb-day-warn">
                    ⚠
                  </span>
                )}
                <span className="wb-day-weekday">{p.weekday}</span>
                <span className="wb-day-number">{p.day}</span>
                <span aria-hidden className="wb-day-marks">
                  <span className="wb-day-dot" data-on={isActive || undefined} />
                  {hasOwn && <span className="wb-day-ring" />}
                </span>
              </>
            );
            const label = `${p.full}${isToday ? ", today" : ""}${isActive ? ", open for booking" : ""}${hasOwn ? ", you have a booking" : ""}${pending ? `, ${pending} pending` : ""}${warn ? ", inactive with bookings" : ""}`;
            const state = {
              "data-selected": isSelected || undefined,
              "data-today": isToday || undefined,
              "data-active": isActive || undefined,
              "data-disabled": !viewable || undefined,
            };
            return (
              <li key={date}>
                {viewable ? (
                  <Link
                    href={dayHref(date)}
                    aria-label={label}
                    aria-current={isSelected ? "date" : undefined}
                    className="wb-day"
                    {...state}
                  >
                    {content}
                  </Link>
                ) : (
                  <span aria-label={label} className="wb-day" {...state}>
                    {content}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        {next ? (
          <Link href={dayHref(next)} aria-label="Next week" className="wb-strip-arrow">
            ›
          </Link>
        ) : (
          <span aria-hidden className="wb-strip-arrow" data-disabled>
            ›
          </span>
        )}
      </div>
    </nav>
  );
}
