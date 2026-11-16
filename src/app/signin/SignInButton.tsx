"use client";

import { Button } from "antd";
import { signIn } from "next-auth/react";

export function SignInButton({ callbackUrl }: { callbackUrl: string }) {
  return (
    <Button type="primary" size="large" onClick={() => signIn("google", { callbackUrl })}>
      Sign in with Google
    </Button>
  );
}
