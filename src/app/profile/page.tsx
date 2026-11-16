import { notFound } from "next/navigation";
import { getOwnProfile } from "@/entities/user/repository";
import { ProfileForm } from "@/features/edit-profile/ProfileForm";
import { requireMemberPage } from "@/shared/lib/auth/session";

export const metadata = { title: "Profile · Warband" };

export default async function ProfilePage() {
  const member = await requireMemberPage("/profile");
  const profile = await getOwnProfile(member.id);
  if (!profile) notFound();
  return <ProfileForm profile={profile} />;
}
