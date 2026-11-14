import { requireAdmin } from "@/shared/lib/auth/session";

// Placeholder admin home; real admin pages arrive in slices 1, 2 and 7.
export default async function AdminPage() {
  const admin = await requireAdmin();

  return (
    <main>
      <h1>Admin</h1>
      <p>Signed in as {admin.name} (admin).</p>
    </main>
  );
}
