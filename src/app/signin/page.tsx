import { redirect } from "next/navigation";
import { getMember } from "@/shared/lib/auth/session";
import { BrandHero } from "@/shared/ui/BrandHero";
import { brand } from "@/shared/ui/theme";
import { SignInButton } from "./SignInButton";

export const metadata = { title: "Sign in · Warband" };

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
    <main
      style={{
        maxWidth: 400,
        margin: "40px auto",
        padding: "32px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        textAlign: "center",
        background: brand.surface,
        border: `1px solid ${brand.line}`,
        borderRadius: 16,
      }}
    >
      <BrandHero as="p" />
      <div>
        <h1 style={{ margin: 0, fontSize: 22 }}>Sign in</h1>
        <p style={{ margin: "4px 0 0", color: brand.muted }}>Sign in to book a table.</p>
      </div>
      {error && (
        <p role="alert" style={{ margin: 0, color: brand.accent }}>
          Sign-in failed. Please try again.
        </p>
      )}
      <SignInButton callbackUrl={target} />
    </main>
  );
}
