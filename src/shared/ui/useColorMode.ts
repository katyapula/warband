"use client";

import { useSyncExternalStore } from "react";
import type { Mode } from "./theme";

const query = "(prefers-color-scheme: dark)";

const subscribe = (onChange: () => void) => {
  const mql = window.matchMedia(query);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
};

/**
 * The system color scheme. The server renders light; dark-mode browsers
 * switch antd over on hydration (page colors already follow via CSS).
 */
export function useColorMode(): Mode {
  return useSyncExternalStore(
    subscribe,
    () => (window.matchMedia(query).matches ? "dark" : "light"),
    () => "light",
  );
}
