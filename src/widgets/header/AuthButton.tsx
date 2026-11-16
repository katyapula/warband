"use client";

import { Avatar, Button, Flex, Typography } from "antd";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";

type Props = { member: { username: string; image: string | null } | null };

export function AuthButton({ member }: Props) {
  if (!member) {
    return (
      <Button type="primary" onClick={() => signIn("google")}>
        Sign in with Google
      </Button>
    );
  }

  return (
    <Flex align="center" gap={8}>
      <Link href="/profile" aria-label={`Your profile (${member.username})`}>
        <Flex align="center" gap={8}>
          <Avatar src={member.image ?? undefined} alt="">
            {member.username[0]}
          </Avatar>
          <Typography.Text>{member.username}</Typography.Text>
        </Flex>
      </Link>
      <Button onClick={() => signOut({ callbackUrl: "/" })}>Sign out</Button>
    </Flex>
  );
}
