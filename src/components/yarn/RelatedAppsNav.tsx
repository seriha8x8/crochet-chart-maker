"use client";

import Link from "next/link";

const LINKS = [
  { key: "yarn", label: "毛糸管理", href: "/yarn/yarns" },
  { key: "works", label: "作品管理", href: "/works" },
] as const;

/** 毛糸管理 and 作品管理 are separate apps sharing the same data (a 作品 can reference
 *  the 毛糸 used in it, and vice versa), so each one's layout shows this strip to make
 *  the other easy to find. */
export function RelatedAppsNav({ current }: { current: (typeof LINKS)[number]["key"] }) {
  return (
    <header className="border-b border-[#5BC8AC33]">
      <div className="h-1 bg-gradient-to-r from-[#5BC8AC] via-[#98DBC6] to-[#F18D9E]" />
      <div className="mx-auto flex max-w-4xl items-center px-4 py-3">
        <nav className="flex items-center gap-4 text-sm font-medium">
          {LINKS.map((link) => (
            <Link key={link.key} href={link.href} className={link.key === current ? "text-[#5BC8AC]" : "hover:text-[#5BC8AC]"}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
