import Link from "next/link";
import { requireAdmin } from "@/shared/lib/auth/session";

// Admin home; settings (slice 2) and bookings (slice 7) links arrive with their slices.
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
      </ul>
    </main>
  );
}
