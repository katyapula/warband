import type { ReactNode } from "react";
import { brand, tint } from "./theme";

export type TagTone = "accent" | "brass" | "moss" | "text" | "muted";

/**
 * A small outlined label in a brand color. Used instead of antd's Tag
 * `color`, whose custom-color tint assumes a light background.
 */
export function BrandTag({ tone, title, children }: { tone: TagTone; title?: string; children: ReactNode }) {
  const color = brand[tone];
  return (
    <span
      title={title}
      style={{
        display: "inline-block",
        padding: "0 7px",
        fontSize: 12,
        lineHeight: "20px",
        whiteSpace: "nowrap",
        borderRadius: 4,
        color,
        border: `1px solid ${color}`,
        background: tint(color, 10),
      }}
    >
      {children}
    </span>
  );
}
