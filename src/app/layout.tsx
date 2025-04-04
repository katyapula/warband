"use client";
import { ReactNode, Suspense } from "react";
import { Layout, Spin } from "antd";
import Image from "next/image";
import Logo from "@assets/logo.jpg";
import { Content, Header } from "antd/es/layout/layout";
import { StyleProvider } from "@ant-design/cssinjs";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<Spin tip="Loading" size="large" />}>
          <StyleProvider hashPriority="high">
            <Layout style={{ background: 0 }}>
              <Header
                style={{ background: 0, textAlign: "center", height: "120px" }}
              >
                <Image
                  src={Logo}
                  width={120}
                  height={120}
                  alt="Logo"
                  priority
                />
              </Header>
              <Content>{children}</Content>
            </Layout>
          </StyleProvider>
        </Suspense>
      </body>
    </html>
  );
}
