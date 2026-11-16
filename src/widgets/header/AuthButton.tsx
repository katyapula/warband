"use client";

import { Avatar, Button, Flex } from "antd";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { brand } from "@/shared/ui/theme";

export type AuthMember = { username: string; image: string | null };

/** `tone` is the background it sits on: the dark header bar or a light panel. */
export function AuthButton({ member, tone = "light" }: { member: AuthMember | null; tone?: "dark" | "light" }) {
  if (!member) {
    return (
      <Button type="primary" onClick={() => signIn("google")}>
        Sign in with Google
      </Button>
    );
  }

  const dark = tone === "dark";
  return (
    <Flex align="center" gap={8} wrap>
      <Link
        href="/profile"
        aria-label={`Your profile (${member.username})`}
        style={{ color: dark ? brand.onBar : brand.text }}
      >
        <Flex align="center" gap={8}>
          <Avatar src={member.image ?? undefined} alt="" style={{ background: brand.primary, color: brand.onPrimary }}>
            {member.username[0]}
          </Avatar>
          <span>{member.username}</span>
        </Flex>
      </Link>
      <Button ghost={dark} onClick={() => signOut({ callbackUrl: "/" })}>
        Sign out
      </Button>
    </Flex>
  );
}
