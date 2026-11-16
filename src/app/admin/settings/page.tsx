import { getClubSettings } from "@/entities/club/repository";
import { ClubInfoForm } from "@/features/manage-club-settings/ClubInfoForm";
import { DefaultHoursForm } from "@/features/manage-club-settings/DefaultHoursForm";
import { getConfig } from "@/shared/config";
import { requireAdminPage } from "@/shared/lib/auth/session";

export const metadata = { title: "Settings · Warband admin" };

export default async function AdminSettingsPage() {
  await requireAdminPage("/admin/settings");
  const { info, defaultHours } = await getClubSettings();

  return (
    // Plain elements: antd sub-components like Typography.Title can't be used in a server component.
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <h2 style={{ margin: 0 }}>Settings</h2>
      <ClubInfoForm info={info} />
      <DefaultHoursForm hours={defaultHours} slotStepMinutes={getConfig().slotStepMinutes} />
    </div>
  );
}
