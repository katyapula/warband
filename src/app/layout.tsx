import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { AppShell } from "@/shared/ui/AppShell";
import { Header } from "@/widgets/header/Header";

export const metadata: Metadata = {
  title: "Warband",
  description: "Book a gaming table at the club",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <AntdRegistry>
          <AppShell header={<Header />}>{children}</AppShell>
        </AntdRegistry>
      </body>
    </html>
  );
}
