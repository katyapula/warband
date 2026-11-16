import Image from "next/image";
import Link from "next/link";
import { getAttentionSummary } from "@/entities/booking/repository";
import { getConfig } from "@/shared/config";
import { getMember } from "@/shared/lib/auth/session";
import { isAdmin } from "@/shared/lib/auth/roles";
import { AuthButton } from "./AuthButton";

export async function Header() {
  const member = await getMember();
  const attention = isAdmin(member?.role)
    ? await getAttentionSummary(new Date(), getConfig().clubTimeZone)
    : null;

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
        <Link href="/about">About</Link>
        {member && <Link href="/my-bookings">My bookings</Link>}
        {attention && (
          <Link
            href={attention.nextDate ? `/?date=${attention.nextDate}` : "/"}
            style={attention.count ? { fontWeight: 600 } : { opacity: 0.65 }}
            title={attention.count ? "Go to the next day with a booking to act on" : "Nothing to act on"}
          >
            Needs attention ({attention.count})
          </Link>
        )}
        {isAdmin(member?.role) && <Link href="/admin">Admin</Link>}
      </nav>
      <AuthButton member={member ? { username: member.username, image: member.image } : null} />
    </div>
  );
}
