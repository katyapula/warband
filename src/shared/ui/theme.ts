import { theme as antdTheme, type ThemeConfig } from "antd";

/**
 * Warband colors per mode (docs/DESIGN.md → Brand tokens). Hex values feed
 * antd, which needs real colors to derive hovers and tints; everything else
 * uses `brand` below, which reads the matching CSS variables from
 * globals.css so it follows the system light/dark setting without JS.
 */
export const palette = {
  light: {
    primary: "#8b2a22", // brick: buttons, selected day
    accent: "#8b2a22", // brick as text/lines
    text: "#1f1a17", // ink
    bg: "#f6efe3", // bone
    surface: "#fffdf8", // paper
    brass: "#8a6219",
    moss: "#4f6b3a",
  },
  dark: {
    primary: "#a8382b",
    accent: "#e07a62",
    text: "#efe6d8",
    bg: "#171311",
    surface: "#221c18",
    brass: "#d9a94f",
    moss: "#9cba7a",
  },
} as const;

export type Mode = keyof typeof palette;

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

export function themeFor(mode: Mode): ThemeConfig {
  const p = palette[mode];
  return {
    algorithm: mode === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: p.primary,
      colorLink: p.accent,
      colorText: p.text,
      colorBgLayout: p.bg,
      colorBgContainer: p.surface,
      colorBgElevated: p.surface,
      colorWarning: p.brass,
      colorSuccess: p.moss,
      borderRadius: 8,
      fontFamily: fonts.body,
    },
    components: {
      Layout: { headerBg: "transparent", bodyBg: p.bg },
    },
  };
}
