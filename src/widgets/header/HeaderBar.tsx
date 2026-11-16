"use client";

import { Button, Drawer } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { Mark } from "@/shared/ui/Mark";
import { brand, fonts, tint } from "@/shared/ui/theme";
import { AuthButton, type AuthMember } from "./AuthButton";

export type NavLink = { href: string; label: string };
export type Attention = { count: number; nextDate: string | null } | null;

const isCurrent = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

/** The dark top bar. Below 720px the links move into a menu drawer (see globals.css). */
export function HeaderBar({
  links,
  attention,
  member,
}: {
  links: NavLink[];
  attention: Attention;
  member: AuthMember | null;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="wb-header">
      <Link href="/" aria-label="Warband home" className="wb-brand" style={{ fontFamily: fonts.display }}>
        <Mark size={36} />
        <span>WARBAND</span>
      </Link>

      <nav aria-label="Main" className="wb-nav-wide">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="wb-nav-link"
            aria-current={isCurrent(pathname, l.href) ? "page" : undefined}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <span style={{ flex: 1 }} />

      {attention && <AttentionPill attention={attention} />}

      <div className="wb-nav-wide">
        <AuthButton member={member} tone="dark" />
      </div>

      <Button
        className="wb-nav-narrow"
        type="text"
        aria-label="Menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(true)}
        style={{ color: brand.onBar }}
        icon={<MenuIcon />}
      />

      <Drawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        placement="right"
        size={280}
        title="Menu"
      >
        <nav aria-label="Main" style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 24 }}>
          {links.map((l) => {
            const current = isCurrent(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                aria-current={current ? "page" : undefined}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  fontSize: 16,
                  color: current ? brand.accent : brand.text,
                  background: current ? tint(brand.accent, 8) : undefined,
                  fontWeight: current ? 600 : undefined,
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <AuthButton member={member} tone="light" />
      </Drawer>
    </div>
  );
}

function AttentionPill({ attention }: { attention: NonNullable<Attention> }) {
  const { count, nextDate } = attention;
  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "2px 10px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: "nowrap",
    textDecoration: "none",
    ...(count
      ? { background: brand.brass, color: brand.surface }
      : { border: `1px solid ${tint(brand.onBar, 35)}`, color: brand.onBarMuted }),
  };
  return (
    <Link
      href={nextDate ? `/?date=${nextDate}` : "/"}
      style={style}
      title={count ? "Go to the next day with a booking to act on" : "Nothing to act on"}
      aria-label={`Needs attention: ${count}`}
    >
      <span className="wb-nav-wide-inline">Needs attention</span>
      <span>{count}</span>
    </Link>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
