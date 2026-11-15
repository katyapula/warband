import Image from "next/image";
import Link from "next/link";
import { getMember } from "@/shared/lib/auth/session";
import { isAdmin } from "@/shared/lib/auth/roles";
import { AuthButton } from "./AuthButton";

export async function Header() {
  const member = await getMember();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <nav style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/" aria-label="Warband home">
          <Image src="/logo.jpg" width={56} height={56} alt="Warband" priority />
        </Link>
        {isAdmin(member?.role) && <Link href="/admin">Admin</Link>}
      </nav>
      <AuthButton member={member ? { name: member.name, image: member.image } : null} />
    </div>
  );
}
