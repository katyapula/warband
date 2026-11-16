import { listMembers } from "@/entities/user/repository";
import { MembersManager, type MemberListRow } from "@/features/manage-members/MembersManager";
import { getConfig } from "@/shared/config";
import { requireAdminPage } from "@/shared/lib/auth/session";
import { roleChangeError } from "@/shared/lib/auth/roles";

export const metadata = { title: "Members · Warband admin" };

export default async function AdminMembersPage() {
  const admin = await requireAdminPage("/admin/members");
  const { adminEmails } = getConfig();
  const members = await listMembers();

  const rows: MemberListRow[] = members.map((m) => ({
    id: m.id,
    email: m.email,
    username: m.username,
    fullName: m.fullName,
    phone: m.phone,
    telegram: m.telegram,
    adminNotes: m.adminNotes,
    role: m.role,
    isYou: m.id === admin.id,
    // Why the role button is disabled, if it is.
    roleLock: roleChangeError(admin, m, m.role === "ADMIN" ? "MEMBER" : "ADMIN", adminEmails),
  }));

  return <MembersManager members={rows} />;
}
