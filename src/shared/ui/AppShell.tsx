"use client";

import { App, ConfigProvider, Layout } from "antd";
import type { ReactNode } from "react";
import { brand, themeFor } from "./theme";
import { useColorMode } from "./useColorMode";

export function AppShell({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <ConfigProvider theme={themeFor(useColorMode())}>
      <App>
        <Layout style={{ minHeight: "100vh" }}>
          <Layout.Header
            style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              height: "auto",
              padding: "0 16px",
              lineHeight: "normal",
              background: brand.bar,
              borderBottom: `1px solid var(--wb-bar-line)`,
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
