"use client";
import { ReactNode } from "react";
import { authPageStyle } from "../../styles/layout";

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <section style={authPageStyle}>{children}</section>;
}
