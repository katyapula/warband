import Link from "next/link";
import { requireAdminPage } from "@/shared/lib/auth/session";

// Admin home; day-view admin actions arrive with their slices.
export default async function AdminPage() {
  const admin = await requireAdminPage("/admin");

  return (
    <main>
      <h1>Admin</h1>
      <p>Signed in as {admin.username} (admin).</p>
      <ul>
        <li>
          <Link href="/admin/members">Members</Link>: profiles, admin notes and roles
        </li>
        <li>
          <Link href="/admin/tables">Tables</Link>: add, edit and deactivate tables
        </li>
        <li>
          <Link href="/admin/settings">Settings</Link>: club details and default working hours
        </li>
      </ul>
    </main>
  );
}
