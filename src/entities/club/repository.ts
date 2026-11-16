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
