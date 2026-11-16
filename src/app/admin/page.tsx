import Link from "next/link";
import { requireAdmin } from "@/shared/lib/auth/session";

// Admin home; members (slice 4) and day-view admin actions arrive with their slices.
export default async function AdminPage() {
  const admin = await requireAdmin();

  return (
    <main>
      <h1>Admin</h1>
      <p>Signed in as {admin.name} (admin).</p>
      <ul>
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
