import { listMyBookings } from "@/entities/booking/repository";
import { getConfig } from "@/shared/config";
import { requireMemberPage } from "@/shared/lib/auth/session";
import { isAdmin } from "@/shared/lib/auth/roles";
import { MyBookingsList } from "@/widgets/my-bookings/MyBookingsList";

export const metadata = { title: "My bookings · Warband" };
// Statuses are derived from the current time.
export const dynamic = "force-dynamic";

export default async function MyBookingsPage() {
  const member = await requireMemberPage("/my-bookings");
  const { upcoming, past } = await listMyBookings({
    actor: { id: member.id, isAdmin: isAdmin(member.role) },
    now: new Date(),
    timeZone: getConfig().clubTimeZone,
  });
  return <MyBookingsList upcoming={upcoming} past={past} />;
}
