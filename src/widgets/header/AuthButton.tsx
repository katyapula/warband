"use client";

import { Avatar, Button, Flex, Typography } from "antd";
import { signIn, signOut } from "next-auth/react";

type Props = { member: { name?: string | null; image?: string | null } | null };

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
      <Avatar src={member.image ?? undefined} alt="">
        {member.name?.[0]}
      </Avatar>
      <Typography.Text>{member.name}</Typography.Text>
      <Button onClick={() => signOut({ callbackUrl: "/" })}>Sign out</Button>
    </Flex>
  );
}
