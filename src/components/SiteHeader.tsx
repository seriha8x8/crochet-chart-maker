"use client";

import { useState } from "react";
import Link from "next/link";
import { HeaderAccountControl } from "@/components/HeaderAccountControl";

const NAV_LINKS = [
  { label: "編み方動画", href: "/videos", key: "videos", note: null },
  { label: "編み図メーカー", href: "/editor", key: "editor", note: "PC推奨" },
  { label: "毛糸管理", href: "/yarn/yarns", key: "yarn", note: null },
] as const;

type NavKey = "home" | (typeof NAV_LINKS)[number]["key"];

export function SiteHeader({ current }: { current: NavKey }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-20 border-b"
      style={{ backgroundColor: "#EAF7F2", borderColor: "#5BC8AC33" }}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer available */}
          <img
            src="/image0.jpeg"
            alt="rii's crochet tools"
            className="h-9 w-9 shrink-0 rounded-full object-cover"
            style={{ border: "1.5px solid #5BC8AC" }}
          />
          <span className="whitespace-nowrap text-base font-semibold text-[#2f6f61]">rii&apos;s crochet tools</span>
        </Link>

        {/* Regular width: login control + nav inline. */}
        <div className="hidden items-center gap-4 sm:flex sm:gap-6">
          <HeaderAccountControl />
          <nav className="flex gap-4 text-sm sm:gap-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link.key}
                href={link.href}
                className="whitespace-nowrap"
                style={{ color: link.key === current ? "#5BC8AC" : "#5a6b66", fontWeight: link.key === current ? 600 : 400 }}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Phone width: everything collapses behind a menu button. */}
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md sm:hidden"
          style={{ color: "#3D6B5C" }}
          aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t px-4 py-4 sm:hidden" style={{ borderColor: "#5BC8AC33" }}>
          <div className="mb-4">
            <HeaderAccountControl />
          </div>
          <nav className="flex flex-col gap-3 text-sm">
            {NAV_LINKS.map((link) => (
              <a
                key={link.key}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{ color: link.key === current ? "#5BC8AC" : "#3D6B5C", fontWeight: link.key === current ? 600 : 500 }}
              >
                {link.label}
                {link.note && <span className="ml-1.5 text-xs font-normal text-[#7FA99A]">（{link.note}）</span>}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M5 5l12 12M17 5L5 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
