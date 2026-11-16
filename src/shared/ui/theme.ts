import { theme as antdTheme, type ThemeConfig } from "antd";

/**
 * Warband colors (docs/DESIGN.md → Brand tokens). Dark only. Hex values feed
 * antd, which needs real colors to derive hovers and tints; everything else
 * uses `brand` below, which reads the matching CSS variables in globals.css.
 */
export const palette = {
  primary: "#b3362b", // brick: buttons, selected day
  accent: "#ef7a63", // ember: links, lines and text on dark
  text: "#e6e8ec",
  bg: "#121418", // charcoal
  surface: "#1c1f25",
  brass: "#d9a94f",
  moss: "#8fbf73",
} as const;

const v = (name: string) => `var(--wb-${name})`;

/** CSS-variable colors for inline styles; see globals.css for values. */
export const brand = {
  primary: v("primary"),
  onPrimary: v("on-primary"),
  accent: v("accent"),
  text: v("text"),
  muted: v("muted"),
  bg: v("bg"),
  surface: v("surface"),
  line: v("line"),
  brass: v("brass"),
  moss: v("moss"),
  taken: v("taken"),
  bar: v("bar"),
  onBar: v("on-bar"),
  onBarMuted: v("on-bar-muted"),
} as const;

/** `color` at `percent`% over transparent, for tints. */
export const tint = (color: string, percent: number) => `color-mix(in srgb, ${color} ${percent}%, transparent)`;

/** CSS variables set by next/font in the root layout. */
export const fonts = {
  body: "var(--font-body), system-ui, sans-serif",
  display: "var(--font-display), var(--font-body), sans-serif",
} as const;

export const appTheme: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    colorPrimary: palette.primary,
    colorLink: palette.accent,
    colorText: palette.text,
    colorBgLayout: palette.bg,
    colorBgContainer: palette.surface,
    colorBgElevated: palette.surface,
    colorWarning: palette.brass,
    colorSuccess: palette.moss,
    borderRadius: 8,
    fontFamily: fonts.body,
  },
  components: {
    Layout: { headerBg: "transparent", bodyBg: palette.bg },
  },
};
