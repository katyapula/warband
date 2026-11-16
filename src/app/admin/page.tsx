import Link from "next/link";
import { requireAdminPage } from "@/shared/lib/auth/session";

export const metadata = { title: "Admin · Warband" };

const sections = [
  { href: "/admin/members", title: "Members", text: "Profiles, admin notes and roles" },
  { href: "/admin/tables", title: "Tables", text: "Add, edit and deactivate tables" },
  { href: "/admin/settings", title: "Settings", text: "Club details and default working hours" },
];

// Admin home: a card per admin area. Plain elements, styled in globals.css (.wb-admin-*).
export default async function AdminPage() {
  const admin = await requireAdminPage("/admin");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ margin: 0 }}>Admin</h2>
        <p className="wb-admin-sub">Signed in as {admin.username}</p>
      </div>
      <ul className="wb-admin-grid">
        {sections.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className="wb-admin-card">
              <span className="wb-admin-card-title">
                {s.title}
                <span aria-hidden className="wb-admin-card-arrow">
                  →
                </span>
              </span>
              <span className="wb-admin-card-text">{s.text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
