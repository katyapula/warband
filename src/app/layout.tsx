"use client";
import { ReactNode } from "react";
import { Layout } from "antd";
import { Content } from "antd/es/layout/layout";
import { StyleProvider } from "@ant-design/cssinjs";
import { SessionProvider } from "next-auth/react";
import HeaderComponent from "./components/header/HeaderComponent";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <StyleProvider hashPriority="high">
            <Layout style={{ background: 0 }}>
              <HeaderComponent />
              <Content>{children}</Content>
            </Layout>
          </StyleProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
