import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Oswald } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { AppShell } from "@/shared/ui/AppShell";
import { Header } from "@/widgets/header/Header";
import "./globals.css";

const body = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-body" });
const display = Oswald({ subsets: ["latin", "cyrillic"], weight: ["500", "600"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Warband",
  description: "Book a gaming table at the club",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body>
        <AntdRegistry>
          <AppShell header={<Header />}>{children}</AppShell>
        </AntdRegistry>
      </body>
    </html>
  );
}
