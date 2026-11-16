import { getAttentionSummary } from "@/entities/booking/repository";
import { getConfig } from "@/shared/config";
import { getMember } from "@/shared/lib/auth/session";
import { isAdmin } from "@/shared/lib/auth/roles";
import { HeaderBar, type NavLink } from "./HeaderBar";

export async function Header() {
  const member = await getMember();
  const admin = isAdmin(member?.role);
  const attention = admin ? await getAttentionSummary(new Date(), getConfig().clubTimeZone) : null;

  const links: NavLink[] = [
    { href: "/about", label: "About" },
    ...(member ? [{ href: "/my-bookings", label: "My bookings" }] : []),
    ...(admin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <HeaderBar
      links={links}
      attention={attention ? { count: attention.count, nextDate: attention.nextDate } : null}
      member={member ? { username: member.username, image: member.image } : null}
    />
  );
}
