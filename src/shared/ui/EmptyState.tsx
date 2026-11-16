import Link from "next/link";
import type { ReactNode } from "react";
import { Mark } from "./Mark";
import { brand, fonts, tint } from "./theme";

/** A quiet, on-brand placeholder: faded helmet, a headline, a line of text, an optional link. */
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        padding: "32px 16px",
        textAlign: "center",
        borderRadius: 12,
        border: `1px dashed ${brand.line}`,
        background: tint(brand.surface, 60),
      }}
    >
      <span style={{ color: brand.muted, opacity: 0.5 }}>
        <Mark size={64} />
      </span>
      <p style={{ margin: 0, fontFamily: fonts.display, fontSize: 20, fontWeight: 600, color: brand.text }}>{title}</p>
      {children && <p style={{ margin: 0, maxWidth: "44ch", color: brand.muted }}>{children}</p>}
      {action && (
        <Link
          href={action.href}
          style={{
            marginTop: 8,
            padding: "6px 16px",
            borderRadius: 999,
            background: brand.primary,
            color: brand.onPrimary,
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
