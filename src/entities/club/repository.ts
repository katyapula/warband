import "server-only";
import { prisma } from "@/shared/lib/prisma";
import type { ClubInfo, WorkingHours } from "./model";

const SETTINGS_ID = 1;

export type ClubSettingsView = { info: ClubInfo; defaultHours: WorkingHours };

/** The singleton club row, seeded by migration `20261115000000_seed_club_settings`. */
export async function getClubSettings(): Promise<ClubSettingsView> {
  const row = await prisma.clubSettings.findUnique({ where: { id: SETTINGS_ID } });
  if (!row) throw new Error("Club settings row is missing. Run `npm run db:migrate`.");
  return {
    info: { name: row.name, location: row.location, description: row.description },
    defaultHours: { openTime: row.defaultOpenTime, closeTime: row.defaultCloseTime },
  };
}

export async function updateClubInfo(info: ClubInfo): Promise<void> {
  await prisma.clubSettings.update({ where: { id: SETTINGS_ID }, data: info });
}

/** Only prefills days activated later; never touches club days or bookings. */
export async function updateDefaultHours(hours: WorkingHours): Promise<void> {
  await prisma.clubSettings.update({
    where: { id: SETTINGS_ID },
    data: { defaultOpenTime: hours.openTime, defaultCloseTime: hours.closeTime },
  });
}

// ---------- Club days ----------

/** A club day as the app sees it: `date` is the club-local "YYYY-MM-DD". */
export type ClubDayView = WorkingHours & { date: string; isActive: boolean };

// `ClubDay.date` is a Postgres DATE; Prisma reads and writes it as UTC midnight.
const toDb = (date: string) => new Date(`${date}T00:00:00Z`);
const fromDb = (date: Date) => date.toISOString().slice(0, 10);

/** Club day rows (active or not) from `first` to `last`, inclusive, by date. */
export async function listClubDays(first: string, last: string): Promise<ClubDayView[]> {
  const rows = await prisma.clubDay.findMany({
    where: { date: { gte: toDb(first), lte: toDb(last) } },
    orderBy: { date: "asc" },
  });
  return rows.map((r) => ({
    date: fromDb(r.date),
    isActive: r.isActive,
    openTime: r.openTime,
    closeTime: r.closeTime,
  }));
}

/** Creates the day or re-activates it, with these hours. */
export async function activateClubDay(date: string, hours: WorkingHours): Promise<void> {
  await prisma.clubDay.upsert({
    where: { date: toDb(date) },
    create: { date: toDb(date), isActive: true, ...hours },
    update: { isActive: true, ...hours },
  });
}

/** Changes the hours of an active day. False if the day isn't active. */
export async function updateClubDayHours(date: string, hours: WorkingHours): Promise<boolean> {
  const { count } = await prisma.clubDay.updateMany({
    where: { date: toDb(date), isActive: true },
    data: hours,
  });
  return count > 0;
}

/** Keeps the row and its hours so re-activating restores them. False if it wasn't active. */
export async function deactivateClubDay(date: string): Promise<boolean> {
  const { count } = await prisma.clubDay.updateMany({
    where: { date: toDb(date), isActive: true },
    data: { isActive: false },
  });
  return count > 0;
}
