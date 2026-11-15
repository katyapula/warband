"use client";

import { App, ConfigProvider, Layout } from "antd";
import type { ReactNode } from "react";

export function AppShell({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#8b1e1e", borderRadius: 6 } }}>
      <App>
        <Layout style={{ minHeight: "100vh" }}>
          <Layout.Header
            style={{
              background: "transparent",
              height: "auto",
              padding: "12px 16px",
              borderBottom: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            {header}
          </Layout.Header>
          <Layout.Content style={{ padding: 16, maxWidth: 1200, width: "100%", margin: "0 auto" }}>
            {children}
          </Layout.Content>
        </Layout>
      </App>
    </ConfigProvider>
  );
}
