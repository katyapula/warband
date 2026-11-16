import { redirect } from "next/navigation";
import { listDayBookings } from "@/entities/booking/repository";
import {
  canChangeDay,
  landingDate,
  resolveDayParam,
  stripNav,
  viewableRange,
  weekOf,
} from "@/entities/club/calendar";
import { getClubSettings, listClubDays } from "@/entities/club/repository";
import { listActiveTables } from "@/entities/table/repository";
import { ClubDayControls } from "@/features/manage-club-days/ClubDayControls";
import { getConfig } from "@/shared/config";
import { getMember } from "@/shared/lib/auth/session";
import { isAdmin as hasAdminRole } from "@/shared/lib/auth/roles";
import { dateInZone, formatDate, timeRangeInZone } from "@/shared/lib/time";
import { DayStrip } from "@/widgets/day-strip/DayStrip";
import { DayTables, type DayTable } from "./DayTables";

const muted = { margin: 0, opacity: 0.65 } as const;

/**
 * Home: club header, day strip, and the selected day (`?date=`) as the
 * viewer may see it. Plain elements here; antd lives in client children.
 */
export async function DayView({ dateParam }: { dateParam: string | string[] | undefined }) {
  const { clubTimeZone: timeZone, bookingWindowDays, slotStepMinutes } = getConfig();
  const now = new Date();
  const today = dateInZone(timeZone, now);
  const member = await getMember();
  const isAdmin = hasAdminRole(member?.role);
  const viewer = member ? { id: member.id, isAdmin } : null;

  const range = viewableRange({ today, windowDays: bookingWindowDays, isAdmin });
  const upcoming = await listClubDays(today, range.last);
  const upcomingActive = upcoming.filter((d) => d.isActive).map((d) => d.date);
  const resolved = resolveDayParam(
    dateParam,
    range,
    landingDate({ today, isAdmin, activeDates: upcomingActive }),
  );
  if (!resolved.ok) redirect("/");
  const date = resolved.date;

  const week = weekOf(date);
  const [settings, weekDays] = await Promise.all([
    getClubSettings(),
    listClubDays(week[0]!, week[6]!),
  ]);
  const day = weekDays.find((d) => d.date === date) ?? null;
  const isActive = day?.isActive ?? false;
  const isPast = date < today;

  let tables: DayTable[] = [];
  if (isActive) {
    const rows = await listActiveTables();
    const bookings = await listDayBookings({
      date,
      tableIds: rows.map((t) => t.id),
      viewer,
      now,
      timeZone,
    });
    tables = rows.map((t) => ({
      ...t,
      bookings: bookings
        .filter((b) => b.tableId === t.id)
        .map((b) => ({
          id: b.id,
          time: timeRangeInZone(b.startsAt, b.endsAt, timeZone),
          label: b.label,
          isOwn: b.isOwn,
          isWalkIn: b.isWalkIn,
          status: b.status,
          note: b.note,
          walkInContact: b.walkInContact,
        })),
    }));
  }

  const { info } = settings;
  const inRange = (d: string) => (range.first === null || d >= range.first) && d <= range.last;
  const { prev, next } = stripNav(date, range);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <header>
        <h1 style={{ margin: 0, fontSize: 24 }}>{info.name}</h1>
        {info.location && <p style={muted}>{info.location}</p>}
      </header>

      <DayStrip
        week={week}
        selected={date}
        today={today}
        isViewable={inRange}
        activeDates={new Set(weekDays.filter((d) => d.isActive).map((d) => d.date))}
        prev={prev}
        next={next}
      />

      <section aria-labelledby="day-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <h2 id="day-title" style={{ margin: 0, fontSize: 20 }}>
            {formatDate(date, { weekday: "long", day: "numeric", month: "long" })}
            {date === today && " · Today"}
          </h2>
          {isActive && day && (
            <p style={muted}>
              Open {day.openTime}–{day.closeTime}
            </p>
          )}
          {isAdmin && !isActive && <p style={muted}>Inactive day: not open for booking.</p>}
          {isAdmin && isPast && <p style={muted}>Past day: read-only.</p>}
        </div>

        {isAdmin && canChangeDay(date, today, bookingWindowDays) && (
          <ClubDayControls
            // Remount when the stored day changes so the hours draft starts fresh.
            key={`${date}|${isActive}|${day?.openTime}|${day?.closeTime}`}
            date={date}
            isActive={isActive}
            hours={day ? { openTime: day.openTime, closeTime: day.closeTime } : settings.defaultHours}
            slotStepMinutes={slotStepMinutes}
          />
        )}

        {isActive ? (
          <DayTables tables={tables} isAdmin={isAdmin} />
        ) : (
          !isAdmin && (
            <p style={{ margin: "24px 0", fontSize: 16 }}>
              {upcomingActive.length === 0
                ? "No days open for booking yet."
                : `Sorry, ${info.name} is chilling today, see you next time.`}
            </p>
          )
        )}
      </section>
    </div>
  );
}
