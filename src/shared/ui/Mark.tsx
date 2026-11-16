import { useId } from "react";

/**
 * The Warband helmet, drawn in `currentColor` so it works on light and dark
 * backgrounds. Same drawing as public/brand/mark.svg.
 */
export function Mark({ size = 40, title }: { size?: number; title?: string }) {
  // Several marks can share a page; each needs its own mask id.
  const maskId = `wb-mark-cut-${useId()}`;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <defs>
        <mask id={maskId}>
          <rect width="64" height="64" fill="#fff" />
          <rect x="27.4" y="18" width="1.6" height="25" fill="#000" />
          <rect x="35" y="18" width="1.6" height="25" fill="#000" />
          <circle cx="32" cy="27" r="1.7" fill="#000" />
          <circle cx="32" cy="33.5" r="1.7" fill="#000" />
          <rect x="9" y="42.2" width="46" height="1.6" fill="#000" />
          <circle cx="16" cy="48" r="1.7" fill="#000" />
          <circle cx="24" cy="48.6" r="1.7" fill="#000" />
          <circle cx="32" cy="48.8" r="1.7" fill="#000" />
          <circle cx="40" cy="48.6" r="1.7" fill="#000" />
          <circle cx="48" cy="48" r="1.7" fill="#000" />
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>
        <path d="M18.5 33 C9 31 3.5 22 6 7 C9 17 14.5 22.5 23 24 Z" />
        <path d="M45.5 33 C55 31 60.5 22 58 7 C55 17 49.5 22.5 41 24 Z" />
        <path d="M13 43 C13 28 21 18 32 18 C43 18 51 28 51 43 Z" />
        <path d="M9 43 L55 43 L55 50 Q32 55 9 50 Z" />
      </g>
    </svg>
  );
}
