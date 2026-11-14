import { redirect } from "next/navigation";
import { getMember } from "@/shared/lib/auth/session";
import { SignInButton } from "./SignInButton";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  // Only allow same-site relative redirects (not "//evil.example").
  const target = callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/";

  if (await getMember()) redirect(target);

  return (
    <main style={{ maxWidth: 360, margin: "48px auto", textAlign: "center" }}>
      <h1>Sign in</h1>
      <p>Sign in to book a table.</p>
      {error && <p role="alert">Sign-in failed. Please try again.</p>}
      <SignInButton callbackUrl={target} />
    </main>
  );
}
