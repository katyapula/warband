"use client";
import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { authPageStyle } from "../../styles/layout";

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <section style={authPageStyle}>{children}</section>
    </SessionProvider>
  );
}
